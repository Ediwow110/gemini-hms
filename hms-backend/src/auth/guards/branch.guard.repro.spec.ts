import { Test, TestingModule } from '@nestjs/testing';
import { BranchGuard } from './branch.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('BranchGuard Repro', () => {
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

  describe('Global Roles (Compliance Officer, Tenant Admin) without branchId', () => {
    beforeEach(() => {
      // Mock: first call (REQUIRE_BRANCH_CONTEXT_KEY) => true, second call (BRANCH_BYPASS_ROLES_KEY) => bypass roles
      (reflector.getAllAndOverride as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValue(['Super Admin', 'Compliance Officer', 'Tenant Admin']);
    });

    it('should allow Compliance Officer without branchId to access approvals (global context)', () => {
      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', roles: ['Compliance Officer'] },
        {},
        {},
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow Tenant Admin without branchId to access approvals (global context)', () => {
      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', roles: ['Tenant Admin'] },
        {},
        {},
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should still deny Branch Admin without branchId', () => {
      (reflector.getAllAndOverride as jest.Mock)
        .mockReset()
        .mockReturnValueOnce(true)
        .mockReturnValue(['Super Admin', 'Compliance Officer', 'Tenant Admin']);

      const context = mockExecutionContext(
        { userId: 'u1', tenantId: 't1', roles: ['Branch Admin'] },
        {},
        {},
      );
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
