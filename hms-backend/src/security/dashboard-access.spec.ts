import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DashboardController } from '../dashboard/controllers/dashboard.controller';
import { MetricsController } from '../admin/metrics.controller';
import { ClinicalWorkflowController } from '../clinical/clinical-workflow.controller';

describe('Dashboard API access control', () => {
  const UNINTENDED_ROLES = [
    'Doctor',
    'Nurse',
    'Cashier',
    'Pharmacist',
    'Med-Tech',
    'Patient',
    'Supplier',
    'IT Support',
    'HR Manager',
    'Marketplace Admin',
    'Compliance Officer',
  ];

  const dashboardEndpoints: {
    name: string;
    method: any;
    expectedRoles: string[];
    controllerName: string;
  }[] = [
    {
      name: 'Admin getSummary',
      method: DashboardController.prototype.getSummary,
      expectedRoles: ['Super Admin'],
      controllerName: 'Dashboard',
    },
    {
      name: 'Admin getTrends',
      method: DashboardController.prototype.getTrends,
      expectedRoles: ['Super Admin'],
      controllerName: 'Dashboard',
    },
    {
      name: 'Admin getAlerts',
      method: DashboardController.prototype.getAlerts,
      expectedRoles: ['Super Admin'],
      controllerName: 'Dashboard',
    },
    {
      name: 'Admin getTopLists',
      method: DashboardController.prototype.getTopLists,
      expectedRoles: ['Super Admin'],
      controllerName: 'Dashboard',
    },
    {
      name: 'Metrics getMetrics',
      method: MetricsController.prototype.getMetrics,
      expectedRoles: ['Super Admin', 'Branch Admin'],
      controllerName: 'Metrics',
    },
    {
      name: 'Clinical Ops getDashboardSummary',
      method: ClinicalWorkflowController.prototype.getDashboardSummary,
      expectedRoles: ['Doctor', 'Nurse', 'Branch Admin', 'Super Admin'],
      controllerName: 'ClinicalWorkflow',
    },
  ];

  describe('@Roles metadata on endpoints', () => {
    for (const { name, method, expectedRoles } of dashboardEndpoints) {
      it(`${name} requires ${expectedRoles.join(' or ')}`, () => {
        const roles: string[] = Reflect.getMetadata(ROLES_KEY, method);
        expect(roles).toBeDefined();
        for (const role of expectedRoles) {
          expect(roles).toContain(role);
        }
      });

      it(`${name} does not allow unintended roles`, () => {
        const roles: string[] = Reflect.getMetadata(ROLES_KEY, method);
        const relevantUnintended = UNINTENDED_ROLES.filter(
          (r) => !expectedRoles.includes(r),
        );
        for (const unwanted of relevantUnintended) {
          expect(roles).not.toContain(unwanted);
        }
      });
    }
  });

  describe('RolesGuard rejects unintended roles for dashboard endpoints', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new RolesGuard(reflector);
    });

    function buildContext(userRoles: string[], requiredRoles: string[]) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);
      return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { userId: 'u1', tenantId: 't1', roles: userRoles },
          }),
          getResponse: jest.fn(),
          getNext: jest.fn(),
        }),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      } as any;
    }

    for (const { name, expectedRoles } of dashboardEndpoints) {
      describe(name, () => {
        for (const role of expectedRoles) {
          it(`allows ${role}`, () => {
            const ctx = buildContext([role], expectedRoles);
            expect(guard.canActivate(ctx)).toBe(true);
          });
        }

        const rejectedRoles = UNINTENDED_ROLES.filter(
          (r) => !expectedRoles.includes(r),
        );
        for (const role of rejectedRoles) {
          it(`rejects ${role}`, () => {
            const ctx = buildContext([role], expectedRoles);
            expect(guard.canActivate(ctx)).toBe(false);
          });
        }
      });
    }

    it('rejects unauthenticated', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['Super Admin']);
      const ctx = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({}),
          getResponse: jest.fn(),
          getNext: jest.fn(),
        }),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      } as any;
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });
});
