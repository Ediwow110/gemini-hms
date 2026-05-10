import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import type { RequestUser } from '../../common/types/authenticated-request.type';

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
  reflector: Reflector,
  user: RequestUser | undefined,
): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
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

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  // ─── No @Roles() decorator ────────────────────────────────────────

  it('should allow access when no roles are required (no decorator)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = buildContext(reflector, buildUser());
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // ─── Missing user context (fail-closed) ───────────────────────────

  it('should deny access when req.user is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);
    const ctx = buildContext(reflector, undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  // ─── Missing or empty roles ───────────────────────────────────────

  it('should deny access when req.user.roles is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);
    const ctx = buildContext(reflector, buildUser({ roles: undefined }));
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should deny access when req.user.roles is an empty array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);
    const ctx = buildContext(reflector, buildUser({ roles: [] }));
    expect(guard.canActivate(ctx)).toBe(false);
  });

  // ─── Role mismatch ────────────────────────────────────────────────

  it('should deny access when user does not have the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);
    const ctx = buildContext(reflector, buildUser({ roles: ['Doctor'] }));
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should deny access when user has a different role from multiple required', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['Admin', 'SuperAdmin']);
    const ctx = buildContext(reflector, buildUser({ roles: ['Nurse'] }));
    expect(guard.canActivate(ctx)).toBe(false);
  });

  // ─── Role match (allow) ───────────────────────────────────────────

  it('should allow access when user has the exact required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);
    const ctx = buildContext(reflector, buildUser({ roles: ['Admin'] }));
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when user has one of multiple required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['Admin', 'SuperAdmin']);
    const ctx = buildContext(
      reflector,
      buildUser({ roles: ['SuperAdmin', 'Nurse'] }),
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // ─── branchId optionality ─────────────────────────────────────────

  it('should not require branchId for role checks', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Doctor']);
    const ctx = buildContext(
      reflector,
      buildUser({ roles: ['Doctor'], branchId: undefined }),
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should still work when branchId is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Doctor']);
    const ctx = buildContext(
      reflector,
      buildUser({ roles: ['Doctor'], branchId: 'branch-uuid-123' }),
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
