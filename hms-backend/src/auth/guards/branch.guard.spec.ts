import { Test, TestingModule } from '@nestjs/testing';
import { BranchGuard } from './branch.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('BranchGuard', () => {
  let guard: BranchGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<BranchGuard>(BranchGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const mockExecutionContext = (
    user?: any,
    body?: any,
    query?: any,
    params?: any,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          body,
          query,
          params,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  it('should allow when @RequireBranchContext() is NOT present', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = mockExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  describe('with @RequireBranchContext()', () => {
    beforeEach(() => {
      // First call (REQUIRE_BRANCH_CONTEXT_KEY) => true, second call (BRANCH_BYPASS_ROLES_KEY) => undefined (no bypass)
      (reflector.getAllAndOverride as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValue(undefined);
    });

    it('should deny when req.user is missing', () => {
      const context = mockExecutionContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny when req.user.branchId is missing', () => {
      const context = mockExecutionContext({ userId: 'u1', tenantId: 't1' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow when req.user.branchId exists and no body/query branchId is provided', () => {
      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', branchId: 'b1' },
        {},
        {},
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow when req.user.branchId matches body.branchId', () => {
      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', branchId: 'b1' },
        { branchId: 'b1' },
        {},
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny when body.branchId mismatches req.user.branchId', () => {
      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', branchId: 'b1' },
        { branchId: 'mismatch' },
        {},
      );
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny when body.branchId and query.branchId conflict', () => {
      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', branchId: 'b1' },
        { branchId: 'b1' },
        { branchId: 'b2' },
      );
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow when req.user.branchId matches query.branchId', () => {
      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', branchId: 'b1' },
        {},
        { branchId: 'b1' },
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny when params.branchId mismatches req.user.branchId', () => {
      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', branchId: 'b1' },
        {},
        {},
        { branchId: 'mismatch' },
      );
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow when params.branchId matches req.user.branchId', () => {
      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', branchId: 'b1' },
        {},
        {},
        { branchId: 'b1' },
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow Super Admin to target a branch when consistent across body/query/params', () => {
      const context = mockExecutionContext(
        {
          userId: 'u1',
          tenantId: 't1',
          roles: ['Super Admin'],
          branchId: 'b1',
        },
        { branchId: 'b2' },
        {},
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should still reject Super Admin when params/body/query branchIds conflict', () => {
      const context = mockExecutionContext(
        {
          userId: 'u1',
          tenantId: 't1',
          roles: ['Super Admin'],
          branchId: 'b1',
        },
        { branchId: 'b2' },
        { branchId: 'b3' },
      );
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny Super Admin without a selected or explicitly targeted branch', () => {
      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', roles: ['Super Admin'] },
        {},
        {},
      );
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should still deny Super Admin when a branch is requested but none is selected in the session', () => {
      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', roles: ['Super Admin'] },
        {},
        { branchId: 'b2' },
      );
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow bypass role user without branchId', () => {
      // Reset mock: first call returns true (isRequired), second call returns bypass roles
      (reflector.getAllAndOverride as jest.Mock)
        .mockReset()
        .mockReturnValueOnce(true)
        .mockReturnValue(['Tenant Admin']);

      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', roles: ['Tenant Admin'] },
        {},
        {},
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny non-bypass-role user without branchId even when bypass roles defined', () => {
      (reflector.getAllAndOverride as jest.Mock)
        .mockReset()
        .mockReturnValueOnce(true)
        .mockReturnValue(['Tenant Admin']);

      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', roles: ['Branch Admin'] },
        {},
        {},
      );
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
