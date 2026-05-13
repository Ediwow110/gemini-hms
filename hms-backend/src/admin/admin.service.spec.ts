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
    };
    permission: {
      findFirst: jest.Mock;
    };
    rolePermission: {
      create: jest.Mock;
      deleteMany: jest.Mock;
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
      },
      userRole: {
        create: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
      },
      permission: {
        findFirst: jest.fn(),
      },
      rolePermission: {
        create: jest.fn(),
        deleteMany: jest.fn(),
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
});
