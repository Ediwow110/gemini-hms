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
const USER_ROLE_STATUS_ACTIVE = 'ACTIVE';
const USER_ROLE_STATUS_REVOKED = 'REVOKED';
const PRIVILEGED_PERMISSION = 'admin.role.change';
const DIRECT_BLOCKED_PERMISSION_KEYS = new Set<string>([
  'admin.role.change',
  'approval.request.process',
  'billing.refund.approve',
  'inventory.adjust.approve',
  'billing.reversal.apply',
  'patient.merge.approve',
  'patient.merge.request',
  'billing.claim.process',
  'lab.result.approve',
  'lab.result.release',
  'audit.view',
  'report.export',
]);

type AdminRoleTarget = Prisma.RoleGetPayload<{
  include: {
    rolePermissions: { include: { permission: true } };
  };
}>;

type AdminPermissionTarget = Prisma.PermissionGetPayload<Record<string, never>>;

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

export interface AdminUserRoleMutationResponse {
  userId: string;
  email: string;
  tenantId: string;
  branchId?: string;
  userStatus: string;
  tokenVersion: number;
  deactivatedAt: Date | null;
  role: {
    id: string;
    name: string;
  };
  assignmentStatus: string;
}

export interface AdminRolePermissionMutationResponse {
  roleId: string;
  roleName: string;
  permissionId: string;
  permissionName: string;
  affectedUserIds: string[];
  affectedUserCount: number;
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

  async assignUserRole(
    actor: RequestUser,
    targetUserId: string,
    roleId: string,
    reason: string,
  ): Promise<AdminUserRoleMutationResponse> {
    const trimmedReason = this.validateReason(reason);
    const normalizedRoleId = this.validateRoleId(roleId);
    this.assertActorCanTarget(actor, targetUserId);

    return this.prisma.$transaction(async (tx) => {
      const target = await this.getScopedTarget(tx, actor, targetUserId);
      this.assertNonPrivilegedTarget(target);

      const role = await this.getRoleForDirectMutation(
        tx,
        actor.tenantId,
        normalizedRoleId,
      );
      const activeRoleAssignments = this.getActiveUserRoleAssignments(target);
      const existingAssignment = activeRoleAssignments.find(
        (assignment) => assignment.roleId === normalizedRoleId,
      );

      if (existingAssignment) {
        throw new ConflictException('Role is already assigned to this user');
      }

      const changedAt = new Date();
      const reactivatedAssignment = await tx.userRole.updateMany({
        where: {
          userId: targetUserId,
          roleId: normalizedRoleId,
          status: { not: USER_ROLE_STATUS_ACTIVE },
        },
        data: {
          status: USER_ROLE_STATUS_ACTIVE,
          revokedAt: null,
          revokedReason: null,
        },
      });

      if (reactivatedAssignment.count === 0) {
        await tx.userRole.create({
          data: {
            userId: targetUserId,
            roleId: normalizedRoleId,
            status: USER_ROLE_STATUS_ACTIVE,
          },
        });
      }

      const userUpdate = await tx.user.updateMany({
        where: {
          id: targetUserId,
          tenantId: actor.tenantId,
          ...this.getBranchMutationScope(actor),
        },
        data: {
          tokenVersion: { increment: 1 },
        },
      });

      if (userUpdate.count === 0) {
        throw new ConflictException(
          'User access scope changed before role assignment',
        );
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
          eventKey: 'USER_ROLE_ASSIGNED',
          recordType: 'UserRole',
          recordId: `${targetUserId}:${normalizedRoleId}`,
          oldValues: this.buildRoleAuditOldValues(target),
          newValues: this.buildRoleAuditNewValues(
            actor,
            targetUserId,
            role,
            updated,
            trimmedReason,
            changedAt,
          ),
        },
        tx,
        branchId,
      );

      return this.toRoleMutationResponse(
        updated,
        role,
        USER_ROLE_STATUS_ACTIVE,
      );
    });
  }

  async revokeUserRole(
    actor: RequestUser,
    targetUserId: string,
    roleId: string,
    reason: string,
  ): Promise<AdminUserRoleMutationResponse> {
    const trimmedReason = this.validateReason(reason);
    const normalizedRoleId = this.validateRoleId(roleId);
    this.assertActorCanTarget(actor, targetUserId);

    return this.prisma.$transaction(async (tx) => {
      const target = await this.getScopedTarget(tx, actor, targetUserId);
      this.assertNonPrivilegedTarget(target);

      const role = await this.getRoleForDirectMutation(
        tx,
        actor.tenantId,
        normalizedRoleId,
      );
      const activeAssignment = this.getActiveUserRoleAssignments(target).find(
        (assignment) => assignment.roleId === normalizedRoleId,
      );

      if (!activeAssignment) {
        throw new ConflictException(
          'Role assignment is not active for this user',
        );
      }

      const changedAt = new Date();
      const revokedAt = new Date();
      const revokeResult = await tx.userRole.updateMany({
        where: {
          userId: targetUserId,
          roleId: normalizedRoleId,
          status: USER_ROLE_STATUS_ACTIVE,
        },
        data: {
          status: USER_ROLE_STATUS_REVOKED,
          revokedAt,
          revokedReason: trimmedReason,
        },
      });

      if (revokeResult.count === 0) {
        throw new ConflictException(
          'Role assignment changed before revocation',
        );
      }

      const userUpdate = await tx.user.updateMany({
        where: {
          id: targetUserId,
          tenantId: actor.tenantId,
          ...this.getBranchMutationScope(actor),
        },
        data: {
          tokenVersion: { increment: 1 },
        },
      });

      if (userUpdate.count === 0) {
        throw new ConflictException(
          'User access scope changed before role revocation',
        );
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
          eventKey: 'USER_ROLE_REVOKED',
          recordType: 'UserRole',
          recordId: `${targetUserId}:${normalizedRoleId}`,
          oldValues: this.buildRoleAuditOldValues(target),
          newValues: this.buildRoleAuditNewValues(
            actor,
            targetUserId,
            role,
            updated,
            trimmedReason,
            changedAt,
          ),
        },
        tx,
        branchId,
      );

      return this.toRoleMutationResponse(
        updated,
        role,
        USER_ROLE_STATUS_REVOKED,
      );
    });
  }

  async grantRolePermission(
    actor: RequestUser,
    roleId: string,
    permissionId: string,
    reason: string,
  ): Promise<AdminRolePermissionMutationResponse> {
    const trimmedReason = this.validateReason(reason);
    const normalizedRoleId = this.validateRoleId(roleId);
    const normalizedPermissionId = this.validatePermissionId(permissionId);
    this.assertTenantWideRoleMutationActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const role = await this.getRoleForDirectMutation(
        tx,
        actor.tenantId,
        normalizedRoleId,
      );
      const permission = await this.getPermissionForDirectMutation(
        tx,
        actor.tenantId,
        normalizedPermissionId,
      );
      const existingPermission = role.rolePermissions.find(
        (assignment) => assignment.permissionId === normalizedPermissionId,
      );

      if (existingPermission) {
        throw new ConflictException(
          'Permission is already assigned to this role',
        );
      }

      const changedAt = new Date();
      await tx.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });

      const affectedUsersBefore = await this.getAffectedActiveUsersForRole(
        tx,
        actor.tenantId,
        role.id,
      );
      await this.incrementAffectedUsersTokenVersion(tx, affectedUsersBefore);

      const updatedRole = await this.getRoleForDirectMutation(
        tx,
        actor.tenantId,
        normalizedRoleId,
      );
      const affectedUsersAfter =
        this.mapAfterTokenVersions(affectedUsersBefore);

      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'ROLE_PERMISSION_GRANTED',
          recordType: 'RolePermission',
          recordId: `${role.id}:${permission.id}`,
          oldValues: this.buildRolePermissionAuditOldValues(
            role,
            affectedUsersBefore,
          ),
          newValues: this.buildRolePermissionAuditNewValues(
            actor,
            updatedRole,
            permission,
            trimmedReason,
            changedAt,
            affectedUsersBefore,
            affectedUsersAfter,
          ),
        },
        tx,
      );

      return this.toRolePermissionMutationResponse(
        updatedRole,
        permission,
        affectedUsersAfter.map((user) => user.id),
      );
    });
  }

  async revokeRolePermission(
    actor: RequestUser,
    roleId: string,
    permissionId: string,
    reason: string,
  ): Promise<AdminRolePermissionMutationResponse> {
    const trimmedReason = this.validateReason(reason);
    const normalizedRoleId = this.validateRoleId(roleId);
    const normalizedPermissionId = this.validatePermissionId(permissionId);
    this.assertTenantWideRoleMutationActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const role = await this.getRoleForDirectMutation(
        tx,
        actor.tenantId,
        normalizedRoleId,
      );
      const permission = await this.getPermissionForDirectMutation(
        tx,
        actor.tenantId,
        normalizedPermissionId,
      );
      const existingPermission = role.rolePermissions.find(
        (assignment) => assignment.permissionId === normalizedPermissionId,
      );

      if (!existingPermission) {
        throw new ConflictException('Permission is not assigned to this role');
      }

      const changedAt = new Date();
      const deleteResult = await tx.rolePermission.deleteMany({
        where: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });

      if (deleteResult.count === 0) {
        throw new ConflictException(
          'Role permission changed before revocation',
        );
      }

      const affectedUsersBefore = await this.getAffectedActiveUsersForRole(
        tx,
        actor.tenantId,
        role.id,
      );
      await this.incrementAffectedUsersTokenVersion(tx, affectedUsersBefore);

      const updatedRole = await this.getRoleForDirectMutation(
        tx,
        actor.tenantId,
        normalizedRoleId,
      );
      const affectedUsersAfter =
        this.mapAfterTokenVersions(affectedUsersBefore);

      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'ROLE_PERMISSION_REVOKED',
          recordType: 'RolePermission',
          recordId: `${role.id}:${permission.id}`,
          oldValues: this.buildRolePermissionAuditOldValues(
            role,
            affectedUsersBefore,
          ),
          newValues: this.buildRolePermissionAuditNewValues(
            actor,
            updatedRole,
            permission,
            trimmedReason,
            changedAt,
            affectedUsersBefore,
            affectedUsersAfter,
          ),
        },
        tx,
      );

      return this.toRolePermissionMutationResponse(
        updatedRole,
        permission,
        affectedUsersAfter.map((user) => user.id),
      );
    });
  }

  private validateReason(reason: string): string {
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new BadRequestException('Reason is required');
    }
    return trimmed;
  }

  private validateRoleId(roleId: string): string {
    const normalizedRoleId = roleId.trim();
    if (!normalizedRoleId) {
      throw new BadRequestException('Role ID is required');
    }
    return normalizedRoleId;
  }

  private validatePermissionId(permissionId: string): string {
    const normalizedPermissionId = permissionId.trim();
    if (!normalizedPermissionId) {
      throw new BadRequestException('Permission ID is required');
    }
    return normalizedPermissionId;
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

  private assertTenantWideRoleMutationActor(actor: RequestUser) {
    if (!actor.userId) {
      throw new ForbiddenException('User context is required');
    }

    if (!this.isSuperAdmin(actor) && actor.branchId) {
      throw new ForbiddenException(
        'Branch-scoped actors cannot mutate tenant-wide role permissions',
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
    const hasPrivilegedRole = this.getActiveUserRoleAssignments(target).some(
      ({ role }) => {
        // Inactive or archived roles are still treated as privileged until a maker-checker flow exists.
        return this.isPrivilegedRole(role);
      },
    );

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

  private getActiveUserRoleAssignments(user: AdminUserTarget) {
    return user.userRoles.filter(
      (assignment) => assignment.status === USER_ROLE_STATUS_ACTIVE,
    );
  }

  private isPrivilegedRole(role: AdminRoleTarget): boolean {
    if (role.name === 'Super Admin') {
      return true;
    }

    return role.rolePermissions.some(
      ({ permission }) => permission.name === PRIVILEGED_PERMISSION,
    );
  }

  private async getRoleForDirectMutation(
    tx: Prisma.TransactionClient,
    tenantId: string,
    roleId: string,
  ): Promise<AdminRoleTarget> {
    const role = await tx.role.findFirst({
      where: { id: roleId, tenantId },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.status !== USER_STATUS_ACTIVE || role.archivedAt !== null) {
      throw new ForbiddenException(
        'Inactive or archived roles cannot be directly assigned',
      );
    }

    if (role.isSystem) {
      throw new ForbiddenException(
        'System roles cannot be directly assigned or revoked',
      );
    }

    if (this.isPrivilegedRole(role)) {
      throw new ForbiddenException(
        'Privileged role changes require maker-checker approval',
      );
    }

    return role;
  }

  private async getPermissionForDirectMutation(
    tx: Prisma.TransactionClient,
    tenantId: string,
    permissionId: string,
  ): Promise<AdminPermissionTarget> {
    const permission = await tx.permission.findFirst({
      where: { id: permissionId, tenantId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (DIRECT_BLOCKED_PERMISSION_KEYS.has(permission.name)) {
      throw new ForbiddenException(
        'High-risk permissions require maker-checker approval',
      );
    }

    return permission;
  }

  private async getAffectedActiveUsersForRole(
    tx: Prisma.TransactionClient,
    tenantId: string,
    roleId: string,
  ) {
    return tx.user.findMany({
      where: {
        tenantId,
        status: USER_STATUS_ACTIVE,
        deactivatedAt: null,
        userRoles: {
          some: {
            roleId,
            status: USER_ROLE_STATUS_ACTIVE,
          },
        },
      },
      select: {
        id: true,
        tokenVersion: true,
      },
    });
  }

  private async incrementAffectedUsersTokenVersion(
    tx: Prisma.TransactionClient,
    affectedUsers: Array<{ id: string; tokenVersion: number }>,
  ) {
    if (affectedUsers.length === 0) {
      return;
    }

    const updateResult = await tx.user.updateMany({
      where: {
        id: { in: affectedUsers.map((user) => user.id) },
      },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    if (updateResult.count !== affectedUsers.length) {
      throw new ConflictException(
        'Affected user token versions changed before role permission update completed',
      );
    }
  }

  private mapAfterTokenVersions(
    affectedUsers: Array<{ id: string; tokenVersion: number }>,
  ) {
    return affectedUsers.map((user) => ({
      id: user.id,
      tokenVersion: user.tokenVersion + 1,
    }));
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

  private buildRoleAuditOldValues(user: AdminUserTarget) {
    return {
      targetUserId: user.id,
      beforeRoles: this.getRoleSummaries(user),
      beforeTokenVersion: user.tokenVersion,
    };
  }

  private buildRolePermissionAuditOldValues(
    role: AdminRoleTarget,
    affectedUsers: Array<{ id: string; tokenVersion: number }>,
  ) {
    return {
      roleId: role.id,
      roleName: role.name,
      beforePermissions: this.getPermissionSummaries(role),
      affectedUserIds: affectedUsers.map((user) => user.id),
      beforeTokenVersions: affectedUsers,
    };
  }

  private buildRoleAuditNewValues(
    actor: RequestUser,
    targetUserId: string,
    role: AdminRoleTarget,
    user: AdminUserTarget,
    reason: string,
    changedAt: Date,
  ) {
    return {
      actorId: actor.userId,
      targetUserId,
      roleId: role.id,
      roleName: role.name,
      reason,
      changedAt: changedAt.toISOString(),
      afterRoles: this.getRoleSummaries(user),
      afterTokenVersion: user.tokenVersion,
    };
  }

  private buildRolePermissionAuditNewValues(
    actor: RequestUser,
    role: AdminRoleTarget,
    permission: AdminPermissionTarget,
    reason: string,
    changedAt: Date,
    affectedUsersBefore: Array<{ id: string; tokenVersion: number }>,
    affectedUsersAfter: Array<{ id: string; tokenVersion: number }>,
  ) {
    return {
      actorId: actor.userId,
      roleId: role.id,
      roleName: role.name,
      permissionId: permission.id,
      permissionName: permission.name,
      reason,
      changedAt: changedAt.toISOString(),
      afterPermissions: this.getPermissionSummaries(role),
      affectedUserIds: affectedUsersBefore.map((user) => user.id),
      beforeTokenVersions: affectedUsersBefore,
      afterTokenVersions: affectedUsersAfter,
    };
  }

  private getRoleSummaries(user: AdminUserTarget) {
    return this.getActiveUserRoleAssignments(user).map(({ role }) => ({
      id: role.id,
      name: role.name,
    }));
  }

  private getPermissionSummaries(role: AdminRoleTarget) {
    return role.rolePermissions.map(({ permission }) => ({
      id: permission.id,
      name: permission.name,
    }));
  }

  private toRoleMutationResponse(
    user: AdminUserTarget,
    role: AdminRoleTarget,
    assignmentStatus: string,
  ): AdminUserRoleMutationResponse {
    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      branchId: this.getSingleBranchId(user),
      userStatus: user.status,
      tokenVersion: user.tokenVersion,
      deactivatedAt: user.deactivatedAt,
      role: {
        id: role.id,
        name: role.name,
      },
      assignmentStatus,
    };
  }

  private toRolePermissionMutationResponse(
    role: AdminRoleTarget,
    permission: AdminPermissionTarget,
    affectedUserIds: string[],
  ): AdminRolePermissionMutationResponse {
    return {
      roleId: role.id,
      roleName: role.name,
      permissionId: permission.id,
      permissionName: permission.name,
      affectedUserIds,
      affectedUserCount: affectedUserIds.length,
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
