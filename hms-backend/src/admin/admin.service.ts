import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types/authenticated-request.type';

const USER_STATUS_ACTIVE = 'ACTIVE';
const USER_STATUS_INACTIVE = 'INACTIVE';
const PRIVILEGED_PERMISSION = 'admin.role.change';

type AdminUserTarget = Prisma.UserGetPayload<{
  include: {
    userBranches: { select: { branchId: true; isActive: true } };
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } };
          };
        };
      };
    };
  };
}>;

export interface AdminUserLifecycleResponse {
  id: string;
  email: string;
  tenantId: string;
  branchId?: string;
  status: string;
  tokenVersion: number;
  deactivatedAt: Date | null;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async deactivateUser(
    actor: RequestUser,
    targetUserId: string,
    reason: string,
  ): Promise<AdminUserLifecycleResponse> {
    const trimmedReason = this.validateReason(reason);
    this.assertActorCanTarget(actor, targetUserId);

    return this.prisma.$transaction(async (tx) => {
      const target = await this.getScopedTarget(tx, actor, targetUserId);
      this.assertNonPrivilegedTarget(target);

      if (target.status !== USER_STATUS_ACTIVE || target.deactivatedAt) {
        throw new ConflictException('User is not active');
      }

      const deactivatedAt = new Date();
      const changedAt = new Date();
      const updateResult = await tx.user.updateMany({
        where: {
          id: targetUserId,
          tenantId: actor.tenantId,
          status: USER_STATUS_ACTIVE,
          deactivatedAt: null,
          ...this.getBranchMutationScope(actor),
        },
        data: {
          status: USER_STATUS_INACTIVE,
          deactivatedAt,
          deactivatedReason: trimmedReason,
          tokenVersion: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('User status changed before deactivation');
      }

      const updated = await this.getUpdatedUser(
        tx,
        actor.tenantId,
        targetUserId,
      );
      const branchId = this.getAuditBranchId(actor, target);

      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'USER_DEACTIVATED',
          recordType: 'User',
          recordId: targetUserId,
          oldValues: this.buildAuditOldValues(target),
          newValues: this.buildAuditNewValues(
            actor,
            targetUserId,
            updated,
            trimmedReason,
            changedAt,
          ),
        },
        tx,
        branchId,
      );

      return this.toLifecycleResponse(updated, target);
    });
  }

  async activateUser(
    actor: RequestUser,
    targetUserId: string,
    reason: string,
  ): Promise<AdminUserLifecycleResponse> {
    const trimmedReason = this.validateReason(reason);
    this.assertActorCanTarget(actor, targetUserId);

    return this.prisma.$transaction(async (tx) => {
      const target = await this.getScopedTarget(tx, actor, targetUserId);
      this.assertNonPrivilegedTarget(target);

      if (target.status === USER_STATUS_ACTIVE && !target.deactivatedAt) {
        throw new ConflictException('User is already active');
      }

      const updateResult = await tx.user.updateMany({
        where: {
          id: targetUserId,
          tenantId: actor.tenantId,
          ...this.getBranchMutationScope(actor),
          OR: [
            { status: { not: USER_STATUS_ACTIVE } },
            { deactivatedAt: { not: null } },
          ],
        },
        data: {
          status: USER_STATUS_ACTIVE,
          deactivatedAt: null,
          deactivatedReason: null,
          tokenVersion: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('User status changed before activation');
      }

      const changedAt = new Date();
      const updated = await this.getUpdatedUser(
        tx,
        actor.tenantId,
        targetUserId,
      );
      const branchId = this.getAuditBranchId(actor, target);

      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'USER_ACTIVATED',
          recordType: 'User',
          recordId: targetUserId,
          oldValues: this.buildAuditOldValues(target),
          newValues: this.buildAuditNewValues(
            actor,
            targetUserId,
            updated,
            trimmedReason,
            changedAt,
          ),
        },
        tx,
        branchId,
      );

      return this.toLifecycleResponse(updated, target);
    });
  }

  private validateReason(reason: string): string {
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new BadRequestException('Reason is required');
    }
    return trimmed;
  }

  private assertActorCanTarget(actor: RequestUser, targetUserId: string) {
    if (!actor.userId) {
      throw new ForbiddenException('User context is required');
    }

    if (actor.userId === targetUserId) {
      throw new ForbiddenException(
        'Self user lifecycle changes are not allowed',
      );
    }
  }

  private async getScopedTarget(
    tx: Prisma.TransactionClient,
    actor: RequestUser,
    targetUserId: string,
  ): Promise<AdminUserTarget> {
    const target = await tx.user.findFirst({
      where: { id: targetUserId, tenantId: actor.tenantId },
      include: {
        userBranches: {
          select: { branchId: true, isActive: true },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (!this.isSuperAdmin(actor)) {
      this.assertBranchVisible(actor, target);
    }

    return target;
  }

  private async getUpdatedUser(
    tx: Prisma.TransactionClient,
    tenantId: string,
    targetUserId: string,
  ): Promise<AdminUserTarget> {
    const updated = await tx.user.findFirst({
      where: { id: targetUserId, tenantId },
      include: {
        userBranches: {
          select: { branchId: true, isActive: true },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return updated;
  }

  private assertBranchVisible(actor: RequestUser, target: AdminUserTarget) {
    if (!actor.branchId) {
      throw new ForbiddenException('Branch context is required');
    }

    const activeBranchIds = this.getActiveBranchIds(target);
    if (activeBranchIds.length !== 1 || activeBranchIds[0] !== actor.branchId) {
      throw new ForbiddenException('Access denied');
    }
  }

  private assertNonPrivilegedTarget(target: AdminUserTarget) {
    const hasPrivilegedRole = target.userRoles.some(({ role }) => {
      // Inactive or archived roles are still treated as privileged until a maker-checker flow exists.
      if (role.name === 'Super Admin') {
        return true;
      }

      return role.rolePermissions.some(
        ({ permission }) => permission.name === PRIVILEGED_PERMISSION,
      );
    });

    if (hasPrivilegedRole) {
      throw new ForbiddenException(
        'Privileged user lifecycle changes require maker-checker approval',
      );
    }
  }

  private isSuperAdmin(actor: RequestUser): boolean {
    return actor.roles?.includes('Super Admin') ?? false;
  }

  private getActiveBranchIds(user: AdminUserTarget): string[] {
    return user.userBranches
      .filter((assignment) => assignment.isActive)
      .map((assignment) => assignment.branchId);
  }

  private getSingleBranchId(user: AdminUserTarget): string | undefined {
    const activeBranchIds = this.getActiveBranchIds(user);
    return activeBranchIds.length === 1 ? activeBranchIds[0] : undefined;
  }

  private getAuditBranchId(
    actor: RequestUser,
    target: AdminUserTarget,
  ): string | undefined {
    return actor.branchId ?? this.getSingleBranchId(target);
  }

  private getBranchMutationScope(actor: RequestUser): Prisma.UserWhereInput {
    if (this.isSuperAdmin(actor)) {
      return {};
    }

    if (!actor.branchId) {
      throw new ForbiddenException('Branch context is required');
    }

    return {
      userBranches: {
        some: { branchId: actor.branchId, isActive: true },
      },
      NOT: {
        userBranches: {
          some: {
            isActive: true,
            branchId: { not: actor.branchId },
          },
        },
      },
    };
  }

  private toLifecycleResponse(
    user: AdminUserTarget,
    branchSource: AdminUserTarget,
  ): AdminUserLifecycleResponse {
    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      branchId: this.getSingleBranchId(branchSource),
      status: user.status,
      tokenVersion: user.tokenVersion,
      deactivatedAt: user.deactivatedAt,
    };
  }

  private buildAuditOldValues(user: AdminUserTarget) {
    return {
      before: this.sanitizeAuditUser(user),
    };
  }

  private buildAuditNewValues(
    actor: RequestUser,
    targetUserId: string,
    user: AdminUserTarget,
    reason: string,
    changedAt: Date,
  ) {
    return {
      actorId: actor.userId,
      targetUserId,
      reason,
      changedAt: changedAt.toISOString(),
      after: this.sanitizeAuditUser(user),
    };
  }

  private sanitizeAuditUser(user: AdminUserTarget) {
    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      branchId: this.getSingleBranchId(user),
      status: user.status,
      tokenVersion: user.tokenVersion,
      deactivatedAt: user.deactivatedAt,
      deactivatedReason: user.deactivatedReason,
    };
  }
}
