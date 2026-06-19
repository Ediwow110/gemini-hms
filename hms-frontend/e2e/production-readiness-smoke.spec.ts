import { test, expect } from '@playwright/test';
import {
  TENANT_CODE,
  DEFAULT_PASSWORD,
  attachRuntimeTelemetry,
  assertNoRuntimeCrashes,
  assertPageNotBlank,
} from './runtime-helpers';

const SMOKE_ROUTES = [
  {
    path: '/radiology',
    marker: /Radiology Imaging Canvas/i,
    truthCheck: /study binaries are not uploaded or stored/i,
  },
  {
    path: '/integration',
    marker: /Integration Bridges Command Center/i,
    truthCheck: /3 of 7.*live endpoints/i,
  },
  {
    path: '/emr',
    marker: /EMR & Clinical Records Workspace/i,
    truthCheck: null,
  },
  {
    path: '/admin/users',
    marker: /User Directory & Scopes/i,
    truthCheck: null,
  },
] as const;

test.describe('production readiness smoke', () => {
  test('login shell reaches live critical routes without crash', async ({ page }) => {
    const telemetry = attachRuntimeTelemetry(page);

    await page.goto('/login');
    await expect(page.locator('input[name="tenantCode"]')).toBeVisible({ timeout: 15_000 });
    await page.locator('input[name="tenantCode"]').fill(TENANT_CODE);
    await page.locator('input[name="email"]').fill('admin@hospital.com');
    await page.locator('input[name="password"]').fill(DEFAULT_PASSWORD);

    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/auth/login') && resp.status() === 200,
      ),
      page.locator('button[type="submit"]').click(),
    ]);
    expect(loginResponse.ok()).toBeTruthy();

    await page.waitForURL('**/admin', { timeout: 20_000 });
    await assertPageNotBlank(page);

    for (const route of SMOKE_ROUTES) {
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      await assertPageNotBlank(page);
      await expect(page.getByText(route.marker).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(/Something went wrong/i)).not.toBeVisible();
      if (route.truthCheck) {
        await expect(page.getByText(route.truthCheck).first()).toBeVisible({
          timeout: 10_000,
        });
      }
    }

    await assertNoRuntimeCrashes(telemetry);
  });
});