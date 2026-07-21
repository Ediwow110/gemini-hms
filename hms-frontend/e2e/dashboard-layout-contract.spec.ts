import { expect, test, type Page, type TestInfo } from '@playwright/test';

interface MockUser {
  id: string;
  email: string;
  tenantId: string;
  branchId?: string;
  roles: string[];
  permissions: string[];
  defaultPortalPath: string;
}

const users = {
  admin: {
    id: 'user-admin',
    email: 'admin@example.invalid',
    tenantId: 'tenant-demo',
    branchId: 'branch-demo',
    roles: ['Super Admin'],
    permissions: [
      'admin.metrics.view',
      'admin.tenant.view',
      'admin.user.view',
      'admin.branch.view',
      'compliance.audit.review',
      'compliance.report.export',
      'notification.view',
    ],
    defaultPortalPath: '/admin',
  },
  hr: {
    id: 'user-hr',
    email: 'hr@example.invalid',
    tenantId: 'tenant-demo',
    branchId: 'branch-demo',
    roles: ['HR Manager'],
    permissions: [
      'hr.employee.view',
      'hr.employee.manage',
      'hr.payroll.view',
      'hr.license.view',
      'notification.view',
    ],
    defaultPortalPath: '/hr',
  },
  it: {
    id: 'user-it',
    email: 'it@example.invalid',
    tenantId: 'tenant-demo',
    branchId: 'branch-demo',
    roles: ['IT Support'],
    permissions: [
      'it.system.view',
      'it.support.manage',
      'notification.view',
    ],
    defaultPortalPath: '/it',
  },
  patient: {
    id: 'user-patient',
    email: 'patient@example.invalid',
    tenantId: 'tenant-demo',
    roles: ['Patient'],
    permissions: ['patient.portal.view_own'],
    defaultPortalPath: '/patient',
  },
  supplier: {
    id: 'user-supplier',
    email: 'supplier@example.invalid',
    tenantId: 'tenant-demo',
    roles: ['Supplier'],
    permissions: ['marketplace.supplier.view'],
    defaultPortalPath: '/supplier',
  },
} satisfies Record<string, MockUser>;

const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

const installApiMocks = async (page: Page, user: MockUser) => {
  await page.route('**/patient-portal/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/patient-portal/profile')) {
      await route.fulfill(
        json({
          id: 'patient-demo',
          patientNumber: 'DEMO-PAT-1001',
          firstName: 'Demo',
          lastName: 'Patient',
          dob: '1998-06-15',
          status: 'ACTIVE',
        }),
      );
      return;
    }
    await route.fulfill(json([]));
  });

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path.endsWith('/v1/auth/me')) {
      await route.fulfill(json(user));
      return;
    }

    if (path.endsWith('/v1/dashboard/admin/summary')) {
      await route.fulfill(
        json({
          activePatients: 0,
          todaysAppointments: 0,
          pendingLabs: 0,
          lowStock: 0,
          revenue: 0,
          securityAlerts: 0,
        }),
      );
      return;
    }

    if (path.includes('/v1/dashboard/admin/alerts')) {
      await route.fulfill(json({ lowStock: [], criticalLabs: [] }));
      return;
    }

    if (path.includes('/v1/dashboard/admin/top-lists')) {
      await route.fulfill(json({ busiestDepts: [], unpaidBills: [] }));
      return;
    }

    if (path.includes('/v1/dashboard/admin/trends')) {
      await route.fulfill(json([]));
      return;
    }

    if (path.includes('/v1/admin/tenants')) {
      await route.fulfill(json([]));
      return;
    }

    if (path.includes('/v1/analytics/')) {
      const emptyMetrics = path.endsWith('/hr-metrics')
        ? { headcount: 0, pendingLeave: 0, expiredLicenses: 0, staffingGap: 0 }
        : path.endsWith('/it-metrics')
          ? {
              activeSessions: 0,
              healthyIntegrations: 0,
              backupFailures: 0,
              systemLatencyMs: 0,
            }
          : path.endsWith('/marketplace-metrics')
            ? { gmv: 0, totalOrders: 0, approvedListings: 0, revenue: 0 }
            : path.endsWith('/compliance-metrics')
              ? { totalAuditEvents: 0, securityAlerts: 0, complianceScore: 0 }
              : [];
      await route.fulfill(json(emptyMetrics));
      return;
    }

    if (path.includes('/v1/hr/')) {
      await route.fulfill(json([]));
      return;
    }

    if (path.endsWith('/v1/it-support/tickets/stats')) {
      await route.fulfill(json({ open: 0, inProgress: 0, total: 0, urgent: 0 }));
      return;
    }

    if (path.includes('/v1/it-support/')) {
      await route.fulfill(
        json(path.endsWith('/health') ? { services: [], overallStatus: 'healthy' } : []),
      );
      return;
    }

    if (path.includes('/marketplace/supplier/')) {
      await route.fulfill(
        json(path.endsWith('/orders') ? { salesOrders: [] } : []),
      );
      return;
    }

    await route.fulfill(json([]));
  });
};

const assertLayout = async (
  page: Page,
  expectedHeading: RegExp,
  viewport: { width: number; height: number },
  testInfo: TestInfo,
  screenshotName: string,
) => {
  await page.setViewportSize(viewport);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: expectedHeading }).first()).toBeVisible();
  await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, `${screenshotName} horizontal overflow`).toBeLessThanOrEqual(5);

  const metrics = page.locator('[data-dashboard-metric-card]');
  const metricCount = await metrics.count();
  if (viewport.width >= 1200 && metricCount >= 2) {
    const boxes = await Promise.all(
      Array.from({ length: Math.min(metricCount, 6) }, (_, index) =>
        metrics.nth(index).boundingBox(),
      ),
    );
    const visibleBoxes = boxes.filter(
      (box): box is NonNullable<typeof box> => Boolean(box),
    );
    const firstTop = visibleBoxes[0]?.y;
    const firstRow = visibleBoxes.filter(
      (box) => firstTop !== undefined && Math.abs(box.y - firstTop) <= 3,
    );
    if (firstRow.length >= 2) {
      const heights = firstRow.map((box) => box.height);
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(3);
    }
  }

  const chartCards = page.locator('[data-dashboard-chart-card]');
  if (await chartCards.count()) {
    await expect(chartCards.first()).toBeVisible();
  }

  await testInfo.attach(`${screenshotName}-${viewport.width}`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
};

const dashboardCases = [
  { path: '/admin', user: users.admin, heading: /Platform Command Center/i, name: 'admin' },
  { path: '/hr', user: users.hr, heading: /Workforce Command Center/i, name: 'hr' },
  { path: '/it', user: users.it, heading: /IT Reliability Workspace/i, name: 'it' },
  { path: '/patient', user: users.patient, heading: /Hello, Demo/i, name: 'patient' },
  { path: '/supplier', user: users.supplier, heading: /Supplier Command Center/i, name: 'supplier' },
] as const;

for (const dashboard of dashboardCases) {
  test(`${dashboard.name} dashboard is aligned across responsive widths`, async ({ page }, testInfo) => {
    await installApiMocks(page, dashboard.user);
    await page.goto(dashboard.path, { waitUntil: 'networkidle' });

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 1000 },
    ]) {
      await assertLayout(
        page,
        dashboard.heading,
        viewport,
        testInfo,
        dashboard.name,
      );
    }
  });
}
