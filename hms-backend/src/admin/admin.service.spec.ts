import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { AdminService } from './admin.service';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    $transaction: jest.Mock;
    user: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      updateMany: jest.Mock;
    };
    userRole: {
      create: jest.Mock;
      updateMany: jest.Mock;
      findMany: jest.Mock;
    };
    role: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    permission: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
    rolePermission: {
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    approvalRequest: {
      create: jest.Mock;
      findFirst: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let audit: { log: jest.Mock };

  const superAdminActor: RequestUser = {
    userId: 'actor-id',
    tenantId: 'tenant-id',
    roles: ['Super Admin'],
    tokenVersion: 0,
  };

  const branchActor: RequestUser = {
    userId: 'branch-actor-id',
    tenantId: 'tenant-id',
    branchId: 'branch-id',
    roles: ['Branch Admin'],
    tokenVersion: 0,
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest
        .fn()
        .mockImplementation((cb: (tx: typeof prisma) => unknown) => cb(prisma)),
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      userRole: {
        create: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      userBranch: {
        createMany: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      branch: {
        findMany: jest.fn(),
      },
      permission: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      rolePermission: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      approvalRequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    audit = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  const makeRole = (
    overrides: Partial<{
      id: string;
      tenantId: string;
      name: string;
      status: string;
      isSystem: boolean;
      archivedAt: Date | null;
      archivedReason: string | null;
      rolePermissions: Array<{
        roleId: string;
        permissionId: string;
        permission: {
          id: string;
          tenantId: string;
          name: string;
          scope: string;
        };
      }>;
    }> = {},
  ) => ({
    id: 'role-id',
    tenantId: 'tenant-id',
    name: 'Receptionist',
    status: 'ACTIVE',
    isSystem: true,
    archivedAt: null as Date | null,
    archivedReason: null as string | null,
    rolePermissions: [] as Array<{
      roleId: string;
      permissionId: string;
      permission: {
        id: string;
        tenantId: string;
        name: string;
        scope: string;
      };
    }>,
    ...overrides,
  });

  const makePermission = (
    overrides: Partial<{
      id: string;
      tenantId: string;
      name: string;
      scope: string;
      riskLevel: string;
    }> = {},
  ) => ({
    id: 'permission-id',
    tenantId: 'tenant-id',
    name: 'patient.view',
    scope: 'tenant/branch',
    riskLevel: 'LOW',
    ...overrides,
  });

  const makeUser = (
    overrides: Partial<{
      id: string;
      tenantId: string;
      email: string;
      passwordHash: string;
      isMfaEnabled: boolean;
      status: string;
      deactivatedAt: Date | null;
      deactivatedReason: string | null;
      tokenVersion: number;
      createdAt: Date;
      updatedAt: Date;
      userBranches: Array<{ branchId: string; isActive: boolean }>;
      userRoles: Array<{
        userId: string;
        roleId: string;
        status: string;
        revokedAt: Date | null;
        revokedReason: string | null;
        role: ReturnType<typeof makeRole>;
      }>;
    }> = {},
  ) => ({
    id: 'target-id',
    tenantId: 'tenant-id',
    email: 'target@example.com',
    passwordHash: 'hidden',
    isMfaEnabled: false,
    status: 'ACTIVE',
    deactivatedAt: null as Date | null,
    deactivatedReason: null as string | null,
    tokenVersion: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    userBranches: [{ branchId: 'branch-id', isActive: true }],
    userRoles: [
      {
        userId: 'target-id',
        roleId: 'role-id',
        status: 'ACTIVE',
        revokedAt: null,
        revokedReason: null,
        role: makeRole(),
      },
    ],
    ...overrides,
  });

  const makePrivilegedRequestDetails = (
    overrides: Partial<{
      action: string;
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
    }> = {},
  ) => ({
    action: 'ADMIN_PRIVILEGED_ROLE_ASSIGN',
    tenantId: 'tenant-id',
    branchId: null,
    targetUserId: 'target-id',
    roleId: 'role-id',
    roleName: 'Custom Admin',
    requesterId: 'actor-id',
    reason: 'valid reason',
    requestedAt: '2026-01-01T00:00:00.000Z',
    targetUserSnapshot: {
      status: 'ACTIVE',
      tokenVersion: 1,
      activeRoles: [],
    },
    roleSnapshot: {
      status: 'ACTIVE',
      isSystem: false,
      privileged: true,
      archivedAt: null,
    },
    ...overrides,
  });

  const makeApprovalRequest = (
    overrides: Partial<{
      id: string;
      tenantId: string;
      requesterId: string;
      approverId: string | null;
      type: string;
      riskLevel: string;
      recordId: string;
      status: string;
      reason: string;
      remarks: string | null;
      details: ReturnType<typeof makePrivilegedRequestDetails>;
      createdAt: Date;
      updatedAt: Date;
    }> = {},
  ) => ({
    id: 'request-id',
    tenantId: 'tenant-id',
    requesterId: 'actor-id',
    approverId: null,
    type: 'ADMIN_PRIVILEGED_ROLE_ASSIGN',
    riskLevel: 'CRITICAL',
    recordId: 'target-id:role-id',
    status: 'PENDING',
    reason: 'valid reason',
    remarks: null,
    details: makePrivilegedRequestDetails(),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });

  it('deactivate rejects blank reason', async () => {
    await expect(
      service.deactivateUser(superAdminActor, 'target-id', '   '),
    ).rejects.toThrow(BadRequestException);
  });

  it('activate rejects blank reason', async () => {
    await expect(
      service.activateUser(superAdminActor, 'target-id', ''),
    ).rejects.toThrow(BadRequestException);
  });

  it('assign rejects blank reason', async () => {
    await expect(
      service.assignUserRole(superAdminActor, 'target-id', 'role-id', '   '),
    ).rejects.toThrow(BadRequestException);
  });

  it('revoke rejects blank reason', async () => {
    await expect(
      service.revokeUserRole(superAdminActor, 'target-id', 'role-id', '   '),
    ).rejects.toThrow(BadRequestException);
  });

  it('deactivate rejects self changes', async () => {
    await expect(
      service.deactivateUser(superAdminActor, superAdminActor.userId!, 'valid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('activate rejects self changes', async () => {
    await expect(
      service.activateUser(superAdminActor, superAdminActor.userId!, 'valid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('assign rejects self changes', async () => {
    await expect(
      service.assignUserRole(
        superAdminActor,
        superAdminActor.userId!,
        'role-id',
        'valid',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('revoke rejects self changes', async () => {
    await expect(
      service.revokeUserRole(
        superAdminActor,
        superAdminActor.userId!,
        'role-id',
        'valid',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deactivate rejects cross-tenant targets', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.deactivateUser(superAdminActor, 'target-id', 'valid'),
    ).rejects.toThrow(NotFoundException);
  });

  it('activate rejects cross-tenant targets', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.activateUser(superAdminActor, 'target-id', 'valid'),
    ).rejects.toThrow(NotFoundException);
  });

  it('assign rejects cross-tenant target users', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.assignUserRole(superAdminActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(NotFoundException);
  });

  it('branch actor rejects target with no active branch', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({ userBranches: [{ branchId: 'branch-id', isActive: false }] }),
    );

    await expect(
      service.assignUserRole(branchActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('branch actor rejects target with multiple active branches', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userBranches: [
          { branchId: 'branch-id', isActive: true },
          { branchId: 'other-branch', isActive: true },
        ],
      }),
    );

    await expect(
      service.assignUserRole(branchActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('branch actor can assign non-privileged role to exactly one matching branch target', async () => {
    const target = makeUser({ userRoles: [] });
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
    });
    const updated = makeUser({
      tokenVersion: 2,
      userRoles: [
        {
          userId: 'target-id',
          roleId: 'role-id',
          status: 'ACTIVE',
          revokedAt: null,
          revokedReason: null,
          role,
        },
      ],
    });
    prisma.user.findFirst
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(updated);
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 0 });
    prisma.userRole.create.mockResolvedValue({});
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.assignUserRole(
      branchActor,
      'target-id',
      'role-id',
      'valid reason',
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userBranches: {
            some: { branchId: 'branch-id', isActive: true },
          },
        }),
        data: { tokenVersion: { increment: 1 } },
      }),
    );
    expect(result).toMatchObject({
      userId: 'target-id',
      role: { id: 'role-id', name: 'Custom Scheduler' },
      assignmentStatus: 'ACTIVE',
      tokenVersion: 2,
    });
  });

  it('super admin can assign a tenant-scoped non-privileged target role directly', async () => {
    const target = makeUser({ userRoles: [] });
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Auditor',
      isSystem: false,
    });
    const updated = makeUser({
      tokenVersion: 2,
      userRoles: [
        {
          userId: 'target-id',
          roleId: 'role-id',
          status: 'ACTIVE',
          revokedAt: null,
          revokedReason: null,
          role,
        },
      ],
    });
    prisma.user.findFirst
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(updated);
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 0 });
    prisma.userRole.create.mockResolvedValue({});
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.assignUserRole(
      superAdminActor,
      'target-id',
      'role-id',
      'valid reason',
    );

    expect(result.assignmentStatus).toBe('ACTIVE');
  });

  it('assign rejects system roles', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ id: 'role-id', name: 'Cashier', isSystem: true }),
    );

    await expect(
      service.assignUserRole(superAdminActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('assign rejects cross-tenant roles', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(null);

    await expect(
      service.assignUserRole(superAdminActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(NotFoundException);
  });

  it('assign rejects Super Admin role', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ name: 'Super Admin', id: 'super-role-id' }),
    );

    await expect(
      service.assignUserRole(
        superAdminActor,
        'target-id',
        'super-role-id',
        'valid',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('assign rejects role containing admin.role.change', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(
      makeRole({
        rolePermissions: [
          {
            roleId: 'role-id',
            permissionId: 'permission-id',
            permission: {
              id: 'permission-id',
              tenantId: 'tenant-id',
              name: 'admin.role.change',
              scope: 'tenant/system',
            },
          },
        ],
      }),
    );

    await expect(
      service.assignUserRole(superAdminActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('assign rejects inactive or archived role', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(
      makeRole({
        status: 'INACTIVE',
        archivedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );

    await expect(
      service.assignUserRole(superAdminActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('assign rejects duplicate active assignment', async () => {
    const role = makeRole({ id: 'role-id', isSystem: false });
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userRoles: [
          {
            userId: 'target-id',
            roleId: 'role-id',
            status: 'ACTIVE',
            revokedAt: null,
            revokedReason: null,
            role,
          },
        ],
      }),
    );
    prisma.role.findFirst.mockResolvedValue(role);

    await expect(
      service.assignUserRole(superAdminActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ConflictException);
  });

  it('assign increments tokenVersion exactly once and writes audit with before/after', async () => {
    const target = makeUser({ userRoles: [] });
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
    });
    const updated = makeUser({
      tokenVersion: 2,
      userRoles: [
        {
          userId: 'target-id',
          roleId: 'role-id',
          status: 'ACTIVE',
          revokedAt: null,
          revokedReason: null,
          role,
        },
      ],
    });
    prisma.user.findFirst
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(updated);
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 0 });
    prisma.userRole.create.mockResolvedValue({});
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await service.assignUserRole(
      superAdminActor,
      'target-id',
      'role-id',
      'valid reason',
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { tokenVersion: { increment: 1 } } }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'USER_ROLE_ASSIGNED',
        oldValues: expect.objectContaining({
          beforeRoles: [],
          beforeTokenVersion: 1,
        }),
        newValues: expect.objectContaining({
          actorId: 'actor-id',
          targetUserId: 'target-id',
          roleId: 'role-id',
          roleName: 'Custom Scheduler',
          reason: 'valid reason',
          changedAt: expect.any(String),
          afterTokenVersion: 2,
          afterRoles: [{ id: 'role-id', name: 'Custom Scheduler' }],
        }),
      }),
      prisma,
      'branch-id',
    );
  });

  it('assign can reactivate a revoked assignment instead of creating a duplicate row', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
    });
    const target = makeUser({
      userRoles: [
        {
          userId: 'target-id',
          roleId: 'role-id',
          status: 'REVOKED',
          revokedAt: new Date('2026-01-01T00:00:00.000Z'),
          revokedReason: 'old reason',
          role,
        },
      ],
    });
    const updated = makeUser({
      tokenVersion: 2,
      userRoles: [
        {
          userId: 'target-id',
          roleId: 'role-id',
          status: 'ACTIVE',
          revokedAt: null,
          revokedReason: null,
          role,
        },
      ],
    });
    prisma.user.findFirst
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(updated);
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await service.assignUserRole(
      superAdminActor,
      'target-id',
      'role-id',
      'valid reason',
    );

    expect(prisma.userRole.create).not.toHaveBeenCalled();
  });

  it('assign updateMany count zero fails closed and does not audit', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(makeRole({ isSystem: false }));
    prisma.userRole.updateMany.mockResolvedValue({ count: 0 });
    prisma.userRole.create.mockResolvedValue({});
    prisma.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.assignUserRole(superAdminActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ConflictException);

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('revoke rejects privileged role changes', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(
      makeRole({
        rolePermissions: [
          {
            roleId: 'role-id',
            permissionId: 'permission-id',
            permission: {
              id: 'permission-id',
              tenantId: 'tenant-id',
              name: 'admin.role.change',
              scope: 'tenant/system',
            },
          },
        ],
      }),
    );

    await expect(
      service.revokeUserRole(superAdminActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('revoke rejects system roles', async () => {
    const role = makeRole({ id: 'role-id', name: 'Cashier', isSystem: true });
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userRoles: [
          {
            userId: 'target-id',
            roleId: 'role-id',
            status: 'ACTIVE',
            revokedAt: null,
            revokedReason: null,
            role,
          },
        ],
      }),
    );
    prisma.role.findFirst.mockResolvedValue(role);

    await expect(
      service.revokeUserRole(superAdminActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('revoke rejects missing or inactive assignment', async () => {
    const role = makeRole({ id: 'role-id', isSystem: false });
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(role);

    await expect(
      service.revokeUserRole(superAdminActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ConflictException);
  });

  it('revoked privileged historical role does not falsely block a target user', async () => {
    const historicalPrivilegedRole = makeRole({
      id: 'priv-role-id',
      name: 'Historical Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'priv-role-id',
          permissionId: 'permission-id',
          permission: {
            id: 'permission-id',
            tenantId: 'tenant-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
          },
        },
      ],
    });
    const assignableRole = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
    });
    const target = makeUser({
      userRoles: [
        {
          userId: 'target-id',
          roleId: 'priv-role-id',
          status: 'REVOKED',
          revokedAt: new Date('2026-01-01T00:00:00.000Z'),
          revokedReason: 'previous cleanup',
          role: historicalPrivilegedRole,
        },
      ],
    });
    const updated = makeUser({
      tokenVersion: 2,
      userRoles: [
        {
          userId: 'target-id',
          roleId: 'priv-role-id',
          status: 'REVOKED',
          revokedAt: new Date('2026-01-01T00:00:00.000Z'),
          revokedReason: 'previous cleanup',
          role: historicalPrivilegedRole,
        },
        {
          userId: 'target-id',
          roleId: 'role-id',
          status: 'ACTIVE',
          revokedAt: null,
          revokedReason: null,
          role: assignableRole,
        },
      ],
    });
    prisma.user.findFirst
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(updated);
    prisma.role.findFirst.mockResolvedValue(assignableRole);
    prisma.userRole.updateMany.mockResolvedValue({ count: 0 });
    prisma.userRole.create.mockResolvedValue({});
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.assignUserRole(
      superAdminActor,
      'target-id',
      'role-id',
      'valid reason',
    );

    expect(result.assignmentStatus).toBe('ACTIVE');
  });

  it('revoke increments tokenVersion exactly once and writes audit with before/after', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
    });
    const target = makeUser({
      tokenVersion: 4,
      userRoles: [
        {
          userId: 'target-id',
          roleId: 'role-id',
          status: 'ACTIVE',
          revokedAt: null,
          revokedReason: null,
          role,
        },
      ],
    });
    const updated = makeUser({ tokenVersion: 5, userRoles: [] });
    prisma.user.findFirst
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(updated);
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.revokeUserRole(
      superAdminActor,
      'target-id',
      'role-id',
      'valid reason',
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { tokenVersion: { increment: 1 } } }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'USER_ROLE_REVOKED',
        oldValues: expect.objectContaining({
          beforeRoles: [{ id: 'role-id', name: 'Custom Scheduler' }],
          beforeTokenVersion: 4,
        }),
        newValues: expect.objectContaining({
          actorId: 'actor-id',
          targetUserId: 'target-id',
          roleId: 'role-id',
          roleName: 'Custom Scheduler',
          reason: 'valid reason',
          afterTokenVersion: 5,
          afterRoles: [],
        }),
      }),
      prisma,
      'branch-id',
    );
    expect(result).toMatchObject({
      userId: 'target-id',
      role: { id: 'role-id', name: 'Custom Scheduler' },
      assignmentStatus: 'REVOKED',
      tokenVersion: 5,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('branch actor can revoke target with exactly one matching branch', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
    });
    const target = makeUser({
      userRoles: [
        {
          userId: 'target-id',
          roleId: 'role-id',
          status: 'ACTIVE',
          revokedAt: null,
          revokedReason: null,
          role,
        },
      ],
    });
    const updated = makeUser({ tokenVersion: 2, userRoles: [] });
    prisma.user.findFirst
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(updated);
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.revokeUserRole(
      branchActor,
      'target-id',
      'role-id',
      'valid reason',
    );

    expect(result.assignmentStatus).toBe('REVOKED');
  });

  it('branch actor cannot revoke target with no active branch', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({ userBranches: [{ branchId: 'branch-id', isActive: false }] }),
    );

    await expect(
      service.revokeUserRole(branchActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('branch actor cannot revoke target with multiple active branches', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userBranches: [
          { branchId: 'branch-id', isActive: true },
          { branchId: 'other-branch', isActive: true },
        ],
      }),
    );

    await expect(
      service.revokeUserRole(branchActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('revoke updateMany count zero fails closed and does not audit', async () => {
    const role = makeRole({ id: 'role-id', isSystem: false });
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userRoles: [
          {
            userId: 'target-id',
            roleId: 'role-id',
            status: 'ACTIVE',
            revokedAt: null,
            revokedReason: null,
            role,
          },
        ],
      }),
    );
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.revokeUserRole(superAdminActor, 'target-id', 'role-id', 'valid'),
    ).rejects.toThrow(ConflictException);

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('grant role permission rejects blank reason', async () => {
    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        '   ',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('grant role permission rejects blank permissionId', async () => {
    await expect(
      service.grantRolePermission(superAdminActor, 'role-id', '   ', 'valid'),
    ).rejects.toThrow(BadRequestException);
  });

  it('revoke role permission rejects blank reason', async () => {
    await expect(
      service.revokeRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        '   ',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('grant role permission rejects missing role', async () => {
    prisma.role.findFirst.mockResolvedValue(null);

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(NotFoundException);

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('grant role permission rejects cross-tenant permission', async () => {
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ id: 'role-id', isSystem: false }),
    );
    prisma.permission.findFirst.mockResolvedValue(null);

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(NotFoundException);

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('grant role permission rejects Super Admin role', async () => {
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ id: 'role-id', name: 'Super Admin', isSystem: false }),
    );

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('grant role permission rejects isSystem role', async () => {
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ id: 'role-id', isSystem: true }),
    );

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('grant role permission rejects inactive or archived role', async () => {
    prisma.role.findFirst.mockResolvedValue(
      makeRole({
        id: 'role-id',
        isSystem: false,
        status: 'INACTIVE',
        archivedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('grant role permission rejects role that already has admin.role.change', async () => {
    prisma.role.findFirst.mockResolvedValue(
      makeRole({
        id: 'role-id',
        isSystem: false,
        rolePermissions: [
          {
            roleId: 'role-id',
            permissionId: 'admin-permission-id',
            permission: makePermission({
              id: 'admin-permission-id',
              name: 'admin.role.change',
              scope: 'tenant/system',
            }),
          },
        ],
      }),
    );

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('grant role permission rejects admin.role.change permission', async () => {
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ id: 'role-id', isSystem: false }),
    );
    prisma.permission.findFirst.mockResolvedValue(
      makePermission({
        id: 'permission-id',
        name: 'admin.role.change',
        scope: 'tenant/system',
        riskLevel: 'LOW',
      }),
    );

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('grant role permission rejects MEDIUM risk permission', async () => {
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ id: 'role-id', isSystem: false }),
    );
    prisma.permission.findFirst.mockResolvedValue(
      makePermission({
        id: 'permission-id',
        name: 'approval.request.view',
        scope: 'tenant/branch',
        riskLevel: 'MEDIUM',
      }),
    );

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('grant role permission rejects HIGH risk permission', async () => {
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ id: 'role-id', isSystem: false }),
    );
    prisma.permission.findFirst.mockResolvedValue(
      makePermission({
        id: 'permission-id',
        name: 'audit.view',
        scope: 'tenant/branch/role scope',
        riskLevel: 'HIGH',
      }),
    );

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('grant role permission rejects PRIVILEGED risk permission', async () => {
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ id: 'role-id', isSystem: false }),
    );
    prisma.permission.findFirst.mockResolvedValue(
      makePermission({
        id: 'permission-id',
        name: 'billing.reversal.apply',
        scope: 'tenant/branch',
        riskLevel: 'PRIVILEGED',
      }),
    );

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('grant role permission rejects unclassified or unknown riskLevel', async () => {
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ id: 'role-id', isSystem: false }),
    );
    prisma.permission.findFirst.mockResolvedValue(
      makePermission({
        id: 'permission-id',
        name: 'custom.permission',
        scope: 'tenant/branch',
        riskLevel: 'UNKNOWN',
      }),
    );

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('grant role permission rejects duplicate active RolePermission', async () => {
    const permission = makePermission({
      id: 'permission-id',
      name: 'patient.view',
    });
    prisma.role.findFirst.mockResolvedValue(
      makeRole({
        id: 'role-id',
        isSystem: false,
        rolePermissions: [
          {
            roleId: 'role-id',
            permissionId: 'permission-id',
            permission,
          },
        ],
      }),
    );
    prisma.permission.findFirst.mockResolvedValue(permission);

    await expect(
      service.grantRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('branch-scoped actors cannot mutate tenant-wide role permissions', async () => {
    await expect(
      service.grantRolePermission(
        branchActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('grant role permission increments tokenVersion exactly once for affected active users only', async () => {
    const permission = makePermission({
      id: 'permission-id',
      name: 'patient.view',
    });
    const roleBefore = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [],
    });
    const roleAfter = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'permission-id',
          permission,
        },
      ],
    });
    prisma.role.findFirst
      .mockResolvedValueOnce(roleBefore)
      .mockResolvedValueOnce(roleAfter);
    prisma.permission.findFirst.mockResolvedValue(permission);
    prisma.rolePermission.create.mockResolvedValue({});
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-1', tokenVersion: 1 },
      { id: 'user-2', tokenVersion: 4 },
    ]);
    prisma.user.updateMany.mockResolvedValue({ count: 2 });

    const result = await service.grantRolePermission(
      superAdminActor,
      'role-id',
      'permission-id',
      'valid reason',
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['user-1', 'user-2'] } },
      data: { tokenVersion: { increment: 1 } },
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-id',
        status: 'ACTIVE',
        deactivatedAt: null,
        userRoles: {
          some: {
            roleId: 'role-id',
            status: 'ACTIVE',
          },
        },
      },
      select: {
        id: true,
        tokenVersion: true,
      },
    });
    expect(result).toEqual({
      roleId: 'role-id',
      roleName: 'Custom Scheduler',
      permissionId: 'permission-id',
      permissionName: 'patient.view',
      affectedUserIds: ['user-1', 'user-2'],
      affectedUserCount: 2,
    });
  });

  it('grant role permission writes audit payload with before/after permissions and token versions', async () => {
    const permission = makePermission({
      id: 'permission-id',
      name: 'patient.view',
    });
    const roleBefore = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [],
    });
    const roleAfter = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'permission-id',
          permission,
        },
      ],
    });
    prisma.role.findFirst
      .mockResolvedValueOnce(roleBefore)
      .mockResolvedValueOnce(roleAfter);
    prisma.permission.findFirst.mockResolvedValue(permission);
    prisma.rolePermission.create.mockResolvedValue({});
    prisma.user.findMany.mockResolvedValue([{ id: 'user-1', tokenVersion: 1 }]);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await service.grantRolePermission(
      superAdminActor,
      'role-id',
      'permission-id',
      'valid reason',
    );

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'ROLE_PERMISSION_GRANTED',
        oldValues: expect.objectContaining({
          beforePermissions: [],
          affectedUserIds: ['user-1'],
          beforeTokenVersions: [{ id: 'user-1', tokenVersion: 1 }],
        }),
        newValues: expect.objectContaining({
          actorId: 'actor-id',
          roleId: 'role-id',
          roleName: 'Custom Scheduler',
          permissionId: 'permission-id',
          permissionName: 'patient.view',
          reason: 'valid reason',
          changedAt: expect.any(String),
          afterPermissions: [{ id: 'permission-id', name: 'patient.view' }],
          affectedUserIds: ['user-1'],
          beforeTokenVersions: [{ id: 'user-1', tokenVersion: 1 }],
          afterTokenVersions: [{ id: 'user-1', tokenVersion: 2 }],
        }),
      }),
      prisma,
    );
  });

  it('revoke role permission rejects missing or non-active RolePermission and writes no audit', async () => {
    const permission = makePermission({
      id: 'permission-id',
      name: 'patient.view',
    });
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ id: 'role-id', isSystem: false, rolePermissions: [] }),
    );
    prisma.permission.findFirst.mockResolvedValue(permission);

    await expect(
      service.revokeRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ConflictException);

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('revoke role permission only affects intended role-permission pair', async () => {
    const permission = makePermission({
      id: 'permission-id',
      name: 'patient.view',
    });
    const roleBefore = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'permission-id',
          permission,
        },
      ],
    });
    const roleAfter = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [],
    });
    prisma.role.findFirst
      .mockResolvedValueOnce(roleBefore)
      .mockResolvedValueOnce(roleAfter);
    prisma.permission.findFirst.mockResolvedValue(permission);
    prisma.rolePermission.deleteMany.mockResolvedValue({ count: 1 });
    prisma.user.findMany.mockResolvedValue([]);

    await service.revokeRolePermission(
      superAdminActor,
      'role-id',
      'permission-id',
      'valid reason',
    );

    expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-id', permissionId: 'permission-id' },
    });
  });

  it('revoke role permission increments tokenVersion for affected active users only', async () => {
    const permission = makePermission({
      id: 'permission-id',
      name: 'patient.view',
    });
    const roleBefore = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'permission-id',
          permission,
        },
      ],
    });
    const roleAfter = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [],
    });
    prisma.role.findFirst
      .mockResolvedValueOnce(roleBefore)
      .mockResolvedValueOnce(roleAfter);
    prisma.permission.findFirst.mockResolvedValue(permission);
    prisma.rolePermission.deleteMany.mockResolvedValue({ count: 1 });
    prisma.user.findMany.mockResolvedValue([{ id: 'user-1', tokenVersion: 2 }]);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.revokeRolePermission(
      superAdminActor,
      'role-id',
      'permission-id',
      'valid reason',
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['user-1'] } },
      data: { tokenVersion: { increment: 1 } },
    });
    expect(result.affectedUserIds).toEqual(['user-1']);
  });

  it('grant/revoke does not increment tokenVersion for users not holding the affected role', async () => {
    const permission = makePermission({
      id: 'permission-id',
      name: 'patient.view',
    });
    const roleBefore = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [],
    });
    const roleAfter = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'permission-id',
          permission,
        },
      ],
    });
    prisma.role.findFirst
      .mockResolvedValueOnce(roleBefore)
      .mockResolvedValueOnce(roleAfter);
    prisma.permission.findFirst.mockResolvedValue(permission);
    prisma.rolePermission.create.mockResolvedValue({});
    prisma.user.findMany.mockResolvedValue([]);

    const result = await service.grantRolePermission(
      superAdminActor,
      'role-id',
      'permission-id',
      'valid reason',
    );

    expect(prisma.user.updateMany).not.toHaveBeenCalled();
    expect(result.affectedUserCount).toBe(0);
  });

  it('grant/revoke does not increment tokenVersion for revoked user-role holders', async () => {
    const permission = makePermission({
      id: 'permission-id',
      name: 'patient.view',
    });
    const roleBefore = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [],
    });
    const roleAfter = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'permission-id',
          permission,
        },
      ],
    });
    prisma.role.findFirst
      .mockResolvedValueOnce(roleBefore)
      .mockResolvedValueOnce(roleAfter);
    prisma.permission.findFirst.mockResolvedValue(permission);
    prisma.rolePermission.create.mockResolvedValue({});
    prisma.user.findMany.mockResolvedValue([]);

    await service.grantRolePermission(
      superAdminActor,
      'role-id',
      'permission-id',
      'valid reason',
    );

    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('revoke role permission fail-closed deleteMany zero writes no audit', async () => {
    const permission = makePermission({
      id: 'permission-id',
      name: 'patient.view',
    });
    const roleBefore = makeRole({
      id: 'role-id',
      name: 'Custom Scheduler',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'permission-id',
          permission,
        },
      ],
    });
    prisma.role.findFirst.mockResolvedValue(roleBefore);
    prisma.permission.findFirst.mockResolvedValue(permission);
    prisma.rolePermission.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      service.revokeRolePermission(
        superAdminActor,
        'role-id',
        'permission-id',
        'valid reason',
      ),
    ).rejects.toThrow(ConflictException);

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('stale JWT tokenVersion is rejected after role assignment or revocation', async () => {
    const strategyPrisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'target-id',
          email: 'target@example.com',
          tenantId: 'tenant-id',
          status: 'ACTIVE',
          deactivatedAt: null,
          tokenVersion: 2,
        }),
      },
    };
    const strategy = new JwtStrategy(
      strategyPrisma as unknown as PrismaService,
    );

    await expect(
      strategy.validate({
        sub: 'target-id',
        email: 'target@example.com',
        tenantId: 'tenant-id',
        roles: ['Receptionist'],
        tokenVersion: 1,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('stale JWT tokenVersion is rejected after role permission mutation for affected users', async () => {
    const strategyPrisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user1@example.com',
          tenantId: 'tenant-id',
          status: 'ACTIVE',
          deactivatedAt: null,
          tokenVersion: 3,
        }),
      },
    };
    const strategy = new JwtStrategy(
      strategyPrisma as unknown as PrismaService,
    );

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'user1@example.com',
        tenantId: 'tenant-id',
        roles: ['Custom Scheduler'],
        tokenVersion: 2,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('branch-scoped actor cannot request privileged role assignment', async () => {
    await expect(
      service.requestPrivilegedRoleAssignment(
        branchActor,
        'target-id',
        'role-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('branch-scoped actor cannot approve privileged role request', async () => {
    await expect(
      service.approvePrivilegedRoleChange(
        branchActor,
        'request-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('privileged assignment request blocks self-assignment', async () => {
    await expect(
      service.requestPrivilegedRoleAssignment(
        superAdminActor,
        superAdminActor.userId!,
        'role-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('privileged revoke request blocks self-revocation', async () => {
    await expect(
      service.requestPrivilegedRoleRevocation(
        superAdminActor,
        superAdminActor.userId!,
        'role-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('privileged assignment request blocks Super Admin role for this slice', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ name: 'Super Admin', id: 'super-role-id', isSystem: false }),
    );

    await expect(
      service.requestPrivilegedRoleAssignment(
        superAdminActor,
        'target-id',
        'super-role-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('privileged assignment request blocks isSystem role for this slice', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(
      makeRole({ id: 'role-id', name: 'Branch Admin', isSystem: true }),
    );

    await expect(
      service.requestPrivilegedRoleAssignment(
        superAdminActor,
        'target-id',
        'role-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('privileged assignment request blocks inactive or archived role', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(
      makeRole({
        id: 'role-id',
        name: 'Custom Admin',
        isSystem: false,
        status: 'INACTIVE',
        archivedAt: new Date('2026-01-01T00:00:00.000Z'),
        rolePermissions: [
          {
            roleId: 'role-id',
            permissionId: 'admin-permission-id',
            permission: makePermission({
              id: 'admin-permission-id',
              name: 'admin.role.change',
              scope: 'tenant/system',
              riskLevel: 'PRIVILEGED',
            }),
          },
        ],
      }),
    );

    await expect(
      service.requestPrivilegedRoleAssignment(
        superAdminActor,
        'target-id',
        'role-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('duplicate pending privileged request is rejected', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'admin-permission-id',
          permission: makePermission({
            id: 'admin-permission-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
            riskLevel: 'PRIVILEGED',
          }),
        },
      ],
    });
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.approvalRequest.findFirst.mockResolvedValue(makeApprovalRequest());

    await expect(
      service.requestPrivilegedRoleAssignment(
        superAdminActor,
        'target-id',
        'role-id',
        'valid reason',
      ),
    ).rejects.toThrow(ConflictException);

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('privileged assignment request writes approval request audit', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'admin-permission-id',
          permission: makePermission({
            id: 'admin-permission-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
            riskLevel: 'PRIVILEGED',
          }),
        },
      ],
    });
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.approvalRequest.findFirst.mockResolvedValue(null);
    prisma.approvalRequest.create.mockResolvedValue(makeApprovalRequest());

    const result = await service.requestPrivilegedRoleAssignment(
      superAdminActor,
      'target-id',
      'role-id',
      'valid reason',
    );

    expect(result).toMatchObject({
      requestId: 'request-id',
      targetUserId: 'target-id',
      roleId: 'role-id',
      roleName: 'Custom Admin',
      action: 'ADMIN_PRIVILEGED_ROLE_ASSIGN',
      status: 'PENDING',
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'PRIVILEGED_ROLE_CHANGE_REQUESTED',
        newValues: expect.objectContaining({
          requesterId: 'actor-id',
          targetUserId: 'target-id',
          roleId: 'role-id',
          roleName: 'Custom Admin',
          action: 'ADMIN_PRIVILEGED_ROLE_ASSIGN',
          reason: 'valid reason',
        }),
      }),
      prisma,
      undefined,
    );
  });

  it('approver cannot approve their own privileged request', async () => {
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(makeApprovalRequest());

    await expect(
      service.approvePrivilegedRoleChange(
        superAdminActor,
        'request-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('approve fails if actor lacks approval.request.process', async () => {
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [{ permission: { name: 'admin.role.change' } }],
        },
      },
    ]);

    await expect(
      service.approvePrivilegedRoleChange(
        superAdminActor,
        'request-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('approve fails if actor lacks admin.role.change', async () => {
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);

    await expect(
      service.approvePrivilegedRoleChange(
        superAdminActor,
        'request-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('approve succeeds only when actor has both required permissions', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'admin-permission-id',
          permission: makePermission({
            id: 'admin-permission-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
            riskLevel: 'PRIVILEGED',
          }),
        },
      ],
    });
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({ requesterId: 'other-user' }),
    );
    prisma.user.findFirst
      .mockResolvedValueOnce(makeUser({ userRoles: [] }))
      .mockResolvedValueOnce(
        makeUser({
          tokenVersion: 2,
          userRoles: [
            {
              userId: 'target-id',
              roleId: 'role-id',
              status: 'ACTIVE',
              revokedAt: null,
              revokedReason: null,
              role,
            },
          ],
        }),
      );
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 0 });
    prisma.userRole.create.mockResolvedValue({});
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.approvePrivilegedRoleChange(
      superAdminActor,
      'request-id',
      'valid reason',
    );

    expect(result.approvalStatus).toBe('APPROVED');
  });

  it('decision reason rejects blank whitespace at service layer', async () => {
    await expect(
      service.approvePrivilegedRoleChange(superAdminActor, 'request-id', '   '),
    ).rejects.toThrow(BadRequestException);
  });

  it('approval request lookup is tenant-scoped', async () => {
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(null);

    await expect(
      service.approvePrivilegedRoleChange(
        superAdminActor,
        'request-id',
        'valid reason',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('target user cannot approve request about themselves', async () => {
    const approver: RequestUser = {
      userId: 'target-id',
      tenantId: 'tenant-id',
      roles: ['Super Admin'],
      tokenVersion: 0,
    };
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({ requesterId: 'other-user' }),
    );

    await expect(
      service.approvePrivilegedRoleChange(
        approver,
        'request-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('already decided privileged request cannot be approved', async () => {
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({ status: 'APPROVED', requesterId: 'other-user' }),
    );

    await expect(
      service.approvePrivilegedRoleChange(
        superAdminActor,
        'request-id',
        'valid reason',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('approval-time role re-check catches role archived after request', async () => {
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({ requesterId: 'other-user' }),
    );
    prisma.user.findFirst.mockResolvedValue(makeUser({ userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(
      makeRole({
        id: 'role-id',
        name: 'Custom Admin',
        isSystem: false,
        archivedAt: new Date('2026-01-01T00:00:00.000Z'),
        rolePermissions: [
          {
            roleId: 'role-id',
            permissionId: 'admin-permission-id',
            permission: makePermission({
              id: 'admin-permission-id',
              name: 'admin.role.change',
              scope: 'tenant/system',
              riskLevel: 'PRIVILEGED',
            }),
          },
        ],
      }),
    );

    await expect(
      service.approvePrivilegedRoleChange(
        superAdminActor,
        'request-id',
        'valid reason',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('approval-time target user re-check catches deactivated target after request', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'admin-permission-id',
          permission: makePermission({
            id: 'admin-permission-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
            riskLevel: 'PRIVILEGED',
          }),
        },
      ],
    });
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({ requesterId: 'other-user' }),
    );
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        status: 'INACTIVE',
        deactivatedAt: new Date('2026-01-01T00:00:00.000Z'),
        userRoles: [],
      }),
    );
    prisma.role.findFirst.mockResolvedValue(role);

    await expect(
      service.approvePrivilegedRoleChange(
        superAdminActor,
        'request-id',
        'valid reason',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('approval applies immutable original payload, not body values', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'admin-permission-id',
          permission: makePermission({
            id: 'admin-permission-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
            riskLevel: 'PRIVILEGED',
          }),
        },
      ],
    });
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({ requesterId: 'other-user' }),
    );
    prisma.user.findFirst
      .mockResolvedValueOnce(makeUser({ userRoles: [] }))
      .mockResolvedValueOnce(
        makeUser({
          tokenVersion: 2,
          userRoles: [
            {
              userId: 'target-id',
              roleId: 'role-id',
              status: 'ACTIVE',
              revokedAt: null,
              revokedReason: null,
              role,
            },
          ],
        }),
      );
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 0 });
    prisma.userRole.create.mockResolvedValue({});
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.approvePrivilegedRoleChange(
      superAdminActor,
      'request-id',
      'approval remarks only',
    );

    expect(result).toMatchObject({
      requestId: 'request-id',
      action: 'ADMIN_PRIVILEGED_ROLE_ASSIGN',
      roleId: 'role-id',
      roleName: 'Custom Admin',
      approvalStatus: 'APPROVED',
    });
    expect(prisma.userRole.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          roleId: 'role-id',
          userId: 'target-id',
        }),
      }),
    );
  });

  it('assignment approval reactivates revoked UserRole correctly', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'admin-permission-id',
          permission: makePermission({
            id: 'admin-permission-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
            riskLevel: 'PRIVILEGED',
          }),
        },
      ],
    });
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({ requesterId: 'other-user' }),
    );
    prisma.user.findFirst
      .mockResolvedValueOnce(
        makeUser({
          userRoles: [
            {
              userId: 'target-id',
              roleId: 'role-id',
              status: 'REVOKED',
              revokedAt: new Date('2026-01-01T00:00:00.000Z'),
              revokedReason: 'previous revoke',
              role,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        makeUser({
          tokenVersion: 2,
          userRoles: [
            {
              userId: 'target-id',
              roleId: 'role-id',
              status: 'ACTIVE',
              revokedAt: null,
              revokedReason: null,
              role,
            },
          ],
        }),
      );
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });

    await service.approvePrivilegedRoleChange(
      superAdminActor,
      'request-id',
      'valid reason',
    );

    expect(prisma.userRole.create).not.toHaveBeenCalled();
    expect(prisma.userRole.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: 'ACTIVE' } }),
        data: expect.objectContaining({
          status: 'ACTIVE',
          revokedAt: null,
          revokedReason: null,
        }),
      }),
    );
  });

  it('assignment approval rejects duplicate active assignment', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'admin-permission-id',
          permission: makePermission({
            id: 'admin-permission-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
            riskLevel: 'PRIVILEGED',
          }),
        },
      ],
    });
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({ requesterId: 'other-user' }),
    );
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userRoles: [
          {
            userId: 'target-id',
            roleId: 'role-id',
            status: 'ACTIVE',
            revokedAt: null,
            revokedReason: null,
            role,
          },
        ],
      }),
    );
    prisma.role.findFirst.mockResolvedValue(role);

    await expect(
      service.approvePrivilegedRoleChange(
        superAdminActor,
        'request-id',
        'valid reason',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('revocation approval soft-revokes only active UserRole', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'admin-permission-id',
          permission: makePermission({
            id: 'admin-permission-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
            riskLevel: 'PRIVILEGED',
          }),
        },
      ],
    });
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({
        requesterId: 'other-user',
        type: 'ADMIN_PRIVILEGED_ROLE_REVOKE',
        details: makePrivilegedRequestDetails({
          action: 'ADMIN_PRIVILEGED_ROLE_REVOKE',
        }),
      }),
    );
    prisma.user.findFirst
      .mockResolvedValueOnce(
        makeUser({
          userRoles: [
            {
              userId: 'target-id',
              roleId: 'role-id',
              status: 'ACTIVE',
              revokedAt: null,
              revokedReason: null,
              role,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(makeUser({ tokenVersion: 2, userRoles: [] }));
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });

    await service.approvePrivilegedRoleChange(
      superAdminActor,
      'request-id',
      'valid reason',
    );

    expect(prisma.userRole.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
        data: expect.objectContaining({
          status: 'REVOKED',
          revokedReason: 'valid reason',
        }),
      }),
    );
  });

  it('revocation approval fail-closed count zero writes no apply audit', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'admin-permission-id',
          permission: makePermission({
            id: 'admin-permission-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
            riskLevel: 'PRIVILEGED',
          }),
        },
      ],
    });
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({
        requesterId: 'other-user',
        type: 'ADMIN_PRIVILEGED_ROLE_REVOKE',
        details: makePrivilegedRequestDetails({
          action: 'ADMIN_PRIVILEGED_ROLE_REVOKE',
        }),
      }),
    );
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userRoles: [
          {
            userId: 'target-id',
            roleId: 'role-id',
            status: 'ACTIVE',
            revokedAt: null,
            revokedReason: null,
            role,
          },
        ],
      }),
    );
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.approvePrivilegedRoleChange(
        superAdminActor,
        'request-id',
        'valid reason',
      ),
    ).rejects.toThrow(ConflictException);

    expect(prisma.approvalRequest.updateMany).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventKey: 'PRIVILEGED_ROLE_CHANGE_APPROVED' }),
      expect.anything(),
    );
  });

  it('approval increments target tokenVersion exactly once and writes transactional audit', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'admin-permission-id',
          permission: makePermission({
            id: 'admin-permission-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
            riskLevel: 'PRIVILEGED',
          }),
        },
      ],
    });
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({ requesterId: 'other-user' }),
    );
    prisma.user.findFirst
      .mockResolvedValueOnce(makeUser({ userRoles: [] }))
      .mockResolvedValueOnce(
        makeUser({
          tokenVersion: 2,
          userRoles: [
            {
              userId: 'target-id',
              roleId: 'role-id',
              status: 'ACTIVE',
              revokedAt: null,
              revokedReason: null,
              role,
            },
          ],
        }),
      );
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.userRole.updateMany.mockResolvedValue({ count: 0 });
    prisma.userRole.create.mockResolvedValue({});
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });

    await service.approvePrivilegedRoleChange(
      superAdminActor,
      'request-id',
      'valid reason',
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'target-id', tenantId: 'tenant-id' },
      data: { tokenVersion: { increment: 1 } },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'PRIVILEGED_ROLE_CHANGE_APPROVED',
        oldValues: expect.objectContaining({
          beforeTokenVersion: 1,
          beforeRoles: [],
        }),
        newValues: expect.objectContaining({
          approverId: 'actor-id',
          requesterId: 'other-user',
          targetUserId: 'target-id',
          roleId: 'role-id',
          roleName: 'Custom Admin',
          action: 'ADMIN_PRIVILEGED_ROLE_ASSIGN',
          decisionReason: 'valid reason',
          afterTokenVersion: 2,
          afterRoles: [{ id: 'role-id', name: 'Custom Admin' }],
          approvalRequestId: 'request-id',
        }),
      }),
      prisma,
    );
  });

  it('rejection writes audit and does not mutate UserRole or tokenVersion', async () => {
    const role = makeRole({
      id: 'role-id',
      name: 'Custom Admin',
      isSystem: false,
      rolePermissions: [
        {
          roleId: 'role-id',
          permissionId: 'admin-permission-id',
          permission: makePermission({
            id: 'admin-permission-id',
            name: 'admin.role.change',
            scope: 'tenant/system',
            riskLevel: 'PRIVILEGED',
          }),
        },
      ],
    });
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { name: 'admin.role.change' } },
            { permission: { name: 'approval.request.process' } },
          ],
        },
      },
    ]);
    prisma.approvalRequest.findFirst.mockResolvedValue(
      makeApprovalRequest({ requesterId: 'other-user' }),
    );
    prisma.role.findFirst.mockResolvedValue(role);
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.rejectPrivilegedRoleChange(
      superAdminActor,
      'request-id',
      'valid reason',
    );

    expect(prisma.userRole.create).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
    expect(result.approvalStatus).toBe('REJECTED');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventKey: 'PRIVILEGED_ROLE_CHANGE_REJECTED' }),
      prisma,
    );
  });

  describe('createUser', () => {
    const dto = {
      email: 'new@hospital.com',
      password: 'Password123',
      branchIds: ['branch-id'],
      roleIds: ['role-id'],
      reason: 'valid reason for creation',
    };

    it('rejects duplicate email in tenant', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.createUser(superAdminActor, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects invalid branch IDs', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.branch.findMany.mockResolvedValue([]);
      await expect(service.createUser(superAdminActor, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('blocks branch-scoped actor from assigning other branches', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.branch.findMany.mockResolvedValue([
        { id: 'other-branch', tenantId: 'tenant-id' },
      ]);
      await expect(
        service.createUser(branchActor, {
          ...dto,
          branchIds: ['other-branch'],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects system roles', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.branch.findMany.mockResolvedValue([
        { id: 'branch-id', tenantId: 'tenant-id' },
      ]);
      prisma.role.findMany.mockResolvedValue([
        {
          id: 'role-id',
          isSystem: true,
          name: 'System Role',
          rolePermissions: [],
        },
      ]);
      await expect(service.createUser(superAdminActor, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects privileged roles', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.branch.findMany.mockResolvedValue([
        { id: 'branch-id', tenantId: 'tenant-id' },
      ]);
      prisma.role.findMany.mockResolvedValue([
        {
          id: 'role-id',
          isSystem: false,
          name: 'Privileged Role',
          rolePermissions: [{ permission: { name: 'admin.role.change' } }],
        },
      ]);
      await expect(service.createUser(superAdminActor, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('succeeds with transactional create and audit', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.branch.findMany.mockResolvedValue([
        { id: 'branch-id', tenantId: 'tenant-id' },
      ]);
      prisma.role.findMany.mockResolvedValue([
        {
          id: 'role-id',
          isSystem: false,
          name: 'Normal Role',
          rolePermissions: [],
        },
      ]);
      prisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'new@hospital.com',
        status: 'ACTIVE',
        isMfaEnabled: false,
      });

      const result = await service.createUser(superAdminActor, dto);

      expect(result.userId).toBe('new-user-id');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.userBranch.createMany).toHaveBeenCalled();
      expect(prisma.userRole.createMany).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'ADMIN_USER_CREATED' }),
        expect.anything(),
        undefined,
      );
    });
  });

  describe('createCustomRole', () => {
    it('rejects branch-scoped actor from creating tenant-wide role', async () => {
      await expect(
        service.createCustomRole(branchActor, 'New Role', 'reason'),
      ).rejects.toThrow(
        'Branch-scoped actors cannot mutate tenant-wide role permissions',
      );
    });

    it('allows super admin branch-scoped actor to create custom role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.permission.findMany.mockResolvedValue([]);
      prisma.role.create.mockResolvedValue({
        id: 'new-role-id',
        name: 'New Role',
        status: 'ACTIVE',
        isSystem: false,
        rolePermissions: [],
      });

      const result = await service.createCustomRole(
        { ...branchActor, roles: ['Super Admin'] },
        'New Role',
        'reason',
      );

      expect(result.name).toBe('New Role');
      expect(prisma.role.create).toHaveBeenCalled();
    });

    it('rejects if role with same name already exists in tenant, case-insensitive', async () => {
      prisma.role.findFirst.mockResolvedValue({
        id: 'existing-id',
        name: 'new role',
      });
      await expect(
        service.createCustomRole(superAdminActor, 'New Role', 'reason'),
      ).rejects.toThrow('A role with this name already exists in the tenant');

      expect(prisma.role.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: superAdminActor.tenantId,
          name: { equals: 'New Role', mode: 'insensitive' },
        },
      });
    });

    it('rejects if cross-tenant permission ID provided', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.permission.findMany.mockResolvedValue([]); // Provided 1 ID, found 0
      await expect(
        service.createCustomRole(superAdminActor, 'New Role', 'reason', [
          'perm-id',
        ]),
      ).rejects.toThrow(
        'One or more requested permissions do not exist or belong to another tenant',
      );
    });

    it('rejects create role with admin.role.change permission even if misclassified', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.permission.findMany.mockResolvedValue([
        { id: 'perm-id', name: 'admin.role.change', riskLevel: 'LOW' },
      ]);
      await expect(
        service.createCustomRole(superAdminActor, 'New Role', 'reason', [
          'perm-id',
        ]),
      ).rejects.toThrow('requires maker-checker');
    });

    it('rejects create role with MEDIUM permission', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.permission.findMany.mockResolvedValue([
        { id: 'perm-id', name: 'safe.perm', riskLevel: 'MEDIUM' },
      ]);
      await expect(
        service.createCustomRole(superAdminActor, 'New Role', 'reason', [
          'perm-id',
        ]),
      ).rejects.toThrow('has risk level MEDIUM');
    });

    it('creates role with LOW-risk permissions successfully and writes audit', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      prisma.permission.findMany.mockResolvedValue([
        { id: 'perm-1', name: 'safe.perm', riskLevel: 'LOW' },
      ]);
      prisma.role.create.mockResolvedValue({
        id: 'new-role-id',
        name: 'New Role',
        status: 'ACTIVE',
        isSystem: false,
        rolePermissions: [
          { permission: { id: 'perm-1', name: 'safe.perm', riskLevel: 'LOW' } },
        ],
      });

      const result = await service.createCustomRole(
        superAdminActor,
        'New Role',
        'reason',
        ['perm-1'],
      );

      expect(result.roleId).toBe('new-role-id');
      expect(result.status).toBe('ACTIVE');
      expect(result.isSystem).toBe(false);
      expect(prisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Role',
            status: 'ACTIVE',
            isSystem: false,
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'ROLE_CREATED' }),
        prisma,
        undefined,
      );
    });

    it('rejects if permissionIds contains non-string or blank', async () => {
      await expect(
        service.createCustomRole(superAdminActor, 'New Role', 'reason', [' ']),
      ).rejects.toThrow('Invalid permission ID provided');
    });

    it('rejects duplicate permissionIds after trimming', async () => {
      await expect(
        service.createCustomRole(superAdminActor, 'New Role', 'reason', [
          'perm-1',
          ' perm-1 ',
        ]),
      ).rejects.toThrow('Duplicate permission ID provided');
    });
  });

  describe('archiveCustomRole', () => {
    const makeArchivableRole = (
      overrides: Partial<{
        id: string;
        tenantId: string;
        name: string;
        status: string;
        isSystem: boolean;
        archivedAt: Date | null;
        archivedReason: string | null;
        rolePermissions: Array<{
          roleId: string;
          permissionId: string;
          permission: {
            id: string;
            tenantId: string;
            name: string;
            scope: string;
            riskLevel: string;
          };
        }>;
      }> = {},
    ) => ({
      id: 'role-id',
      tenantId: 'tenant-id',
      name: 'Custom Role',
      status: 'ACTIVE',
      isSystem: false,
      archivedAt: null as Date | null,
      archivedReason: null as string | null,
      rolePermissions: [],
      ...overrides,
    });

    it('rejects branch-scoped actor unless Super Admin', async () => {
      await expect(
        service.archiveCustomRole(branchActor, 'role-id', 'valid reason'),
      ).rejects.toThrow(ForbiddenException);

      // Super Admin branch-scoped actor should be allowed
      prisma.role.findFirst.mockResolvedValue(
        makeArchivableRole({ name: 'Custom Role' }),
      );
      prisma.user.findMany.mockResolvedValue([]);
      prisma.role.updateMany.mockResolvedValue({ count: 1 });
      audit.log.mockResolvedValue({});

      await expect(
        service.archiveCustomRole(
          { ...branchActor, roles: ['Super Admin'] },
          'role-id',
          'valid reason',
        ),
      ).resolves.toBeDefined();
    });

    it('rejects blank reason', async () => {
      await expect(
        service.archiveCustomRole(superAdminActor, 'role-id', '   '),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects missing role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(
        service.archiveCustomRole(superAdminActor, 'role-id', 'valid reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects cross-tenant role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(
        service.archiveCustomRole(superAdminActor, 'role-id', 'valid reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects Super Admin role', async () => {
      prisma.role.findFirst.mockResolvedValue(
        makeArchivableRole({ name: 'Super Admin', id: 'super-role-id' }),
      );

      await expect(
        service.archiveCustomRole(
          superAdminActor,
          'super-role-id',
          'valid reason',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects isSystem role', async () => {
      prisma.role.findFirst.mockResolvedValue(
        makeArchivableRole({ isSystem: true }),
      );

      await expect(
        service.archiveCustomRole(superAdminActor, 'role-id', 'valid reason'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects inactive role', async () => {
      prisma.role.findFirst.mockResolvedValue(
        makeArchivableRole({ status: 'INACTIVE' }),
      );

      await expect(
        service.archiveCustomRole(superAdminActor, 'role-id', 'valid reason'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects already archived role', async () => {
      prisma.role.findFirst.mockResolvedValue(
        makeArchivableRole({ archivedAt: new Date() }),
      );

      await expect(
        service.archiveCustomRole(superAdminActor, 'role-id', 'valid reason'),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects role carrying admin.role.change', async () => {
      prisma.role.findFirst.mockResolvedValue(
        makeArchivableRole({
          rolePermissions: [
            {
              roleId: 'role-id',
              permissionId: 'permission-id',
              permission: {
                id: 'permission-id',
                tenantId: 'tenant-id',
                name: 'admin.role.change',
                scope: 'tenant/system',
                riskLevel: 'LOW',
              },
            },
          ],
        }),
      );

      await expect(
        service.archiveCustomRole(superAdminActor, 'role-id', 'valid reason'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('archives custom non-privileged role successfully', async () => {
      const role = makeArchivableRole({
        name: 'Custom Role',
        rolePermissions: [
          {
            roleId: 'role-id',
            permissionId: 'permission-id',
            permission: {
              id: 'permission-id',
              tenantId: 'tenant-id',
              name: 'patient.view',
              scope: 'tenant',
              riskLevel: 'LOW',
            },
          },
        ],
      });

      const affectedUsers = [
        { id: 'user-1', tokenVersion: 1 },
        { id: 'user-2', tokenVersion: 2 },
      ];

      prisma.role.findFirst.mockResolvedValue(role);
      prisma.user.findMany.mockResolvedValue(affectedUsers);
      prisma.role.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.updateMany.mockResolvedValue({ count: 2 });
      audit.log.mockResolvedValue({});

      const result = await service.archiveCustomRole(
        superAdminActor,
        'role-id',
        'valid reason for archiving',
      );

      expect(result).toMatchObject({
        roleId: 'role-id',
        name: 'Custom Role',
        status: 'INACTIVE',
        isSystem: false,
        archivedAt: expect.any(Date),
        affectedUserCount: 2,
      });

      expect(prisma.role.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'role-id',
            tenantId: 'tenant-id',
            archivedAt: null,
          }),
          data: expect.objectContaining({
            status: 'INACTIVE',
            archivedAt: expect.any(Date),
            archivedReason: 'valid reason for archiving',
          }),
        }),
      );

      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['user-1', 'user-2'] },
          }),
          data: expect.objectContaining({
            tokenVersion: { increment: 1 },
          }),
        }),
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'ROLE_ARCHIVED',
          tenantId: 'tenant-id',
          userId: superAdminActor.userId,
          recordType: 'Role',
          recordId: 'role-id',
          oldValues: expect.objectContaining({
            roleId: 'role-id',
            roleName: 'Custom Role',
            status: 'ACTIVE',
            isSystem: false,
            archivedAt: null,
            archivedReason: null,
          }),
          newValues: expect.objectContaining({
            actorId: superAdminActor.userId,
            roleId: 'role-id',
            roleName: 'Custom Role',
            reason: 'valid reason for archiving',
            archivedAt: expect.any(String),
            tenantId: 'tenant-id',
            branchId: null,
            isSystem: false,
            previousStatus: 'ACTIVE',
            newStatus: 'INACTIVE',
            affectedUserIds: ['user-1', 'user-2'],
            affectedUserCount: 2,
            beforeTokenVersions: expect.arrayContaining([
              expect.objectContaining({ id: 'user-1', tokenVersion: 1 }),
              expect.objectContaining({ id: 'user-2', tokenVersion: 2 }),
            ]),
            afterTokenVersions: expect.arrayContaining([
              expect.objectContaining({ id: 'user-1', tokenVersion: 2 }),
              expect.objectContaining({ id: 'user-2', tokenVersion: 3 }),
            ]),
          }),
        }),
        prisma,
        undefined,
      );
    });

    it('does not increment tokenVersion for users without active role assignment', async () => {
      const role = makeArchivableRole({
        name: 'Custom Role',
        rolePermissions: [
          {
            roleId: 'role-id',
            permissionId: 'permission-id',
            permission: {
              id: 'permission-id',
              tenantId: 'tenant-id',
              name: 'patient.view',
              scope: 'tenant',
              riskLevel: 'LOW',
            },
          },
        ],
      });

      // No active users with this role
      prisma.role.findFirst.mockResolvedValue(role);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.role.updateMany.mockResolvedValue({ count: 1 });
      audit.log.mockResolvedValue({});

      const result = await service.archiveCustomRole(
        superAdminActor,
        'role-id',
        'valid reason',
      );

      expect(result.affectedUserCount).toBe(0);
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('does not increment tokenVersion for users with revoked role assignment', async () => {
      const role = makeArchivableRole({
        name: 'Custom Role',
        rolePermissions: [
          {
            roleId: 'role-id',
            permissionId: 'permission-id',
            permission: {
              id: 'permission-id',
              tenantId: 'tenant-id',
              name: 'patient.view',
              scope: 'tenant',
              riskLevel: 'LOW',
            },
          },
        ],
      });

      prisma.role.findFirst.mockResolvedValue(role);
      // Simulate users with revoked role assignments (status not ACTIVE)
      prisma.user.findMany.mockResolvedValue([]);
      prisma.role.updateMany.mockResolvedValue({ count: 1 });
      audit.log.mockResolvedValue({});

      const result = await service.archiveCustomRole(
        superAdminActor,
        'role-id',
        'valid reason',
      );

      expect(result.affectedUserCount).toBe(0);
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('fails closed when role updateMany returns zero and writes no audit', async () => {
      prisma.role.findFirst.mockResolvedValue(
        makeArchivableRole({ name: 'Custom Role' }),
      );
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-1', tokenVersion: 1 },
      ]);
      prisma.role.updateMany.mockResolvedValue({ count: 0 }); // Simulate concurrent archival

      await expect(
        service.archiveCustomRole(superAdminActor, 'role-id', 'valid reason'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.user.updateMany).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled();
    });
  });

  describe('updateCustomRole', () => {
    const roleId = 'role-id';
    const reason = 'valid reason';
    const newName = 'Updated Role Name';

    it('rejects empty name if name is provided', async () => {
      await expect(
        service.updateCustomRole(superAdminActor, roleId, reason, '  '),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects if no update fields provided', async () => {
      await expect(
        service.updateCustomRole(superAdminActor, roleId, reason),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects missing role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);
      await expect(
        service.updateCustomRole(superAdminActor, roleId, reason, newName),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects system roles', async () => {
      prisma.role.findFirst.mockResolvedValue({
        id: roleId,
        isSystem: true,
        name: 'System Role',
        rolePermissions: [],
      });
      await expect(
        service.updateCustomRole(superAdminActor, roleId, reason, newName),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects Super Admin role', async () => {
      prisma.role.findFirst.mockResolvedValue({
        id: roleId,
        isSystem: false,
        name: 'Super Admin',
        rolePermissions: [],
      });
      await expect(
        service.updateCustomRole(superAdminActor, roleId, reason, newName),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects archived roles', async () => {
      prisma.role.findFirst.mockResolvedValue({
        id: roleId,
        isSystem: false,
        name: 'Archived Role',
        archivedAt: new Date(),
        status: 'ACTIVE',
        rolePermissions: [],
      });
      await expect(
        service.updateCustomRole(superAdminActor, roleId, reason, newName),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects inactive roles', async () => {
      prisma.role.findFirst.mockResolvedValue({
        id: roleId,
        isSystem: false,
        name: 'Inactive Role',
        archivedAt: null,
        status: 'INACTIVE',
        rolePermissions: [],
      });
      await expect(
        service.updateCustomRole(superAdminActor, roleId, reason, newName),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects roles carrying admin.role.change', async () => {
      prisma.role.findFirst.mockResolvedValue({
        id: roleId,
        isSystem: false,
        name: 'Privileged Role',
        archivedAt: null,
        status: 'ACTIVE',
        rolePermissions: [{ permission: { name: 'admin.role.change' } }],
      });
      await expect(
        service.updateCustomRole(superAdminActor, roleId, reason, newName),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects duplicate name in same tenant case-insensitively', async () => {
      prisma.role.findFirst
        .mockResolvedValueOnce({
          id: roleId,
          isSystem: false,
          name: 'Original Name',
          archivedAt: null,
          status: 'ACTIVE',
          rolePermissions: [],
        })
        .mockResolvedValueOnce({ id: 'other-id', name: newName });

      await expect(
        service.updateCustomRole(superAdminActor, roleId, reason, newName),
      ).rejects.toThrow(ConflictException);
    });

    it('succeeds with metadata update and audit', async () => {
      const oldRole = {
        id: roleId,
        isSystem: false,
        name: 'Original Name',
        archivedAt: null,
        status: 'ACTIVE',
        rolePermissions: [],
      };
      prisma.role.findFirst
        .mockResolvedValueOnce(oldRole) // Target lookup
        .mockResolvedValueOnce(null); // Uniqueness check

      prisma.role.update = jest.fn().mockResolvedValue({
        ...oldRole,
        name: newName,
      });

      const result = await service.updateCustomRole(
        superAdminActor,
        roleId,
        reason,
        newName,
      );

      expect(result).toMatchObject({
        roleId,
        name: newName,
        status: 'ACTIVE',
        isSystem: false,
      });

      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: roleId },
        data: { name: newName },
      });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'ROLE_UPDATED',
          oldValues: { name: 'Original Name' },
          newValues: expect.objectContaining({
            name: newName,
            reason: reason,
            changedFields: ['name'],
          }),
        }),
        expect.anything(),
        undefined,
      );
    });

    it('blocks branch-scoped actors from tenant-wide role update', async () => {
      await expect(
        service.updateCustomRole(branchActor, roleId, reason, newName),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
