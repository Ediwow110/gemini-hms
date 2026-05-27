import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../../common/types/authenticated-request.type';
import { InventoryController } from '../../inventory/inventory.controller';

/**
 * Build a minimal mock RequestUser.
 * tenantId is required by the interface; all other fields are optional.
 */
function buildUser(overrides: Partial<RequestUser> = {}): RequestUser {
  return {
    tenantId: 'tenant-uuid-default',
    ...overrides,
  };
}

/**
 * Build a mock ExecutionContext that returns the given user (or undefined).
 */
function buildContext(
  user: RequestUser | undefined,
  handler?: (...args: never[]) => unknown,
  targetClass?: new (...args: never[]) => unknown,
): ExecutionContext {
  return {
    getHandler: jest.fn().mockReturnValue(handler),
    getClass: jest.fn().mockReturnValue(targetClass),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext;
}

/**
 * Build a mock PrismaService.userRole.findMany result.
 * Each permission name is wrapped in the nested structure the guard expects.
 */
function buildPrismaResult(permissionNames: string[]) {
  return [
    {
      role: {
        rolePermissions: permissionNames.map((name) => ({
          permission: { name },
        })),
      },
    },
  ];
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let prisma: PrismaService;
  let findManyMock: jest.Mock;

  beforeEach(() => {
    reflector = new Reflector();
    findManyMock = jest.fn().mockResolvedValue([]);
    prisma = {
      userRole: {
        findMany: findManyMock,
      },
    } as unknown as PrismaService;
    guard = new PermissionsGuard(reflector, prisma);
  });

  // ─── No @RequirePermissions() decorator ───────────────────────────

  it('should allow access when no permissions are required (no decorator)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = buildContext(buildUser());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should allow access when required permissions is an empty array', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const ctx = buildContext(buildUser());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  // ─── Missing user context (fail-closed) ───────────────────────────

  it('should throw ForbiddenException when req.user is undefined', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['manage_patients']);
    const ctx = buildContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when userId is missing', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['manage_patients']);
    const ctx = buildContext(buildUser({ userId: undefined }));
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when tenantId is missing', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['manage_patients']);
    // Force tenantId to undefined to simulate malformed context
    const user = buildUser({ userId: 'user-uuid-123' }) as RequestUser & {
      tenantId: string | undefined;
    };
    user.tenantId = undefined as unknown as string;
    const ctx = buildContext(user);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  // ─── Insufficient permissions ─────────────────────────────────────

  it('should throw ForbiddenException when user has no permissions at all', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['manage_patients']);
    findManyMock.mockResolvedValue([]);
    const ctx = buildContext(
      buildUser({ userId: 'user-uuid-123', tenantId: 'tenant-uuid-456' }),
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has wrong permissions', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['manage_patients']);
    findManyMock.mockResolvedValue(buildPrismaResult(['view_reports']));
    const ctx = buildContext(
      buildUser({ userId: 'user-uuid-123', tenantId: 'tenant-uuid-456' }),
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  // ─── Sufficient permissions (allow) ───────────────────────────────

  it('should allow access when user has the exact required permission', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['manage_patients']);
    findManyMock.mockResolvedValue(buildPrismaResult(['manage_patients']));
    const ctx = buildContext(
      buildUser({ userId: 'user-uuid-123', tenantId: 'tenant-uuid-456' }),
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should allow access when user has one of multiple required permissions (RequireAny)', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['manage_patients', 'manage_billing']);
    findManyMock.mockResolvedValue(buildPrismaResult(['manage_billing']));
    const ctx = buildContext(
      buildUser({ userId: 'user-uuid-123', tenantId: 'tenant-uuid-456' }),
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  // ─── Tenant scope enforcement ─────────────────────────────────────

  it('should pass tenantId to prisma query for tenant-scoped lookup', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['manage_patients']);
    findManyMock.mockResolvedValue(buildPrismaResult(['manage_patients']));
    const ctx = buildContext(
      buildUser({ userId: 'user-uuid-123', tenantId: 'tenant-uuid-789' }),
    );
    await guard.canActivate(ctx);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-uuid-123',
          status: 'ACTIVE',
          role: {
            tenantId: 'tenant-uuid-789',
            status: 'ACTIVE',
            archivedAt: null,
          },
        },
      }),
    );
  });

  // ─── branchId optionality ─────────────────────────────────────────

  it('should not break when branchId is absent', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['manage_patients']);
    findManyMock.mockResolvedValue(buildPrismaResult(['manage_patients']));
    const ctx = buildContext(
      buildUser({
        userId: 'user-uuid-123',
        tenantId: 'tenant-uuid-456',
        branchId: undefined,
      }),
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should not break when branchId is present', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['manage_patients']);
    findManyMock.mockResolvedValue(buildPrismaResult(['manage_patients']));
    const ctx = buildContext(
      buildUser({
        userId: 'user-uuid-123',
        tenantId: 'tenant-uuid-456',
        branchId: 'branch-uuid-999',
      }),
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  // ─── ForbiddenException payload shape ─────────────────────────────

  it('should reject dispense-only users from stock adjustment route', async () => {
    const ctx = buildContext(
      buildUser({ userId: 'user-uuid-123', tenantId: 'tenant-uuid-456' }),
      InventoryController.prototype.adjustStock,
      InventoryController,
    );
    findManyMock.mockResolvedValue(
      buildPrismaResult(['inventory.stock.dispense']),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should allow users with inventory.adjust.approve on stock adjustment route', async () => {
    const ctx = buildContext(
      buildUser({ userId: 'user-uuid-123', tenantId: 'tenant-uuid-456' }),
      InventoryController.prototype.adjustStock,
      InventoryController,
    );
    findManyMock.mockResolvedValue(
      buildPrismaResult(['inventory.adjust.approve']),
    );

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should include permission_denied message in ForbiddenException', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['manage_patients']);
    findManyMock.mockResolvedValue([]);
    const ctx = buildContext(
      buildUser({ userId: 'user-uuid-123', tenantId: 'tenant-uuid-456' }),
    );

    let thrown: ForbiddenException | undefined;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      thrown = e as ForbiddenException;
    }

    expect(thrown).toBeInstanceOf(ForbiddenException);
    const response = thrown!.getResponse() as Record<string, unknown>;
    expect(response.message).toBe('permission_denied');
  });

  // ─── Archived/inactive role filtering ──────────────────────────────

  it('should exclude permissions from archived roles when UserRole is ACTIVE', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['archived.role.perm']);
    // Simulate DB filtering: archived roles are excluded, so findMany returns empty
    findManyMock.mockResolvedValue([]);
    const ctx = buildContext(
      buildUser({ userId: 'user-uuid-123', tenantId: 'tenant-uuid-456' }),
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-uuid-123',
          status: 'ACTIVE',
          role: expect.objectContaining({
            status: 'ACTIVE',
            archivedAt: null,
          }),
        },
      }),
    );
  });
});
