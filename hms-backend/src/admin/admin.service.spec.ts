import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { JwtStrategy } from '../auth/jwt.strategy';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    $transaction: jest.Mock;
    user: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let audit: { log: jest.Mock };

  const actor: RequestUser = {
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

  const makeUser = (
    overrides: Partial<ReturnType<typeof makeBaseUser>> = {},
  ) => ({
    ...makeBaseUser(),
    ...overrides,
  });

  const makeBaseUser = () => ({
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
        role: {
          id: 'role-id',
          tenantId: 'tenant-id',
          name: 'Receptionist',
          status: 'ACTIVE',
          isSystem: true,
          archivedAt: null as Date | null,
          archivedReason: null as string | null,
          rolePermissions: [],
        },
      },
    ],
  });

  it('deactivate rejects blank reason', async () => {
    await expect(
      service.deactivateUser(actor, 'target-id', '   '),
    ).rejects.toThrow(BadRequestException);
  });

  it('activate rejects blank reason', async () => {
    await expect(service.activateUser(actor, 'target-id', '')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('deactivate rejects self changes', async () => {
    await expect(
      service.deactivateUser(actor, actor.userId!, 'valid reason'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('activate rejects self changes', async () => {
    await expect(
      service.activateUser(actor, actor.userId!, 'valid reason'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deactivate rejects cross-tenant targets', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.deactivateUser(actor, 'target-id', 'valid reason'),
    ).rejects.toThrow(NotFoundException);
  });

  it('deactivate rejects other branch target for branch-scoped actor', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userBranches: [{ branchId: 'other-branch', isActive: true }],
      }),
    );

    await expect(
      service.deactivateUser(branchActor, 'target-id', 'valid reason'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deactivate rejects target with no active branch for branch-scoped actor', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({ userBranches: [{ branchId: 'branch-id', isActive: false }] }),
    );

    await expect(
      service.deactivateUser(branchActor, 'target-id', 'valid reason'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deactivate rejects target with multiple active branches for branch-scoped actor', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userBranches: [
          { branchId: 'branch-id', isActive: true },
          { branchId: 'other-branch', isActive: true },
        ],
      }),
    );

    await expect(
      service.deactivateUser(branchActor, 'target-id', 'valid reason'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('activate rejects other branch target for branch-scoped actor', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        status: 'INACTIVE',
        deactivatedAt: new Date('2026-01-01T00:00:00.000Z'),
        userBranches: [{ branchId: 'other-branch', isActive: true }],
      }),
    );

    await expect(
      service.activateUser(branchActor, 'target-id', 'valid reason'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deactivate rejects privileged targets until maker-checker exists', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userRoles: [
          {
            userId: 'target-id',
            roleId: 'super-role-id',
            role: {
              id: 'super-role-id',
              tenantId: 'tenant-id',
              name: 'Super Admin',
              status: 'ACTIVE',
              isSystem: true,
              archivedAt: null,
              archivedReason: null,
              rolePermissions: [],
            },
          },
        ],
      }),
    );

    await expect(
      service.deactivateUser(actor, 'target-id', 'valid reason'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deactivate rejects targets with admin.role.change until maker-checker exists', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userRoles: [
          {
            userId: 'target-id',
            roleId: 'admin-role-id',
            role: {
              id: 'admin-role-id',
              tenantId: 'tenant-id',
              name: 'Custom Admin',
              status: 'ACTIVE',
              isSystem: false,
              archivedAt: null,
              archivedReason: null,
              rolePermissions: [
                {
                  roleId: 'admin-role-id',
                  permissionId: 'admin-permission-id',
                  permission: {
                    id: 'admin-permission-id',
                    tenantId: 'tenant-id',
                    name: 'admin.role.change',
                    scope: 'tenant/system',
                  },
                },
              ],
            },
          },
        ],
      }),
    );

    await expect(
      service.deactivateUser(actor, 'target-id', 'valid reason'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deactivate treats inactive roles with admin.role.change as privileged', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        userRoles: [
          {
            userId: 'target-id',
            roleId: 'inactive-admin-role-id',
            role: {
              id: 'inactive-admin-role-id',
              tenantId: 'tenant-id',
              name: 'Dormant Admin',
              status: 'INACTIVE',
              isSystem: false,
              archivedAt: new Date('2026-01-01T00:00:00.000Z'),
              archivedReason: 'archived',
              rolePermissions: [
                {
                  roleId: 'inactive-admin-role-id',
                  permissionId: 'admin-permission-id',
                  permission: {
                    id: 'admin-permission-id',
                    tenantId: 'tenant-id',
                    name: 'admin.role.change',
                    scope: 'tenant/system',
                  },
                },
              ],
            },
          },
        ],
      }),
    );

    await expect(
      service.deactivateUser(actor, 'target-id', 'valid reason'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deactivate active user updates status, increments tokenVersion, and audits', async () => {
    const target = makeUser();
    const updated = makeUser({
      status: 'INACTIVE',
      deactivatedAt: new Date('2026-02-01T00:00:00.000Z'),
      deactivatedReason: 'valid reason',
      tokenVersion: 2,
    });
    prisma.user.findFirst
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(updated);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.deactivateUser(
      actor,
      'target-id',
      '  valid reason  ',
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'target-id',
          tenantId: 'tenant-id',
          status: 'ACTIVE',
          deactivatedAt: null,
        }),
        data: expect.objectContaining({
          status: 'INACTIVE',
          deactivatedReason: 'valid reason',
          tokenVersion: { increment: 1 },
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'USER_DEACTIVATED',
        oldValues: {
          before: expect.objectContaining({
            status: 'ACTIVE',
            tokenVersion: 1,
          }),
        },
        newValues: expect.objectContaining({
          actorId: 'actor-id',
          targetUserId: 'target-id',
          reason: 'valid reason',
          changedAt: expect.any(String),
          after: expect.objectContaining({
            status: 'INACTIVE',
            tokenVersion: 2,
          }),
        }),
      }),
      prisma,
      'branch-id',
    );
    expect(result).toMatchObject({
      id: 'target-id',
      email: 'target@example.com',
      tenantId: 'tenant-id',
      branchId: 'branch-id',
      status: 'INACTIVE',
      tokenVersion: 2,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('branch-scoped actor can deactivate a target with exactly one matching active branch', async () => {
    const target = makeUser();
    const updated = makeUser({
      status: 'INACTIVE',
      deactivatedAt: new Date('2026-02-01T00:00:00.000Z'),
      deactivatedReason: 'valid reason',
      tokenVersion: 2,
    });
    prisma.user.findFirst
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(updated);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await service.deactivateUser(branchActor, 'target-id', 'valid reason');

    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userBranches: {
            some: { branchId: 'branch-id', isActive: true },
          },
          NOT: {
            userBranches: {
              some: {
                isActive: true,
                branchId: { not: 'branch-id' },
              },
            },
          },
        }),
      }),
    );
  });

  it('deactivate updateMany count zero fails closed without audit', async () => {
    prisma.user.findFirst.mockResolvedValue(makeUser());
    prisma.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.deactivateUser(actor, 'target-id', 'valid reason'),
    ).rejects.toThrow(ConflictException);

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('deactivate inactive user is rejected', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        status: 'INACTIVE',
        deactivatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );

    await expect(
      service.deactivateUser(actor, 'target-id', 'valid reason'),
    ).rejects.toThrow(ConflictException);
  });

  it('activate rejects cross-tenant targets', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.activateUser(actor, 'target-id', 'valid reason'),
    ).rejects.toThrow(NotFoundException);
  });

  it('activate inactive user restores active status, increments tokenVersion, and audits', async () => {
    const target = makeUser({
      status: 'INACTIVE',
      deactivatedAt: new Date('2026-01-01T00:00:00.000Z'),
      deactivatedReason: 'old reason',
      tokenVersion: 4,
    });
    const updated = makeUser({
      status: 'ACTIVE',
      deactivatedAt: null,
      deactivatedReason: null,
      tokenVersion: 5,
    });
    prisma.user.findFirst
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(updated);
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.activateUser(
      actor,
      'target-id',
      'valid reason',
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'target-id',
          tenantId: 'tenant-id',
        }),
        data: {
          status: 'ACTIVE',
          deactivatedAt: null,
          deactivatedReason: null,
          tokenVersion: { increment: 1 },
        },
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'USER_ACTIVATED',
        oldValues: {
          before: expect.objectContaining({
            status: 'INACTIVE',
            tokenVersion: 4,
          }),
        },
        newValues: expect.objectContaining({
          actorId: 'actor-id',
          targetUserId: 'target-id',
          reason: 'valid reason',
          changedAt: expect.any(String),
          after: expect.objectContaining({
            status: 'ACTIVE',
            tokenVersion: 5,
          }),
        }),
      }),
      prisma,
      'branch-id',
    );
    expect(result).toMatchObject({
      id: 'target-id',
      status: 'ACTIVE',
      tokenVersion: 5,
      deactivatedAt: null,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('activate updateMany count zero fails closed without audit', async () => {
    prisma.user.findFirst.mockResolvedValue(
      makeUser({
        status: 'INACTIVE',
        deactivatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );
    prisma.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.activateUser(actor, 'target-id', 'valid reason'),
    ).rejects.toThrow(ConflictException);

    expect(audit.log).not.toHaveBeenCalled();
  });

  it('old JWT tokenVersion is rejected after lifecycle tokenVersion increment', async () => {
    const strategyPrisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'target-id',
          email: 'target@example.com',
          tenantId: 'tenant-id',
          status: 'INACTIVE',
          deactivatedAt: new Date('2026-01-01T00:00:00.000Z'),
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
});
