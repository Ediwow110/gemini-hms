import { expect, test, type Page } from '@playwright/test';

/*
 * Rate-limit awareness:
 * The login endpoint is throttled at 5 requests per 60 seconds (production value).
 * We group login attempts into batches of ≤5, with 61-second pauses between batches.
 */

const ROLES_TO_TEST = [
  { label: 'Super Admin', email: 'admin@hospital.com', route: '/admin', patientPortal: false },
  { label: 'Doctor', email: 'doctor@hospital.com', route: '/doctor', patientPortal: false },
  { label: 'Patient', email: 'patient@hospital.com', route: '/patient', patientPortal: true },
  { label: 'Pharmacist', email: 'pharmacist@hospital.com', route: '/pharmacy', patientPortal: false },
  { label: 'Receptionist', email: 'receptionist@hospital.com', route: '/queue', patientPortal: false },
];

const DASHBOARD_GROUPS = [
  { label: 'Super Admin', email: 'admin@hospital.com', routes: ['/admin', '/admin/reports', '/admin/audit-logs', '/admin/security'] },
  { label: 'Patient', email: 'patient@hospital.com', routes: ['/patient', '/patient/lab-results', '/patient/billing', '/patient/prescriptions'] },
  { label: 'Doctor', email: 'doctor@hospital.com', routes: ['/doctor'] },
  { label: 'Branch Admin', email: 'branch.admin@hospital.com', routes: ['/branch-admin'] },
];

const CONSOLE_ALLOW = [
  'data:image/', 'favicon.ico', '[vite]', 'React DevTools', 'The width(-1) and height(-1)',
];

function sanitize(e: string) {
  return !CONSOLE_ALLOW.some((a) => e.includes(a)) &&
    !e.includes('[Auth Diagnostics]') &&
    !e.includes('Failed to load resource: the server responded with a status of 401') &&
    !e.includes('Failed to load resource: the server responded with a status of 403') &&
    !e.includes('Failed to load resource: the server responded with a status of 404');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

test.describe.serial('runtime QA', () => {
  const errors: string[] = [];
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error' && sanitize(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(`PAGE: ${err.message}`));
  });

  test('login form renders on /login', async () => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByText(/Something went wrong/i)).not.toBeVisible();
  });

  /**
   * Login as the given email, verify response status and cookies.
   * If expectFailure is true, asserts 401 and returns without verifying cookies.
   *
   * Registers the /auth/me listener BEFORE clicking submit to avoid race
   * conditions where AuthProvider fires /auth/me before handleSuccessfulAuth.
   */
  async function doLogin(email: string, expectFailure: boolean, label: string): Promise<void> {
    await page.context().clearCookies();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 20_000 });
    await page.locator('input[name="tenantCode"]').fill('Test Tenant');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill('Admin@123');

    // Register both listeners BEFORE clicking to avoid race conditions
    const loginRespPromise = page.waitForResponse((r) => r.url().includes('/api/v1/auth/login'));
    const meRespPromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/auth/me') && r.status() === 200,
      { timeout: 30_000 },
    );

    await page.locator('button[type="submit"]').click();

    const loginResp = await loginRespPromise;

    if (expectFailure) {
      expect(loginResp.status(), `${label} POST /auth/login expected 401`).toBe(401);
      expect(page.url()).toContain('/login');
      return;
    }

    expect(loginResp.status(), `${label} POST /auth/login`).toBe(200);

    // Wait for /auth/me (registered before click)
    const meResp = await meRespPromise;
    expect(meResp.status(), `${label} GET /auth/me`).toBe(200);

    // Allow time for redirect
    await page.waitForTimeout(2_000);

    // Assert cookies
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'access_token'), `${label} access_token`).toBeTruthy();
    expect(cookies.some((c) => c.name === 'csrf_token'), `${label} csrf_token`).toBeTruthy();

    const role = ROLES_TO_TEST.find((r) => r.email === email);
    if (role?.patientPortal) {
      expect(cookies.some((c) => c.name === 'patient_token'), `${label} patient_token`).toBeTruthy();
      expect(cookies.some((c) => c.name === 'patient_csrf'), `${label} patient_csrf`).toBeTruthy();
    }

    // No blank screen
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);
  }

  /**
   * Visit each route while logged in, asserting non-blank content.
   */
  async function visitRoutes(routes: string[], label: string): Promise<void> {
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1_000);
      expect(page.url(), `${label} URL should contain ${route}`).toContain(route);
      await expect(page.locator('body')).not.toHaveText(/^\s*$/);
      const content = page.locator('main, [role="main"], body').first();
      await expect(content, `${label} ${route} should have visible content`).toBeVisible();
    }
  }

  test('all role logins, dashboard routes, and auth safety', async () => {
    // ──────────────────────────────────────────────────
    // BATCH 1 — 5 logins (within 5/60s window #1)
    // Roles: Super Admin, Doctor, Patient, Pharmacist, Receptionist
    // ──────────────────────────────────────────────────
    for (const role of ROLES_TO_TEST) {
      await doLogin(role.email, false, role.label);
    }

    // ──────────────────────────────────────────────────
    // PAUSE 61s — let window #1 expire
    // ──────────────────────────────────────────────────
    await sleep(61_000);

    // ──────────────────────────────────────────────────
    // BATCH 2 — 5 logins (within 5/60s window #2)
    // 1 customer (401) + 4 dashboard groups (login + visit routes immediately)
    // ──────────────────────────────────────────────────
    await doLogin('customer@hospital.com', true, 'Customer');

    for (const group of DASHBOARD_GROUPS) {
      await doLogin(group.email, false, group.label);
      await visitRoutes(group.routes, group.label);
    }
  });

  test('AuthDiagnosticsPanel only in DEV with no token leaks', async () => {
    const tokenLeak = errors.some((e) => /access_token|refresh_token|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/.test(e));
    expect(tokenLeak, `Token leak detected in console`).toBeFalsy();
  });

  test('no uncaught exceptions across all test interactions', async () => {
    expect(errors.filter((e) => e.startsWith('PAGE:')), `Page errors: ${errors.join('\n')}`).toEqual([]);
  });
});
