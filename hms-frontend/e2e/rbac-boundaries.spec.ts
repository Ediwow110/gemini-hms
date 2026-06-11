import { test, expect } from '@playwright/test';
import { loginAsRole, ROLE_ACCOUNTS } from './runtime-helpers';

const STAGING_URL = process.env.STAGING_URL;

test.describe('RBAC Boundaries Verification', () => {
  test.beforeEach(async ({ page }) => {
    if (!STAGING_URL) {
      test.skip(true, 'STAGING_URL not provided');
    }
  });

  test('Pharmacist Isolation: Access prescriptions but denied HR/Payroll', async ({ page }) => {
    const pharmacist = ROLE_ACCOUNTS.find(a => a.label === 'Pharmacist')!;
    await loginAsRole(page, pharmacist);

    // Verify access to prescriptions
    const prescriptionsResponse = await page.request.get(`${STAGING_URL}/api/v1/prescriptions`);
    expect(prescriptionsResponse.status()).toBe(200);

    // Verify denial of HR employees
    const hrResponse = await page.request.get(`${STAGING_URL}/api/v1/hr/employees`);
    expect(hrResponse.status()).toBe(403);
  });

  test('Receptionist Isolation: Manage patient registration but denied clinical specialized data', async ({ page }) => {
    const receptionist = ROLE_ACCOUNTS.find(a => a.label === 'Receptionist')!;
    await loginAsRole(page, receptionist);

    // Verify access to queue/registration
    const queueResponse = await page.request.get(`${STAGING_URL}/api/v1/queue`);
    expect(queueResponse.status()).toBe(200);

    // Verify denial of clinical notes (probed via cpt-codes as a proxy for restricted clinical access)
    const clinicalResponse = await page.request.get(`${STAGING_URL}/api/v1/clinical/cpt-codes`);
    expect(clinicalResponse.status()).toBe(403);
  });

  test('Multi-Tenant Isolation: Cannot access data from another tenant', async ({ page }) => {
    const admin = ROLE_ACCOUNTS.find(a => a.label === 'Super Admin')!;
    await loginAsRole(page, admin);

    // Attempt to access a resource belonging to Tenant Beta (ID from seed: 00000000-0000-0000-0000-00000000000b)
    const crossTenantResponse = await page.request.get(`${STAGING_URL}/api/v1/admin/tenants/00000000-0000-0000-0000-00000000000b`);
    expect([403, 404]).toContain(crossTenantResponse.status());
  });
});
