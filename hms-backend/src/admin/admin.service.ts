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
import * as bcrypt from 'bcrypt';
import { PrivilegedUserProfileUpdateDto } from './dto/user-lifecycle.dto';

const USER_STATUS_ACTIVE = 'ACTIVE';
const USER_STATUS_INACTIVE = 'INACTIVE';
const USER_ROLE_STATUS_ACTIVE = 'ACTIVE';
const USER_ROLE_STATUS_REVOKED = 'REVOKED';
const PRIVILEGED_PERMISSION = 'admin.role.change';
const DIRECT_BLOCKED_PERMISSION_KEYS = new Set<string>(['admin.role.change']);
const DIRECT_ALLOWED_PERMISSION_RISK = 'LOW';
const APPROVAL_STATUS_PENDING = 'PENDING';
const APPROVAL_STATUS_APPROVED = 'APPROVED';
const APPROVAL_STATUS_REJECTED = 'REJECTED';
const PRIVILEGED_ASSIGN_REQUEST_TYPE = 'ADMIN_PRIVILEGED_ROLE_ASSIGN';
const PRIVILEGED_REVOKE_REQUEST_TYPE = 'ADMIN_PRIVILEGED_ROLE_REVOKE';
const PRIVILEGED_USER_DEACTIVATE = 'PRIVILEGED_USER_DEACTIVATE';
const PRIVILEGED_USER_ACTIVATE = 'PRIVILEGED_USER_ACTIVATE';
const PRIVILEGED_USER_PROFILE_UPDATE = 'PRIVILEGED_USER_PROFILE_UPDATE';
const ADMIN_ROLE_PERMISSION_GRANT = 'ADMIN_ROLE_PERMISSION_GRANT';
const ADMIN_ROLE_PERMISSION_REVOKE = 'ADMIN_ROLE_PERMISSION_REVOKE';

type AdminRoleTarget = Prisma.RoleGetPayload<{
  include: {
    rolePermissions: { include: { permission: true } };
  };
}>;

type AdminPermissionTarget = Prisma.PermissionGetPayload<Record<string, never>>;

type ApprovalAction =
  | typeof PRIVILEGED_ASSIGN_REQUEST_TYPE
  | typeof PRIVILEGED_REVOKE_REQUEST_TYPE
  | typeof PRIVILEGED_USER_DEACTIVATE
  | typeof PRIVILEGED_USER_ACTIVATE
  | typeof PRIVILEGED_USER_PROFILE_UPDATE
  | typeof ADMIN_ROLE_PERMISSION_GRANT
  | typeof ADMIN_ROLE_PERMISSION_REVOKE;

type PrivilegedRoleChangeDetails = Prisma.InputJsonObject & {
  action:
    | typeof PRIVILEGED_ASSIGN_REQUEST_TYPE
    | typeof PRIVILEGED_REVOKE_REQUEST_TYPE;
  tenantId: string;
  branchId: string | null;
  targetUserId: string;
  roleId: string;
  roleName: string;
  requesterId: string;
  reason: string;
  requestedAt: string;
  targetUserSnapshot: {
    status: string;
    tokenVersion: number;
    activeRoles: Array<{ id: string; name: string }>;
  };
  roleSnapshot: {
    status: string;
    isSystem: boolean;
    privileged: boolean;
    archivedAt: string | null;
  };
};

type PrivilegedUserChangeDetails = Prisma.InputJsonObject & {
  action:
    | typeof PRIVILEGED_USER_DEACTIVATE
    | typeof PRIVILEGED_USER_ACTIVATE
    | typeof PRIVILEGED_USER_PROFILE_UPDATE;
  tenantId: string;
  branchId: string | null;
  targetUserId: string;
  requesterId: string;
  reason: string;
  requestedAt: string;
  targetUserSnapshot: {
    status: string;
    email: string;
    mfaEnabled: boolean;
    tokenVersion: number;
    activeRoles: Array<{ id: string; name: string }>;
  };
  requestedChanges: {
    email?: string;
    mfaEnabled?: boolean;
    deactivationReason?: string;
  };
};

type RolePermissionChangeAction =
  | typeof ADMIN_ROLE_PERMISSION_GRANT
  | typeof ADMIN_ROLE_PERMISSION_REVOKE;

type RolePermissionChangeDetails = Prisma.InputJsonObject & {
  action: RolePermissionChangeAction;
  tenantId: string;
  branchId: string | null;
  roleId: string;
  roleName: string;
  permissionId: string;
  permissionName: string;
  permissionRiskLevel: string;
  requesterId: string;
  reason: string;
  requestedAt: string;
  roleSnapshot: {
    status: string;
    isSystem: boolean;
    archivedAt: string | null;
    activePermissions: Array<{ id: string; name: string }>;
  };
  permissionSnapshot: {
    riskLevel: string;
    name: string;
  };
};

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

export interface PrivilegedUserChangeRequestResponse {
  requestId: string;
  targetUserId: string;
  action: PrivilegedUserChangeAction;
  status: string;
}

export interface PrivilegedUserChangeDecisionResponse {
  requestId: string;
  action: PrivilegedUserChangeAction;
  targetUserId: string;
  approvalStatus: string;
  userStatus: string;
}

type PrivilegedUserChangeAction =
  | typeof PRIVILEGED_USER_DEACTIVATE
  | typeof PRIVILEGED_USER_ACTIVATE
  | typeof PRIVILEGED_USER_PROFILE_UPDATE;

export interface AdminRolePermissionMutationResponse {
  roleId: string;
  roleName: string;
  permissionId: string;
  permissionName: string;
  affectedUserIds: string[];
  affectedUserCount: number;
}

export interface PrivilegedRoleChangeRequestResponse {
  requestId: string;
  targetUserId: string;
  roleId: string;
  roleName: string;
  action: ApprovalAction;
  status: string;
}

export interface PrivilegedRoleChangeDecisionResponse {
  requestId: string;
  action: ApprovalAction;
  status: string;
  targetUserId: string;
  roleId: string;
  roleName: string;
  approvalStatus: string;
}

export interface PrivilegedRolePermissionChangeRequestResponse {
  requestId: string;
  roleId: string;
  roleName: string;
  permissionId: string;
  permissionName: string;
  action: RolePermissionChangeAction;
  status: string;
}

export interface PrivilegedRolePermissionChangeDecisionResponse {
  requestId: string;
  action: RolePermissionChangeAction;
  status: string;
  roleId: string;
  roleName: string;
  permissionId: string;
  permissionName: string;
  approvalStatus: string;
  affectedUserCount: number;
}

export interface CreateCustomRoleResponse {
  roleId: string;
  name: string;
  status: string;
  isSystem: boolean;
  permissions: Array<{
    id: string;
    name: string;
    riskLevel: string;
  }>;
}

export interface UpdateCustomRoleResponse {
  roleId: string;
  name: string;
  status: string;
  isSystem: boolean;
}

export interface CreateUserResponse {
  userId: string;
  email: string;
  status: string;
  branchIds: string[];
  roleIds: string[];
}

import { MetricsService } from './metrics.service';

export interface AdminUserListItem {
  id: string;
  email: string;
  tenantId: string;
  mfaEnabled: boolean;
  status: string;
  deactivatedAt: Date | null;
  lockedUntil: Date | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{ id: string; name: string; status: string }>;
  branches: Array<{ id: string; name: string; isActive: boolean }>;
}

export interface AdminUserListQuery {
  search?: string;
  status?: string;
  branchId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminRoleListItem {
  id: string;
  name: string;
  status: string;
  isSystem: boolean;
  permissions: Array<{
    id: string;
    name: string;
    scope: string | null;
    riskLevel: string;
  }>;
}

export interface AdminPermissionListItem {
  id: string;
  name: string;
  scope: string | null;
  riskLevel: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly metricsService: MetricsService,
  ) {}

  async createUser(
    actor: RequestUser,
    dto: {
      email: string;
      password: string;
      mfaEnabled?: boolean;
      branchIds: string[];
      roleIds?: string[];
      reason: string;
    },
  ): Promise<CreateUserResponse> {
    const trimmedReason = this.validateReason(dto.reason);
    if (trimmedReason.length < 8) {
      throw new BadRequestException('Reason must be at least 8 characters');
    }

    const email = dto.email.toLowerCase().trim();
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    this.assertTenantWideRoleMutationActor(actor);

    // 1. Check if user already exists in tenant
    const existingUser = await this.prisma.user.findFirst({
      where: {
        tenantId: actor.tenantId,
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists in tenant',
      );
    }

    // 2. Validate branches
    const branches = await this.prisma.branch.findMany({
      where: {
        id: { in: dto.branchIds },
        tenantId: actor.tenantId,
      },
    });

    if (branches.length !== dto.branchIds.length) {
      throw new BadRequestException(
        'One or more branch IDs are invalid or cross-tenant',
      );
    }

    // Branch scoping for non-SuperAdmin
    if (!this.isSuperAdmin(actor) && actor.branchId) {
      if (dto.branchIds.some((id) => id !== actor.branchId)) {
        throw new ForbiddenException(
          'Branch-scoped actors can only assign their own branch',
        );
      }
    }

    // 3. Validate roles
    const roleIds = dto.roleIds || [];
    let validatedRoles: AdminRoleTarget[] = [];
    if (roleIds.length > 0) {
      validatedRoles = await this.prisma.role.findMany({
        where: {
          id: { in: roleIds },
          tenantId: actor.tenantId,
        },
        include: {
          rolePermissions: { include: { permission: true } },
        },
      });

      if (validatedRoles.length !== roleIds.length) {
        throw new BadRequestException(
          'One or more role IDs are invalid or cross-tenant',
        );
      }

      // Prohibit privileged/system roles for direct creation
      for (const role of validatedRoles) {
        if (role.isSystem) {
          throw new ForbiddenException(
            `System role ${role.name} cannot be assigned directly`,
          );
        }
        if (
          role.rolePermissions.some(
            (rp) => rp.permission.name === PRIVILEGED_PERMISSION,
          )
        ) {
          throw new ForbiddenException(
            `Privileged role ${role.name} requires maker-checker flow (deferred)`,
          );
        }
      }
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 5. Transactional Create
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: actor.tenantId,
          email,
          passwordHash,
          mfaEnabled: dto.mfaEnabled ?? false,
          status: USER_STATUS_ACTIVE,
          tokenVersion: 0,
        },
      });

      // Assign branches
      await tx.userBranch.createMany({
        data: dto.branchIds.map((branchId) => ({
          tenantId: actor.tenantId,
          userId: user.id,
          branchId,
          isActive: true,
        })),
      });

      // Assign roles
      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId: user.id,
            roleId,
            status: USER_ROLE_STATUS_ACTIVE,
          })),
        });
      }

      // Audit
      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'ADMIN_USER_CREATED',
          recordType: 'User',
          recordId: user.id,
          newValues: {
            actorId: actor.userId,
            targetUserId: user.id,
            email: user.email,
            branchIds: dto.branchIds,
            roleIds: roleIds,
            mfaEnabled: user.mfaEnabled,
            reason: trimmedReason,
          },
        },
        tx,
        actor.branchId ?? undefined,
      );

      return {
        userId: user.id,
        email: user.email,
        status: user.status,
        branchIds: dto.branchIds,
        roleIds: roleIds,
      };
    });
  }

  async updateUser(
    actor: RequestUser,
    targetUserId: string,
    dto: {
      email?: string;
      mfaEnabled?: boolean;
      reason: string;
    },
  ): Promise<{ userId: string; email: string; mfaEnabled: boolean }> {
    const trimmedReason = this.validateReason(dto.reason);

    if (actor.userId === targetUserId) {
      throw new ForbiddenException(
        'Admins cannot update their own profile via administrative endpoints',
      );
    }

    if (dto.email === undefined && dto.mfaEnabled === undefined) {
      throw new BadRequestException('No update fields provided');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch target user with tenant scoping and branch visibility
      const target = await this.getScopedTarget(tx, actor, targetUserId);

      // 3. Forbidden: Privileged users
      this.assertNonPrivilegedTarget(target);

      // 4. Email uniqueness check if changing
      if (dto.email && dto.email !== target.email) {
        const existing = await tx.user.findFirst({
          where: {
            tenantId: actor.tenantId,
            email: dto.email,
            id: { not: targetUserId },
          },
        });
        if (existing) {
          throw new ConflictException(
            'Email already in use by another user in this tenant',
          );
        }
      }

      // 4. Perform update
      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: {
          email: dto.email ?? target.email,
          mfaEnabled: dto.mfaEnabled ?? target.mfaEnabled,
        },
      });

      // 5. Log Audit
      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'ADMIN_USER_UPDATED',
          recordType: 'User',
          recordId: updated.id,
          oldValues: {
            email: target.email,
            mfaEnabled: target.mfaEnabled,
          },
          newValues: {
            actorId: actor.userId,
            targetUserId: updated.id,
            email: updated.email,
            mfaEnabled: updated.mfaEnabled,
            reason: trimmedReason,
            changedFields: [
              ...(dto.email !== undefined ? ['email'] : []),
              ...(dto.mfaEnabled !== undefined ? ['mfaEnabled'] : []),
            ],
          },
        },
        tx,
        actor.branchId ?? undefined,
      );

      return {
        userId: updated.id,
        email: updated.email,
        mfaEnabled: updated.mfaEnabled,
      };
    });
  }

  async createCustomRole(
    actor: RequestUser,
    name: string,
    reason: string,
    permissionIds?: string[],
  ): Promise<CreateCustomRoleResponse> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Role name is required');
    }
    const trimmedReason = this.validateReason(reason);

    this.assertTenantWideRoleMutationActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const existingRole = await tx.role.findFirst({
        where: {
          tenantId: actor.tenantId,
          name: { equals: trimmedName, mode: 'insensitive' },
        },
      });
      if (existingRole) {
        throw new ConflictException(
          'A role with this name already exists in the tenant',
        );
      }

      const normalizedPermissionIds = (permissionIds ?? []).map((id) => {
        if (typeof id !== 'string') {
          throw new BadRequestException('Invalid permission ID provided');
        }

        const normalized = id.trim();
        if (!normalized) {
          throw new BadRequestException('Invalid permission ID provided');
        }

        return normalized;
      });

      if (
        new Set(normalizedPermissionIds).size !== normalizedPermissionIds.length
      ) {
        throw new BadRequestException('Duplicate permission ID provided');
      }

      let validatedPermissions: AdminPermissionTarget[] = [];

      if (normalizedPermissionIds.length > 0) {
        validatedPermissions = await tx.permission.findMany({
          where: {
            id: { in: normalizedPermissionIds },
            tenantId: actor.tenantId,
          },
        });

        if (validatedPermissions.length !== normalizedPermissionIds.length) {
          throw new BadRequestException(
            'One or more requested permissions do not exist or belong to another tenant',
          );
        }

        for (const perm of validatedPermissions) {
          if (
            perm.name === 'admin.role.change' ||
            DIRECT_BLOCKED_PERMISSION_KEYS.has(perm.name)
          ) {
            throw new ForbiddenException(
              `Permission ${perm.name} requires maker-checker and cannot be assigned during custom role creation`,
            );
          }
          if (perm.riskLevel !== DIRECT_ALLOWED_PERMISSION_RISK) {
            throw new ForbiddenException(
              `Permission ${perm.name} has risk level ${perm.riskLevel} and cannot be assigned during custom role creation (only ${DIRECT_ALLOWED_PERMISSION_RISK} allowed)`,
            );
          }
        }
      }

      const role = await tx.role.create({
        data: {
          tenantId: actor.tenantId,
          name: trimmedName,
          status: USER_STATUS_ACTIVE,
          isSystem: false,
          rolePermissions: {
            create: validatedPermissions.map((p) => ({
              permissionId: p.id,
            })),
          },
        },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      });

      const changedAt = new Date();
      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'ROLE_CREATED',
          recordType: 'Role',
          recordId: role.id,
          newValues: {
            actorId: actor.userId,
            roleId: role.id,
            roleName: role.name,
            reason: trimmedReason,
            tenantId: actor.tenantId,
            branchId: actor.branchId ?? null,
            isSystem: false,
            status: USER_STATUS_ACTIVE,
            permissionIds: validatedPermissions.map((p) => p.id),
            permissionNames: validatedPermissions.map((p) => p.name),
            permissionRiskLevels: validatedPermissions.map((p) => p.riskLevel),
            changedAt: changedAt.toISOString(),
          },
        },
        tx,
        actor.branchId ?? undefined,
      );

      return {
        roleId: role.id,
        name: role.name,
        status: role.status,
        isSystem: role.isSystem,
        permissions: validatedPermissions.map((p) => ({
          id: p.id,
          name: p.name,
          riskLevel: p.riskLevel,
        })),
      };
    });
  }

  async requestPrivilegedRoleAssignment(
    actor: RequestUser,
    targetUserId: string,
    roleId: string,
    reason: string,
  ): Promise<PrivilegedRoleChangeRequestResponse> {
    const trimmedReason = this.validateReason(reason);
    const normalizedRoleId = this.validateRoleId(roleId);
    this.assertActorCanTarget(actor, targetUserId);
    this.assertPrivilegedRoleRequestActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const target = await this.getScopedTarget(tx, actor, targetUserId);
      this.assertRoleChangeTargetUserState(target);
      const role = await this.getRoleForPrivilegedApproval(
        tx,
        actor.tenantId,
        normalizedRoleId,
        'ASSIGN',
      );

      if (this.hasActivePrivilegedRole(target)) {
        throw new ForbiddenException(
          'Target user already holds privileged access and cannot receive another privileged role directly through this request flow',
        );
      }

      const activeAssignment = this.getActiveUserRoleAssignments(target).find(
        (assignment) => assignment.roleId === normalizedRoleId,
      );
      if (activeAssignment) {
        throw new ConflictException('Role is already assigned to this user');
      }

      const request = await this.createPrivilegedRoleChangeRequest(
        tx,
        actor,
        target,
        role,
        trimmedReason,
        PRIVILEGED_ASSIGN_REQUEST_TYPE,
      );

      return this.toPrivilegedRoleChangeRequestResponse(
        request,
        target.id,
        role,
      );
    });
  }

  async requestPrivilegedRoleRevocation(
    actor: RequestUser,
    targetUserId: string,
    roleId: string,
    reason: string,
  ): Promise<PrivilegedRoleChangeRequestResponse> {
    const trimmedReason = this.validateReason(reason);
    const normalizedRoleId = this.validateRoleId(roleId);
    this.assertActorCanTarget(actor, targetUserId);
    this.assertPrivilegedRoleRequestActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const target = await this.getScopedTarget(tx, actor, targetUserId);
      this.assertRoleChangeTargetUserState(target);
      const role = await this.getRoleForPrivilegedApproval(
        tx,
        actor.tenantId,
        normalizedRoleId,
        'REVOKE',
      );

      const activeAssignment = this.getActiveUserRoleAssignments(target).find(
        (assignment) => assignment.roleId === normalizedRoleId,
      );
      if (!activeAssignment) {
        throw new ConflictException(
          'Role assignment is not active for this user',
        );
      }

      const request = await this.createPrivilegedRoleChangeRequest(
        tx,
        actor,
        target,
        role,
        trimmedReason,
        PRIVILEGED_REVOKE_REQUEST_TYPE,
      );

      return this.toPrivilegedRoleChangeRequestResponse(
        request,
        target.id,
        role,
      );
    });
  }

  async approvePrivilegedRoleChange(
    actor: RequestUser,
    requestId: string,
    decisionReason: string,
  ): Promise<PrivilegedRoleChangeDecisionResponse> {
    const trimmedReason = this.validateReason(decisionReason);
    const normalizedRequestId = this.validateRequestId(requestId);
    await this.assertPrivilegedRoleApprovalActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const request = await this.getPendingPrivilegedRoleRequest(
        tx,
        actor.tenantId,
        normalizedRequestId,
      );
      const details = this.parsePrivilegedRoleChangeDetails(request.details);

      this.assertApprovalActors(actor, request, details.targetUserId);

      const target = await this.getScopedTarget(
        tx,
        actor,
        details.targetUserId,
      );
      this.assertRoleChangeTargetUserState(target);
      const role = await this.getRoleForPrivilegedApproval(
        tx,
        actor.tenantId,
        details.roleId,
        details.action === PRIVILEGED_ASSIGN_REQUEST_TYPE ? 'ASSIGN' : 'REVOKE',
      );
      const beforeRoles = this.getRoleSummaries(target);
      const beforeTokenVersion = target.tokenVersion;

      if (details.action === PRIVILEGED_ASSIGN_REQUEST_TYPE) {
        if (this.hasActivePrivilegedRole(target)) {
          throw new ConflictException(
            'Target user already holds privileged access and cannot receive another privileged role',
          );
        }

        const reactivatedAssignment = await tx.userRole.updateMany({
          where: {
            userId: target.id,
            roleId: role.id,
            status: { not: USER_ROLE_STATUS_ACTIVE },
          },
          data: {
            status: USER_ROLE_STATUS_ACTIVE,
            revokedAt: null,
            revokedReason: null,
          },
        });

        if (reactivatedAssignment.count === 0) {
          try {
            await tx.userRole.create({
              data: {
                userId: target.id,
                roleId: role.id,
                status: USER_ROLE_STATUS_ACTIVE,
              },
            });
          } catch (error) {
            if (this.isUniqueConstraintError(error)) {
              throw new ConflictException(
                'Role is already assigned to this user',
              );
            }
            throw error;
          }
        }
      } else {
        const revokeResult = await tx.userRole.updateMany({
          where: {
            userId: target.id,
            roleId: role.id,
            status: USER_ROLE_STATUS_ACTIVE,
          },
          data: {
            status: USER_ROLE_STATUS_REVOKED,
            revokedAt: new Date(),
            revokedReason: details.reason,
          },
        });

        if (revokeResult.count === 0) {
          throw new ConflictException(
            'Role assignment changed before approval could be applied',
          );
        }
      }

      const userUpdate = await tx.user.updateMany({
        where: {
          id: target.id,
          tenantId: actor.tenantId,
        },
        data: {
          tokenVersion: { increment: 1 },
        },
      });

      if (userUpdate.count === 0) {
        throw new ConflictException(
          'Target user changed before approval apply',
        );
      }

      const requestUpdate = await tx.approvalRequest.updateMany({
        where: {
          id: request.id,
          tenantId: actor.tenantId,
          status: APPROVAL_STATUS_PENDING,
        },
        data: {
          status: APPROVAL_STATUS_APPROVED,
          approverId: actor.userId!,
          remarks: trimmedReason,
        },
      });

      if (requestUpdate.count === 0) {
        throw new ConflictException(
          'Approval request changed before approval could be recorded',
        );
      }

      const updated = await this.getUpdatedUser(tx, actor.tenantId, target.id);
      const changedAt = new Date();
      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'PRIVILEGED_ROLE_CHANGE_APPROVED',
          recordType: 'ApprovalRequest',
          recordId: request.id,
          oldValues: {
            approvalRequestId: request.id,
            requesterId: request.requesterId,
            targetUserId: target.id,
            roleId: role.id,
            roleName: role.name,
            action: details.action,
            beforeRoles,
            beforeTokenVersion,
          },
          newValues: {
            approverId: actor.userId,
            requesterId: request.requesterId,
            targetUserId: target.id,
            roleId: role.id,
            roleName: role.name,
            action: details.action,
            decisionReason: trimmedReason,
            decidedAt: changedAt.toISOString(),
            afterRoles: this.getRoleSummaries(updated),
            afterTokenVersion: updated.tokenVersion,
            approvalRequestId: request.id,
          },
        },
        tx,
      );

      return {
        requestId: request.id,
        action: details.action,
        status: updated.status,
        targetUserId: target.id,
        roleId: role.id,
        roleName: role.name,
        approvalStatus: APPROVAL_STATUS_APPROVED,
      };
    });
  }

  async rejectPrivilegedRoleChange(
    actor: RequestUser,
    requestId: string,
    decisionReason: string,
  ): Promise<PrivilegedRoleChangeDecisionResponse> {
    const trimmedReason = this.validateReason(decisionReason);
    const normalizedRequestId = this.validateRequestId(requestId);
    await this.assertPrivilegedRoleApprovalActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const request = await this.getPendingPrivilegedRoleRequest(
        tx,
        actor.tenantId,
        normalizedRequestId,
      );
      const details = this.parsePrivilegedRoleChangeDetails(request.details);

      this.assertApprovalActors(actor, request, details.targetUserId);

      const role = await this.getRoleForPrivilegedApproval(
        tx,
        actor.tenantId,
        details.roleId,
        details.action === PRIVILEGED_ASSIGN_REQUEST_TYPE ? 'ASSIGN' : 'REVOKE',
      );

      const requestUpdate = await tx.approvalRequest.updateMany({
        where: {
          id: request.id,
          tenantId: actor.tenantId,
          status: APPROVAL_STATUS_PENDING,
        },
        data: {
          status: APPROVAL_STATUS_REJECTED,
          approverId: actor.userId!,
          remarks: trimmedReason,
        },
      });

      if (requestUpdate.count === 0) {
        throw new ConflictException(
          'Approval request changed before rejection could be recorded',
        );
      }

      const changedAt = new Date();
      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'PRIVILEGED_ROLE_CHANGE_REJECTED',
          recordType: 'ApprovalRequest',
          recordId: request.id,
          oldValues: {
            approvalRequestId: request.id,
            requesterId: request.requesterId,
            targetUserId: details.targetUserId,
            roleId: role.id,
            roleName: role.name,
            action: details.action,
          },
          newValues: {
            approverId: actor.userId,
            requesterId: request.requesterId,
            targetUserId: details.targetUserId,
            roleId: role.id,
            roleName: role.name,
            action: details.action,
            decisionReason: trimmedReason,
            decidedAt: changedAt.toISOString(),
            approvalRequestId: request.id,
          },
        },
        tx,
      );

      return {
        requestId: request.id,
        action: details.action,
        status: details.targetUserSnapshot.status,
        targetUserId: details.targetUserId,
        roleId: role.id,
        roleName: role.name,
        approvalStatus: APPROVAL_STATUS_REJECTED,
      };
    });
  }

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

  async updateCustomRole(
    actor: RequestUser,
    roleId: string,
    reason: string,
    name?: string,
  ): Promise<UpdateCustomRoleResponse> {
    const trimmedReason = this.validateReason(reason);
    const normalizedRoleId = this.validateRoleId(roleId);

    const trimmedName = name?.trim();
    if (name !== undefined && !trimmedName) {
      throw new BadRequestException('Role name cannot be empty if provided');
    }

    if (name === undefined) {
      throw new BadRequestException('No update fields provided');
    }

    this.assertTenantWideRoleMutationActor(actor);

    return this.prisma.$transaction(async (tx) => {
      // Fetch role with tenant scoping and permissions for privilege check
      const role = await tx.role.findFirst({
        where: {
          id: normalizedRoleId,
          tenantId: actor.tenantId,
        },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // 1. Forbidden: System roles
      if (role.isSystem) {
        throw new ForbiddenException('System roles cannot be updated');
      }

      // 2. Forbidden: Super Admin
      if (role.name === 'Super Admin') {
        throw new ForbiddenException('Super Admin role cannot be updated');
      }

      // 3. Forbidden: Inactive/Archived roles
      if (role.status !== USER_STATUS_ACTIVE || role.archivedAt !== null) {
        throw new ForbiddenException(
          'Only active, non-archived roles can be updated',
        );
      }

      // 4. Forbidden: Roles carrying admin.role.change (Privileged)
      if (
        role.rolePermissions.some(
          (rp) => rp.permission.name === PRIVILEGED_PERMISSION,
        )
      ) {
        throw new ForbiddenException(
          'Roles carrying admin.role.change cannot be updated in this slice',
        );
      }

      // 5. Uniqueness check if name is changing
      if (
        trimmedName &&
        trimmedName.toLowerCase() !== role.name.toLowerCase()
      ) {
        const duplicate = await tx.role.findFirst({
          where: {
            tenantId: actor.tenantId,
            name: { equals: trimmedName, mode: 'insensitive' },
            id: { not: normalizedRoleId },
          },
        });

        if (duplicate) {
          throw new ConflictException(
            'A role with this name already exists in the tenant',
          );
        }
      }

      const updatedRole = await tx.role.update({
        where: { id: normalizedRoleId },
        data: {
          name: trimmedName ?? role.name,
        },
      });

      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'ROLE_UPDATED',
          recordType: 'Role',
          recordId: normalizedRoleId,
          oldValues: {
            name: role.name,
          },
          newValues: {
            actorId: actor.userId,
            name: updatedRole.name,
            reason: trimmedReason,
            tenantId: actor.tenantId,
            branchId: actor.branchId ?? null,
            changedFields: ['name'],
          },
        },
        tx,
        actor.branchId ?? undefined,
      );

      return {
        roleId: updatedRole.id,
        name: updatedRole.name,
        status: updatedRole.status,
        isSystem: updatedRole.isSystem,
      };
    });
  }

  async archiveCustomRole(
    actor: RequestUser,
    roleId: string,
    reason: string,
  ): Promise<{
    roleId: string;
    name: string;
    status: string;
    isSystem: boolean;
    archivedAt: Date;
    affectedUserCount: number;
  }> {
    const trimmedReason = this.validateReason(reason);
    const normalizedRoleId = this.validateRoleId(roleId);
    this.assertTenantWideRoleMutationActor(actor);

    return this.prisma.$transaction(async (tx) => {
      // Fetch the role with tenant scoping
      const role = await tx.role.findFirst({
        where: {
          id: normalizedRoleId,
          tenantId: actor.tenantId,
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Validate role can be archived
      if (role.isSystem) {
        throw new ForbiddenException('System roles cannot be archived');
      }

      // Check if role is Super Admin by name
      if (role.name === 'Super Admin') {
        throw new ForbiddenException('Super Admin role cannot be archived');
      }

      // Check if role already archived
      if (role.archivedAt !== null) {
        throw new ConflictException('Role is already archived');
      }

      if (role.status !== USER_STATUS_ACTIVE) {
        throw new ForbiddenException('Only active roles can be archived');
      }

      // Check if role carries admin.role.change permission
      const roleWithPermissions = await tx.role.findFirst({
        where: {
          id: normalizedRoleId,
          tenantId: actor.tenantId,
        },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      });

      if (
        roleWithPermissions?.rolePermissions.some(
          (rp) => rp.permission.name === 'admin.role.change',
        )
      ) {
        throw new ForbiddenException(
          'Roles carrying admin.role.change cannot be archived in this slice',
        );
      }

      // Get active users with this role
      const affectedUsers = await tx.user.findMany({
        where: {
          tenantId: actor.tenantId,
          status: USER_STATUS_ACTIVE,
          deactivatedAt: null,
          userRoles: {
            some: {
              roleId: normalizedRoleId,
              status: USER_ROLE_STATUS_ACTIVE,
            },
          },
        },
        select: {
          id: true,
          tokenVersion: true,
        },
      });

      const changedAt = new Date();
      const archivedAt = changedAt;

      // Archive the role
      const updateResult = await tx.role.updateMany({
        where: {
          id: normalizedRoleId,
          tenantId: actor.tenantId,
          archivedAt: null, // Only archive if not already archived
        },
        data: {
          status: USER_STATUS_INACTIVE, // Using INACTIVE status for archived roles
          archivedAt,
          archivedReason: trimmedReason,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Role archival failed - role may have been archived concurrently',
        );
      }

      // Increment tokenVersion for affected active users
      if (affectedUsers.length > 0) {
        await this.incrementAffectedUsersTokenVersion(
          tx,
          affectedUsers.map((user) => ({
            id: user.id,
            tokenVersion: user.tokenVersion,
          })),
        );
      }

      // Create audit log
      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'ROLE_ARCHIVED',
          recordType: 'Role',
          recordId: normalizedRoleId,
          oldValues: {
            roleId: role.id,
            roleName: role.name,
            status: role.status,
            isSystem: role.isSystem,
            archivedAt: role.archivedAt,
            archivedReason: role.archivedReason,
          },
          newValues: {
            actorId: actor.userId,
            roleId: role.id,
            roleName: role.name,
            reason: trimmedReason,
            archivedAt: archivedAt.toISOString(),
            tenantId: actor.tenantId,
            branchId: actor.branchId ?? null,
            isSystem: false,
            previousStatus: role.status,
            newStatus: USER_STATUS_INACTIVE,
            affectedUserIds: affectedUsers.map((user) => user.id),
            affectedUserCount: affectedUsers.length,
            beforeTokenVersions: affectedUsers.map((user) => ({
              id: user.id,
              tokenVersion: user.tokenVersion,
            })),
            afterTokenVersions: affectedUsers.map((user) => ({
              id: user.id,
              tokenVersion: user.tokenVersion + 1,
            })),
          },
        },
        tx,
        actor.branchId ?? undefined,
      );

      return {
        roleId: role.id,
        name: role.name,
        status: USER_STATUS_INACTIVE,
        isSystem: role.isSystem,
        archivedAt,
        affectedUserCount: affectedUsers.length,
      };
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

  private validateRequestId(requestId: string): string {
    const normalizedRequestId = requestId.trim();
    if (!normalizedRequestId) {
      throw new BadRequestException('Approval request ID is required');
    }
    return normalizedRequestId;
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

  private assertRoleChangeTargetUserState(target: AdminUserTarget) {
    if (target.status !== USER_STATUS_ACTIVE || target.deactivatedAt !== null) {
      throw new ConflictException(
        'Target user must be active for privileged role changes',
      );
    }
  }

  private assertPrivilegedRoleRequestActor(actor: RequestUser) {
    if (!actor.userId) {
      throw new ForbiddenException('User context is required');
    }

    if (!this.isSuperAdmin(actor) && actor.branchId) {
      throw new ForbiddenException(
        'Branch-scoped actors cannot initiate privileged account mutations',
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

  private async assertPrivilegedRoleApprovalActor(actor: RequestUser) {
    this.assertPrivilegedRoleRequestActor(actor);

    const actorPermissions = await this.getActorPermissions(
      actor.userId!,
      actor.tenantId,
    );

    if (
      !actorPermissions.has(PRIVILEGED_PERMISSION) ||
      !actorPermissions.has('approval.request.process')
    ) {
      throw new ForbiddenException(
        'Approval processing requires admin.role.change and approval.request.process',
      );
    }
  }

  private async getActorPermissions(userId: string, tenantId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        status: USER_ROLE_STATUS_ACTIVE,
        role: {
          tenantId,
          status: USER_STATUS_ACTIVE,
          archivedAt: null,
        },
      },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    const permissions = new Set<string>();
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const permissionName = rolePermission.permission?.name;
        if (typeof permissionName === 'string' && permissionName.length > 0) {
          permissions.add(permissionName);
        }
      }
    }

    return permissions;
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
        return this.isPrivilegedRole(role);
      },
    );

    if (hasPrivilegedRole) {
      throw new ForbiddenException(
        'Privileged target protection: Administrative mutations to Super Admins or users with role-change permissions must go through the maker-checker request flow.',
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
      (assignment) =>
        assignment.status === USER_ROLE_STATUS_ACTIVE &&
        assignment.role.status === USER_STATUS_ACTIVE &&
        assignment.role.archivedAt === null,
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

  private async getRoleForPrivilegedApproval(
    tx: Prisma.TransactionClient,
    tenantId: string,
    roleId: string,
    action: 'ASSIGN' | 'REVOKE',
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

    if (role.name === 'Super Admin') {
      throw new ForbiddenException(
        'Super Admin role changes remain blocked for this maker-checker slice',
      );
    }

    if (role.isSystem) {
      throw new ForbiddenException(
        'System role changes remain blocked for this maker-checker slice',
      );
    }

    if (role.status !== USER_STATUS_ACTIVE || role.archivedAt !== null) {
      throw new ForbiddenException(
        'Inactive or archived roles cannot be changed',
      );
    }

    if (!this.isPrivilegedRole(role)) {
      throw new ForbiddenException(
        `Only privileged roles can be ${action === 'ASSIGN' ? 'assigned' : 'revoked'} through this approval flow`,
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
        'Privileged permissions require maker-checker approval',
      );
    }

    if (permission.riskLevel !== DIRECT_ALLOWED_PERMISSION_RISK) {
      throw new ForbiddenException(
        'Only explicitly low-risk permissions can be directly granted',
      );
    }

    return permission;
  }

  private async getPendingPrivilegedRoleRequest(
    tx: Prisma.TransactionClient,
    tenantId: string,
    requestId: string,
  ) {
    const normalizedRequestId = this.validateRequestId(requestId);
    const request = await tx.approvalRequest.findFirst({
      where: { id: normalizedRequestId, tenantId },
    });

    if (!request) {
      throw new NotFoundException('Approval request not found');
    }

    if (
      request.type !== PRIVILEGED_ASSIGN_REQUEST_TYPE &&
      request.type !== PRIVILEGED_REVOKE_REQUEST_TYPE
    ) {
      throw new NotFoundException('Approval request not found');
    }

    if (request.status !== APPROVAL_STATUS_PENDING) {
      throw new ConflictException('Approval request is already decided');
    }

    return request;
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

  private assertApprovalActors(
    actor: RequestUser,
    request: { requesterId: string },
    targetUserId: string,
  ) {
    if (request.requesterId === actor.userId) {
      throw new ForbiddenException(
        'Requester cannot approve or reject their own privileged role request',
      );
    }

    if (actor.userId === targetUserId) {
      throw new ForbiddenException(
        'Target user cannot approve or reject a request about themselves',
      );
    }
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private hasActivePrivilegedRole(user: AdminUserTarget) {
    return this.getActiveUserRoleAssignments(user).some(({ role }) =>
      this.isPrivilegedRole(role),
    );
  }

  private parsePrivilegedRoleChangeDetails(
    details: Prisma.JsonValue | null,
  ): PrivilegedRoleChangeDetails {
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
      throw new ConflictException('Approval request payload is invalid');
    }

    const candidate = details as Record<string, unknown>;
    if (
      (candidate.action !== PRIVILEGED_ASSIGN_REQUEST_TYPE &&
        candidate.action !== PRIVILEGED_REVOKE_REQUEST_TYPE) ||
      typeof candidate.targetUserId !== 'string' ||
      typeof candidate.roleId !== 'string' ||
      typeof candidate.roleName !== 'string' ||
      typeof candidate.requesterId !== 'string' ||
      typeof candidate.reason !== 'string' ||
      typeof candidate.requestedAt !== 'string' ||
      !candidate.targetUserSnapshot ||
      !candidate.roleSnapshot
    ) {
      throw new ConflictException('Approval request payload is invalid');
    }

    return candidate as unknown as PrivilegedRoleChangeDetails;
  }

  private async createPrivilegedRoleChangeRequest(
    tx: Prisma.TransactionClient,
    actor: RequestUser,
    target: AdminUserTarget,
    role: AdminRoleTarget,
    reason: string,
    action: ApprovalAction,
  ) {
    const duplicateRequest = await tx.approvalRequest.findFirst({
      where: {
        tenantId: actor.tenantId,
        type: action,
        recordId: `${target.id}:${role.id}`,
        status: APPROVAL_STATUS_PENDING,
      },
    });

    if (duplicateRequest) {
      throw new ConflictException(
        'A matching privileged role request is already pending',
      );
    }

    const requestedAt = new Date();
    const details: PrivilegedRoleChangeDetails = {
      action: action as
        | typeof PRIVILEGED_ASSIGN_REQUEST_TYPE
        | typeof PRIVILEGED_REVOKE_REQUEST_TYPE,
      tenantId: actor.tenantId,
      branchId: actor.branchId ?? null,
      targetUserId: target.id,
      roleId: role.id,
      roleName: role.name,
      requesterId: actor.userId!,
      reason,
      requestedAt: requestedAt.toISOString(),
      targetUserSnapshot: {
        status: target.status,
        tokenVersion: target.tokenVersion,
        activeRoles: this.getRoleSummaries(target),
      },
      roleSnapshot: {
        status: role.status,
        isSystem: role.isSystem,
        privileged: this.isPrivilegedRole(role),
        archivedAt: role.archivedAt ? role.archivedAt.toISOString() : null,
      },
    };

    const request = await tx.approvalRequest.create({
      data: {
        tenantId: actor.tenantId,
        requesterId: actor.userId!,
        type: action,
        riskLevel: 'CRITICAL',
        recordId: `${target.id}:${role.id}`,
        reason,
        details,
        status: APPROVAL_STATUS_PENDING,
      },
    });

    await this.audit.log(
      {
        tenantId: actor.tenantId,
        userId: actor.userId!,
        eventKey: 'PRIVILEGED_ROLE_CHANGE_REQUESTED',
        recordType: 'ApprovalRequest',
        recordId: request.id,
        newValues: {
          requesterId: actor.userId,
          targetUserId: target.id,
          roleId: role.id,
          roleName: role.name,
          action,
          reason,
          requestedAt: requestedAt.toISOString(),
          tenantId: actor.tenantId,
          branchId: actor.branchId ?? null,
          targetUserSnapshot: details.targetUserSnapshot,
          roleSnapshot: details.roleSnapshot,
        },
      },
      tx,
      actor.branchId,
    );

    return request;
  }

  private toPrivilegedRoleChangeRequestResponse(
    request: { id: string; status: string; type: string },
    targetUserId: string,
    role: AdminRoleTarget,
  ): PrivilegedRoleChangeRequestResponse {
    return {
      requestId: request.id,
      targetUserId,
      roleId: role.id,
      roleName: role.name,
      action: request.type as ApprovalAction,
      status: request.status,
    };
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

  async requestPrivilegedUserDeactivation(
    actor: RequestUser,
    targetUserId: string,
    reason: string,
  ): Promise<PrivilegedUserChangeRequestResponse> {
    const trimmedReason = this.validateReason(reason);
    this.assertActorCanTarget(actor, targetUserId);
    this.assertNonSelfMutation(actor, targetUserId);
    this.assertPrivilegedRoleRequestActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const target = await this.getScopedTarget(tx, actor, targetUserId);
      this.assertIsPrivilegedTarget(target);

      if (target.status !== USER_STATUS_ACTIVE || target.deactivatedAt) {
        throw new ConflictException('User is not active');
      }

      await this.assertNoPendingPrivilegedUserRequest(
        tx,
        actor.tenantId,
        targetUserId,
        PRIVILEGED_USER_DEACTIVATE,
      );

      const request = await this.createPrivilegedUserRequest(
        tx,
        actor,
        target,
        PRIVILEGED_USER_DEACTIVATE,
        trimmedReason,
        { deactivationReason: trimmedReason },
      );

      return this.toPrivilegedUserChangeRequestResponse(request);
    });
  }

  async requestPrivilegedUserActivation(
    actor: RequestUser,
    targetUserId: string,
    reason: string,
  ): Promise<PrivilegedUserChangeRequestResponse> {
    const trimmedReason = this.validateReason(reason);
    this.assertActorCanTarget(actor, targetUserId);
    this.assertNonSelfMutation(actor, targetUserId);
    this.assertPrivilegedRoleRequestActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const target = await this.getScopedTarget(tx, actor, targetUserId);
      this.assertIsPrivilegedTarget(target);

      if (target.status === USER_STATUS_ACTIVE && !target.deactivatedAt) {
        throw new ConflictException('User is already active');
      }

      await this.assertNoPendingPrivilegedUserRequest(
        tx,
        actor.tenantId,
        targetUserId,
        PRIVILEGED_USER_ACTIVATE,
      );

      const request = await this.createPrivilegedUserRequest(
        tx,
        actor,
        target,
        PRIVILEGED_USER_ACTIVATE,
        trimmedReason,
        {},
      );

      return this.toPrivilegedUserChangeRequestResponse(request);
    });
  }

  async requestPrivilegedUserProfileUpdate(
    actor: RequestUser,
    targetUserId: string,
    dto: PrivilegedUserProfileUpdateDto,
  ): Promise<PrivilegedUserChangeRequestResponse> {
    const trimmedReason = this.validateReason(dto.reason);
    this.assertActorCanTarget(actor, targetUserId);
    this.assertNonSelfMutation(actor, targetUserId);
    this.assertPrivilegedRoleRequestActor(actor);

    if (dto.email === undefined && dto.mfaEnabled === undefined) {
      throw new BadRequestException('No update fields provided');
    }

    return this.prisma.$transaction(async (tx) => {
      const target = await this.getScopedTarget(tx, actor, targetUserId);
      this.assertIsPrivilegedTarget(target);

      await this.assertNoPendingPrivilegedUserRequest(
        tx,
        actor.tenantId,
        targetUserId,
        PRIVILEGED_USER_PROFILE_UPDATE,
      );

      const request = await this.createPrivilegedUserRequest(
        tx,
        actor,
        target,
        PRIVILEGED_USER_PROFILE_UPDATE,
        trimmedReason,
        { email: dto.email, mfaEnabled: dto.mfaEnabled },
      );

      return this.toPrivilegedUserChangeRequestResponse(request);
    });
  }

  private assertIsPrivilegedTarget(target: AdminUserTarget) {
    const hasPrivilegedRole = this.getActiveUserRoleAssignments(target).some(
      ({ role }) => this.isPrivilegedRole(role),
    );

    if (!hasPrivilegedRole) {
      throw new BadRequestException(
        'Target user is not privileged and does not require maker-checker flow',
      );
    }
  }

  private assertNonSelfMutation(actor: RequestUser, targetUserId: string) {
    if (actor.userId === targetUserId) {
      throw new ForbiddenException(
        'Privileged users cannot request lifecycle or profile mutations for themselves',
      );
    }
  }

  private async assertNoPendingPrivilegedUserRequest(
    tx: Prisma.TransactionClient,
    tenantId: string,
    targetUserId: string,
    action: PrivilegedUserChangeAction,
  ) {
    const existing = await tx.approvalRequest.findFirst({
      where: {
        tenantId,
        recordId: targetUserId,
        type: action,
        status: APPROVAL_STATUS_PENDING,
      },
    });

    if (existing) {
      throw new ConflictException(
        `A pending ${action.toLowerCase().replace(/_/g, ' ')} request already exists for this user`,
      );
    }
  }

  private async createPrivilegedUserRequest(
    tx: Prisma.TransactionClient,
    actor: RequestUser,
    target: AdminUserTarget,
    action: PrivilegedUserChangeAction,
    reason: string,
    changes: {
      email?: string;
      mfaEnabled?: boolean;
      deactivationReason?: string;
    },
  ) {
    const requestedAt = new Date();
    const details: PrivilegedUserChangeDetails = {
      action,
      tenantId: actor.tenantId,
      branchId: actor.branchId ?? null,
      targetUserId: target.id,
      requesterId: actor.userId!,
      reason,
      requestedAt: requestedAt.toISOString(),
      targetUserSnapshot: {
        status: target.status,
        email: target.email,
        mfaEnabled: target.mfaEnabled,
        tokenVersion: target.tokenVersion,
        activeRoles: this.getRoleSummaries(target).map((r) => ({
          id: r.id,
          name: r.name,
        })),
      },
      requestedChanges: changes,
    };

    const request = await tx.approvalRequest.create({
      data: {
        tenantId: actor.tenantId,
        requesterId: actor.userId!,
        type: action,
        riskLevel: 'CRITICAL',
        recordId: target.id,
        reason,
        details,
        status: APPROVAL_STATUS_PENDING,
      },
    });

    await this.audit.log(
      {
        tenantId: actor.tenantId,
        userId: actor.userId!,
        eventKey: 'PRIVILEGED_USER_CHANGE_REQUESTED',
        recordType: 'ApprovalRequest',
        recordId: request.id,
        newValues: {
          requestId: request.id,
          requesterId: actor.userId,
          targetUserId: target.id,
          action,
          reason,
          requestedChanges: changes,
          targetUserSnapshot: details.targetUserSnapshot,
          tenantId: actor.tenantId,
          branchId: actor.branchId ?? null,
          requestedAt: requestedAt.toISOString(),
        },
      },
      tx,
      actor.branchId,
    );

    return request;
  }

  private toPrivilegedUserChangeRequestResponse(request: {
    id: string;
    recordId: string;
    type: string;
    status: string;
  }): PrivilegedUserChangeRequestResponse {
    return {
      requestId: request.id,
      targetUserId: request.recordId,
      action: request.type as PrivilegedUserChangeAction,
      status: request.status,
    };
  }

  async approvePrivilegedUserChange(
    actor: RequestUser,
    requestId: string,
    decisionReason: string,
  ): Promise<PrivilegedUserChangeDecisionResponse> {
    const trimmedReason = this.validateReason(decisionReason);
    const normalizedRequestId = this.validateRequestId(requestId);
    await this.assertPrivilegedRoleApprovalActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const request = await this.getPendingPrivilegedUserRequest(
        tx,
        actor.tenantId,
        normalizedRequestId,
      );
      const details = this.parsePrivilegedUserChangeDetails(request.details);

      this.assertApprovalActors(actor, request, details.targetUserId);

      const target = await this.getScopedTarget(
        tx,
        actor,
        details.targetUserId,
      );
      this.assertIsPrivilegedTarget(target);

      const beforeUser = this.sanitizeAuditUser(target);
      const beforeTokenVersion = target.tokenVersion;

      if (details.action === PRIVILEGED_USER_DEACTIVATE) {
        if (target.status !== USER_STATUS_ACTIVE || target.deactivatedAt) {
          throw new ConflictException('User is not active');
        }
        await tx.user.update({
          where: { id: target.id },
          data: {
            status: USER_STATUS_INACTIVE,
            deactivatedAt: new Date(),
            deactivatedReason: details.requestedChanges.deactivationReason,
            tokenVersion: { increment: 1 },
          },
        });
      } else if (details.action === PRIVILEGED_USER_ACTIVATE) {
        if (target.status === USER_STATUS_ACTIVE && !target.deactivatedAt) {
          throw new ConflictException('User is already active');
        }
        await tx.user.update({
          where: { id: target.id },
          data: {
            status: USER_STATUS_ACTIVE,
            deactivatedAt: null,
            deactivatedReason: null,
            tokenVersion: { increment: 1 },
          },
        });
      } else if (details.action === PRIVILEGED_USER_PROFILE_UPDATE) {
        const { email, mfaEnabled } = details.requestedChanges;
        if (email && email !== target.email) {
          const existing = await tx.user.findFirst({
            where: {
              tenantId: actor.tenantId,
              email,
              id: { not: target.id },
            },
          });
          if (existing) {
            throw new ConflictException('Email already in use');
          }
        }
        await tx.user.update({
          where: { id: target.id },
          data: {
            email: email ?? target.email,
            mfaEnabled: mfaEnabled ?? target.mfaEnabled,
            tokenVersion: { increment: 1 },
          },
        });
      }

      const requestUpdate = await tx.approvalRequest.updateMany({
        where: {
          id: request.id,
          tenantId: actor.tenantId,
          status: APPROVAL_STATUS_PENDING,
        },
        data: {
          status: APPROVAL_STATUS_APPROVED,
          approverId: actor.userId!,
          remarks: trimmedReason,
        },
      });

      if (requestUpdate.count === 0) {
        throw new ConflictException(
          'Approval request changed before approval could be recorded',
        );
      }

      const updated = await this.getUpdatedUser(tx, actor.tenantId, target.id);
      const changedAt = new Date();

      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'PRIVILEGED_USER_CHANGE_APPROVED',
          recordType: 'ApprovalRequest',
          recordId: request.id,
          oldValues: {
            approvalRequestId: request.id,
            requesterId: request.requesterId,
            targetUserId: target.id,
            action: details.action,
            beforeUser,
            beforeTokenVersion,
          },
          newValues: {
            approverId: actor.userId,
            requesterId: request.requesterId,
            targetUserId: target.id,
            action: details.action,
            decisionReason: trimmedReason,
            afterUser: this.sanitizeAuditUser(updated),
            afterTokenVersion: updated.tokenVersion,
            approvalRequestId: request.id,
            decidedAt: changedAt.toISOString(),
          },
        },
        tx,
        actor.branchId,
      );

      return {
        requestId: request.id,
        action: details.action,
        targetUserId: target.id,
        approvalStatus: APPROVAL_STATUS_APPROVED,
        userStatus: updated.status,
      };
    });
  }

  async rejectPrivilegedUserChange(
    actor: RequestUser,
    requestId: string,
    decisionReason: string,
  ): Promise<PrivilegedUserChangeDecisionResponse> {
    const trimmedReason = this.validateReason(decisionReason);
    const normalizedRequestId = this.validateRequestId(requestId);
    await this.assertPrivilegedRoleApprovalActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const request = await this.getPendingPrivilegedUserRequest(
        tx,
        actor.tenantId,
        normalizedRequestId,
      );
      const details = this.parsePrivilegedUserChangeDetails(request.details);

      this.assertApprovalActors(actor, request, details.targetUserId);

      const requestUpdate = await tx.approvalRequest.updateMany({
        where: {
          id: request.id,
          tenantId: actor.tenantId,
          status: APPROVAL_STATUS_PENDING,
        },
        data: {
          status: APPROVAL_STATUS_REJECTED,
          approverId: actor.userId!,
          remarks: trimmedReason,
        },
      });

      if (requestUpdate.count === 0) {
        throw new ConflictException(
          'Approval request changed before rejection could be recorded',
        );
      }

      const changedAt = new Date();
      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'PRIVILEGED_USER_CHANGE_REJECTED',
          recordType: 'ApprovalRequest',
          recordId: request.id,
          newValues: {
            approverId: actor.userId,
            requesterId: request.requesterId,
            targetUserId: details.targetUserId,
            action: details.action,
            decisionReason: trimmedReason,
            approvalRequestId: request.id,
            decidedAt: changedAt.toISOString(),
          },
        },
        tx,
        actor.branchId,
      );

      const target = await this.getScopedTarget(
        tx,
        actor,
        details.targetUserId,
      );

      return {
        requestId: request.id,
        action: details.action,
        targetUserId: target.id,
        approvalStatus: APPROVAL_STATUS_REJECTED,
        userStatus: target.status,
      };
    });
  }

  async requestPrivilegedRolePermissionGrant(
    actor: RequestUser,
    roleId: string,
    permissionId: string,
    reason: string,
  ): Promise<PrivilegedRolePermissionChangeRequestResponse> {
    const trimmedReason = this.validateReason(reason);
    const normalizedRoleId = this.validateRoleId(roleId);
    const normalizedPermissionId = this.validatePermissionId(permissionId);
    this.assertPrivilegedRolePermissionActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const role = await this.getRoleForPrivilegedPermissionApproval(
        tx,
        actor.tenantId,
        normalizedRoleId,
      );
      const permission = await this.getPermissionForPrivilegedApproval(
        tx,
        actor.tenantId,
        normalizedPermissionId,
      );

      // LOW risk belongs to direct path
      if (permission.riskLevel === DIRECT_ALLOWED_PERMISSION_RISK) {
        throw new BadRequestException(
          'LOW risk permission changes should use the direct governed endpoint',
        );
      }

      await this.assertNoPendingRolePermissionRequest(
        tx,
        actor.tenantId,
        normalizedRoleId,
        normalizedPermissionId,
        ADMIN_ROLE_PERMISSION_GRANT,
      );

      const request = await this.createRolePermissionChangeRequest(
        tx,
        actor,
        role,
        permission,
        ADMIN_ROLE_PERMISSION_GRANT,
        trimmedReason,
      );
      return this.toRolePermissionChangeRequestResponse(
        request,
        role,
        permission,
      );
    });
  }

  async requestPrivilegedRolePermissionRevoke(
    actor: RequestUser,
    roleId: string,
    permissionId: string,
    reason: string,
  ): Promise<PrivilegedRolePermissionChangeRequestResponse> {
    const trimmedReason = this.validateReason(reason);
    const normalizedRoleId = this.validateRoleId(roleId);
    const normalizedPermissionId = this.validatePermissionId(permissionId);
    this.assertPrivilegedRolePermissionActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const role = await this.getRoleForPrivilegedPermissionApproval(
        tx,
        actor.tenantId,
        normalizedRoleId,
      );
      const permission = await this.getPermissionForPrivilegedApproval(
        tx,
        actor.tenantId,
        normalizedPermissionId,
      );

      // Check if permission is actually assigned
      const existing = role.rolePermissions.find(
        (rp) => rp.permissionId === normalizedPermissionId,
      );
      if (!existing) {
        throw new ConflictException('Permission is not assigned to this role');
      }

      // LOW risk belongs to direct path
      if (permission.riskLevel === DIRECT_ALLOWED_PERMISSION_RISK) {
        throw new BadRequestException(
          'LOW risk permission changes should use the direct governed endpoint',
        );
      }

      await this.assertNoPendingRolePermissionRequest(
        tx,
        actor.tenantId,
        normalizedRoleId,
        normalizedPermissionId,
        ADMIN_ROLE_PERMISSION_REVOKE,
      );

      const request = await this.createRolePermissionChangeRequest(
        tx,
        actor,
        role,
        permission,
        ADMIN_ROLE_PERMISSION_REVOKE,
        trimmedReason,
      );
      return this.toRolePermissionChangeRequestResponse(
        request,
        role,
        permission,
      );
    });
  }

  async approvePrivilegedRolePermissionChange(
    actor: RequestUser,
    requestId: string,
    decisionReason: string,
  ): Promise<PrivilegedRolePermissionChangeDecisionResponse> {
    const trimmedReason = this.validateReason(decisionReason);
    const normalizedRequestId = this.validateRequestId(requestId);
    await this.assertPrivilegedRolePermissionApprovalActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const request = await this.getPendingRolePermissionRequest(
        tx,
        actor.tenantId,
        normalizedRequestId,
      );
      const details = this.parseRolePermissionChangeDetails(request.details);

      if (request.requesterId === actor.userId) {
        throw new ForbiddenException(
          'Requester cannot approve their own role permission request',
        );
      }

      const role = await this.getRoleForPrivilegedPermissionApproval(
        tx,
        actor.tenantId,
        details.roleId,
      );
      const permission = await this.getPermissionForPrivilegedApproval(
        tx,
        actor.tenantId,
        details.permissionId,
      );

      const affectedUsersBefore = await this.getAffectedActiveUsersForRole(
        tx,
        actor.tenantId,
        role.id,
      );

      if (details.action === ADMIN_ROLE_PERMISSION_GRANT) {
        // Grant permission
        try {
          await tx.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        } catch (e) {
          if (this.isUniqueConstraintError(e)) {
            throw new ConflictException(
              'Permission is already assigned to this role',
            );
          }
          throw e;
        }
      } else {
        // Revoke permission
        const deleteResult = await tx.rolePermission.deleteMany({
          where: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
        if (deleteResult.count === 0) {
          throw new ConflictException('Permission was removed before approval');
        }
      }

      await this.incrementAffectedUsersTokenVersion(tx, affectedUsersBefore);
      const affectedUsersAfter =
        this.mapAfterTokenVersions(affectedUsersBefore);

      const requestUpdate = await tx.approvalRequest.updateMany({
        where: {
          id: request.id,
          tenantId: actor.tenantId,
          status: APPROVAL_STATUS_PENDING,
        },
        data: {
          status: APPROVAL_STATUS_APPROVED,
          approverId: actor.userId!,
          remarks: trimmedReason,
        },
      });

      if (requestUpdate.count === 0) {
        throw new ConflictException(
          'Approval request changed before approval could be recorded',
        );
      }

      const changedAt = new Date();
      const updatedRole = await tx.role.findUnique({
        where: { id: role.id },
        include: { rolePermissions: { include: { permission: true } } },
      });

      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'ROLE_PERMISSION_CHANGE_APPROVED',
          recordType: 'ApprovalRequest',
          recordId: request.id,
          oldValues: {
            approvalRequestId: request.id,
            requesterId: request.requesterId,
            roleId: role.id,
            permissionId: permission.id,
            action: details.action,
            beforePermissions: role.rolePermissions.map(
              (rp) => rp.permission.name,
            ),
            beforeTokenVersions: affectedUsersBefore,
          },
          newValues: {
            approverId: actor.userId,
            requesterId: request.requesterId,
            roleId: role.id,
            permissionId: permission.id,
            action: details.action,
            decisionReason: trimmedReason,
            afterPermissions: updatedRole!.rolePermissions.map(
              (rp) => rp.permission.name,
            ),
            afterTokenVersions: affectedUsersAfter,
            affectedUserIds: affectedUsersBefore.map((u) => u.id),
            approvalRequestId: request.id,
            decidedAt: changedAt.toISOString(),
          },
        },
        tx,
        actor.branchId,
      );

      return {
        requestId: request.id,
        action: details.action,
        status: APPROVAL_STATUS_APPROVED,
        roleId: role.id,
        roleName: role.name,
        permissionId: permission.id,
        permissionName: permission.name,
        approvalStatus: APPROVAL_STATUS_APPROVED,
        affectedUserCount: affectedUsersBefore.length,
      };
    });
  }

  async rejectPrivilegedRolePermissionChange(
    actor: RequestUser,
    requestId: string,
    decisionReason: string,
  ): Promise<PrivilegedRolePermissionChangeDecisionResponse> {
    const trimmedReason = this.validateReason(decisionReason);
    const normalizedRequestId = this.validateRequestId(requestId);
    await this.assertPrivilegedRolePermissionApprovalActor(actor);

    return this.prisma.$transaction(async (tx) => {
      const request = await this.getPendingRolePermissionRequest(
        tx,
        actor.tenantId,
        normalizedRequestId,
      );
      const details = this.parseRolePermissionChangeDetails(request.details);

      if (request.requesterId === actor.userId) {
        throw new ForbiddenException(
          'Requester cannot reject their own role permission request',
        );
      }

      const requestUpdate = await tx.approvalRequest.updateMany({
        where: {
          id: request.id,
          tenantId: actor.tenantId,
          status: APPROVAL_STATUS_PENDING,
        },
        data: {
          status: APPROVAL_STATUS_REJECTED,
          approverId: actor.userId!,
          remarks: trimmedReason,
        },
      });

      if (requestUpdate.count === 0) {
        throw new ConflictException(
          'Approval request changed before rejection could be recorded',
        );
      }

      const changedAt = new Date();
      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actor.userId!,
          eventKey: 'ROLE_PERMISSION_CHANGE_REJECTED',
          recordType: 'ApprovalRequest',
          recordId: request.id,
          newValues: {
            approverId: actor.userId,
            requesterId: request.requesterId,
            roleId: details.roleId,
            permissionId: details.permissionId,
            action: details.action,
            decisionReason: trimmedReason,
            approvalRequestId: request.id,
            decidedAt: changedAt.toISOString(),
          },
        },
        tx,
        actor.branchId,
      );

      return {
        requestId: request.id,
        action: details.action,
        status: APPROVAL_STATUS_REJECTED,
        roleId: details.roleId,
        roleName: details.roleName,
        permissionId: details.permissionId,
        permissionName: details.permissionName,
        approvalStatus: APPROVAL_STATUS_REJECTED,
        affectedUserCount: 0,
      };
    });
  }

  private assertPrivilegedRolePermissionActor(actor: RequestUser) {
    if (!actor.userId) {
      throw new ForbiddenException('User context is required');
    }

    if (!this.isSuperAdmin(actor) && actor.branchId) {
      throw new ForbiddenException(
        'Branch-scoped actors cannot initiate privileged role permission changes',
      );
    }
  }

  private async assertPrivilegedRolePermissionApprovalActor(
    actor: RequestUser,
  ) {
    this.assertPrivilegedRolePermissionActor(actor);

    const actorPermissions = await this.getActorPermissions(
      actor.userId!,
      actor.tenantId,
    );

    if (
      !actorPermissions.has(PRIVILEGED_PERMISSION) ||
      !actorPermissions.has('approval.request.process')
    ) {
      throw new ForbiddenException(
        'Approval processing requires admin.role.change and approval.request.process',
      );
    }
  }

  private async getRoleForPrivilegedPermissionApproval(
    tx: Prisma.TransactionClient,
    tenantId: string,
    roleId: string,
  ): Promise<AdminRoleTarget> {
    const role = await tx.role.findFirst({
      where: { id: roleId, tenantId },
      include: { rolePermissions: { include: { permission: true } } },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.name === 'Super Admin') {
      throw new ForbiddenException(
        'Super Admin role permissions cannot be mutated through this flow',
      );
    }

    if (role.isSystem) {
      throw new ForbiddenException(
        'System role permissions cannot be mutated through this flow',
      );
    }

    if (role.status !== USER_STATUS_ACTIVE || role.archivedAt !== null) {
      throw new ForbiddenException(
        'Inactive or archived roles cannot have permissions mutated',
      );
    }

    if (this.isPrivilegedRole(role)) {
      throw new ForbiddenException(
        'Roles already carrying admin.role.change cannot have permissions mutated through this flow',
      );
    }

    return role;
  }

  private async getPermissionForPrivilegedApproval(
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

    if (permission.name === PRIVILEGED_PERMISSION) {
      throw new ForbiddenException(
        'The admin.role.change permission remains absolutely blocked from governed mutation',
      );
    }

    return permission;
  }

  private async assertNoPendingRolePermissionRequest(
    tx: Prisma.TransactionClient,
    tenantId: string,
    roleId: string,
    permissionId: string,
    action: RolePermissionChangeAction,
  ) {
    const existing = await tx.approvalRequest.findFirst({
      where: {
        tenantId,
        recordId: `${roleId}:${permissionId}`,
        type: action,
        status: APPROVAL_STATUS_PENDING,
      },
    });

    if (existing) {
      throw new ConflictException(
        `A pending ${action.toLowerCase().replace(/_/g, ' ')} request already exists for this role and permission`,
      );
    }
  }

  private async createRolePermissionChangeRequest(
    tx: Prisma.TransactionClient,
    actor: RequestUser,
    role: AdminRoleTarget,
    permission: AdminPermissionTarget,
    action: RolePermissionChangeAction,
    reason: string,
  ) {
    const requestedAt = new Date();
    const details: RolePermissionChangeDetails = {
      action,
      tenantId: actor.tenantId,
      branchId: actor.branchId ?? null,
      roleId: role.id,
      roleName: role.name,
      permissionId: permission.id,
      permissionName: permission.name,
      permissionRiskLevel: permission.riskLevel,
      requesterId: actor.userId!,
      reason,
      requestedAt: requestedAt.toISOString(),
      roleSnapshot: {
        status: role.status,
        isSystem: role.isSystem,
        archivedAt: role.archivedAt ? role.archivedAt.toISOString() : null,
        activePermissions: role.rolePermissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
        })),
      },
      permissionSnapshot: {
        riskLevel: permission.riskLevel,
        name: permission.name,
      },
    };

    const request = await tx.approvalRequest.create({
      data: {
        tenantId: actor.tenantId,
        requesterId: actor.userId!,
        type: action,
        riskLevel:
          permission.riskLevel === 'PRIVILEGED'
            ? 'CRITICAL'
            : (permission.riskLevel as any),
        recordId: `${role.id}:${permission.id}`,
        reason,
        details,
        status: APPROVAL_STATUS_PENDING,
      },
    });

    await this.audit.log(
      {
        tenantId: actor.tenantId,
        userId: actor.userId!,
        eventKey: 'ROLE_PERMISSION_CHANGE_REQUESTED',
        recordType: 'ApprovalRequest',
        recordId: request.id,
        newValues: {
          requestId: request.id,
          requesterId: actor.userId,
          roleId: role.id,
          roleName: role.name,
          permissionId: permission.id,
          permissionName: permission.name,
          action,
          reason,
          tenantId: actor.tenantId,
          branchId: actor.branchId ?? null,
          requestedAt: requestedAt.toISOString(),
        },
      },
      tx,
      actor.branchId,
    );

    return request;
  }

  private toRolePermissionChangeRequestResponse(
    request: { id: string; status: string; type: string },
    role: AdminRoleTarget,
    permission: AdminPermissionTarget,
  ): PrivilegedRolePermissionChangeRequestResponse {
    return {
      requestId: request.id,
      roleId: role.id,
      roleName: role.name,
      permissionId: permission.id,
      permissionName: permission.name,
      action: request.type as RolePermissionChangeAction,
      status: request.status,
    };
  }

  private async getPendingRolePermissionRequest(
    tx: Prisma.TransactionClient,
    tenantId: string,
    requestId: string,
  ) {
    const request = await tx.approvalRequest.findFirst({
      where: {
        id: requestId,
        tenantId,
        status: APPROVAL_STATUS_PENDING,
        type: {
          in: [ADMIN_ROLE_PERMISSION_GRANT, ADMIN_ROLE_PERMISSION_REVOKE],
        },
      },
    });

    if (!request) {
      throw new NotFoundException(
        'Pending role permission change request not found',
      );
    }

    return request;
  }

  private parseRolePermissionChangeDetails(
    details: any,
  ): RolePermissionChangeDetails {
    if (!details || typeof details !== 'object') {
      throw new BadRequestException('Invalid request details');
    }
    return details as RolePermissionChangeDetails;
  }

  private async getPendingPrivilegedUserRequest(
    tx: Prisma.TransactionClient,
    tenantId: string,
    requestId: string,
  ) {
    const request = await tx.approvalRequest.findFirst({
      where: {
        id: requestId,
        tenantId,
        status: APPROVAL_STATUS_PENDING,
        type: {
          in: [
            PRIVILEGED_USER_DEACTIVATE,
            PRIVILEGED_USER_ACTIVATE,
            PRIVILEGED_USER_PROFILE_UPDATE,
          ],
        },
      },
    });

    if (!request) {
      throw new NotFoundException(
        'Pending privileged user change request not found',
      );
    }

    return request;
  }

  private parsePrivilegedUserChangeDetails(
    details: any,
  ): PrivilegedUserChangeDetails {
    if (!details || typeof details !== 'object') {
      throw new BadRequestException('Invalid request details');
    }
    return details as PrivilegedUserChangeDetails;
  }

  private async checkSchemaReadiness(): Promise<boolean> {
    try {
      // Check if core required tables exist by attempting to query them
      // These tables are essential for the application to function
      const requiredTables = [
        'users',
        'roles',
        'permissions',
        'tenants',
        'audit_logs',
      ];

      for (const table of requiredTables) {
        // Use raw query to check table existence via information_schema
        // This is safe: doesn't count rows, just verifies table exists and is queryable
        const result = await this.prisma.$queryRaw<
          Array<{ table_exists: boolean }>
        >`
          SELECT EXISTS(
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = ${table}
          ) as table_exists
        `;

        if (!result || !result[0]?.table_exists) {
          return false;
        }
      }

      return true;
    } catch {
      // If schema check fails for any reason, consider schema not ready
      return false;
    }
  }

  async getHealth() {
    const timestamp = new Date().toISOString();
    const metrics = await this.metricsService.getMetrics();

    // Compute backup configuration independently from DB status (outside try/catch)
    const backupConfig = !!(
      process.env.BACKUP_S3_BUCKET || process.env.BACKUP_AZURE_CONTAINER
    );

    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      // Check schema/migration readiness independently
      const schemaReady = await this.checkSchemaReadiness();

      // Check Notification Dispatcher readiness
      const pendingNotifications = await this.prisma.notification.count({
        where: { status: 'PENDING' },
      });

      // Check last successful backup from audit log
      const lastBackup = await this.prisma.auditLog.findFirst({
        where: { eventKey: 'BACKUP_COMPLETED' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      // Stub checks for external services (email/SMS, storage)
      const emailSmsStatus =
        process.env.EMAIL_PROVIDER || process.env.SMS_PROVIDER
          ? 'configured'
          : 'stub';
      const storageStatus = process.env.STORAGE_PROVIDER
        ? 'configured'
        : 'stub';
      const jobQueueStatus = {
        pending: pendingNotifications,
        status: pendingNotifications > 100 ? 'backlogged' : 'healthy',
      };

      if (schemaReady) {
        return {
          appStatus: 'ok',
          dbStatus: 'ok',
          migrationStatus: 'ok',
          backupConfig,
          lastBackupAt: lastBackup?.createdAt || null,
          externalServices: {
            emailSms: emailSmsStatus,
            storage: storageStatus,
          },
          jobQueue: jobQueueStatus,
          notifications: {
            pending: pendingNotifications,
            status: 'active',
          },
          metrics: {
            totalRequests: metrics.totalRequests,
            totalErrors: metrics.totalErrors,
          },
          timestamp,
        };
      } else {
        return {
          appStatus: 'degraded',
          dbStatus: 'ok',
          migrationStatus: 'error',
          backupConfig,
          lastBackupAt: lastBackup?.createdAt || null,
          externalServices: {
            emailSms: emailSmsStatus,
            storage: storageStatus,
          },
          jobQueue: jobQueueStatus,
          timestamp,
        };
      }
    } catch (e) {
      return {
        appStatus: 'degraded',
        dbStatus: 'error',
        error: e instanceof Error ? e.message : 'Unknown error',
        migrationStatus: 'unknown',
        backupConfig,
        timestamp,
      };
    }
  }

  async listUsers(
    actor: RequestUser,
    query: AdminUserListQuery = {},
  ): Promise<PaginatedResult<AdminUserListItem>> {
    const { search, status, branchId, page = 1, limit = 50 } = query;
    const where: Prisma.UserWhereInput = { tenantId: actor.tenantId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [{ email: { contains: search, mode: 'insensitive' } }];
    }

    if (branchId) {
      where.userBranches = {
        some: { branchId, isActive: true },
      };
    }

    // Branch-scoped admins only see users in their branch
    if (!this.isSuperAdmin(actor) && actor.branchId) {
      where.userBranches = {
        ...(where.userBranches as any),
        some: {
          ...((where.userBranches as any)?.some || {}),
          branchId: actor.branchId,
          isActive: true,
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: {
            include: { role: { select: { id: true, name: true } } },
            where: { status: 'ACTIVE' },
          },
          userBranches: {
            include: { branch: { select: { id: true, name: true } } },
            where: { isActive: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((u) => ({
        id: u.id,
        email: u.email,
        tenantId: u.tenantId,
        mfaEnabled: u.mfaEnabled,
        status: u.status,
        deactivatedAt: u.deactivatedAt,
        lockedUntil: u.lockedUntil,
        isSystem: u.isSystem,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        roles: u.userRoles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          status: ur.status,
        })),
        branches: u.userBranches.map((ub) => ({
          id: ub.branch.id,
          name: ub.branch.name,
          isActive: ub.isActive,
        })),
      })),
      total,
      page,
      limit,
    };
  }

  async getUser(
    actor: RequestUser,
    userId: string,
  ): Promise<AdminUserListItem> {
    const where: Prisma.UserWhereInput = {
      id: userId,
      tenantId: actor.tenantId,
    };

    if (!this.isSuperAdmin(actor) && actor.branchId) {
      where.userBranches = {
        some: { branchId: actor.branchId, isActive: true },
      };
    }

    const user = await this.prisma.user.findFirst({
      where,
      include: {
        userRoles: {
          include: { role: { select: { id: true, name: true } } },
          where: { status: 'ACTIVE' },
        },
        userBranches: {
          include: { branch: { select: { id: true, name: true } } },
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      mfaEnabled: user.mfaEnabled,
      status: user.status,
      deactivatedAt: user.deactivatedAt,
      lockedUntil: user.lockedUntil,
      isSystem: user.isSystem,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        status: ur.status,
      })),
      branches: user.userBranches.map((ub) => ({
        id: ub.branch.id,
        name: ub.branch.name,
        isActive: ub.isActive,
      })),
    };
  }

  async listRoles(actor: RequestUser): Promise<AdminRoleListItem[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        tenantId: actor.tenantId,
        archivedAt: null,
      },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                scope: true,
                riskLevel: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      isSystem: r.isSystem,
      permissions: r.rolePermissions.map((rp) => rp.permission),
    }));
  }

  async listPermissions(
    actor: RequestUser,
  ): Promise<AdminPermissionListItem[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { tenantId: actor.tenantId },
      select: {
        id: true,
        name: true,
        scope: true,
        riskLevel: true,
      },
      orderBy: { name: 'asc' },
    });

    return permissions;
  }
}
