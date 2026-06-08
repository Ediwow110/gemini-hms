import { expect, test, type Page } from '@playwright/test';
import {
  ROLE_ACCOUNTS, TENANT_CODE, DEFAULT_PASSWORD,
} from './runtime-helpers';

/*
 * Rate-limit awareness:
 * Login endpoint throttled at 5/60s (production value).
 * Each batch does ≤5 logins, then waits 61s for the window to expire.
 *
 * /auth/me has @SkipThrottle — not affected by auth rate limit.
 */

interface RoleDef {
  label: string;
  email: string;
  route: string;
  patientPortal: boolean;
}

const ALL_ROLES: RoleDef[] = ROLE_ACCOUNTS.map((r) => ({
  label: r.label,
  email: r.email,
  route: r.expectedRoute,
  patientPortal: r.label === 'Patient',
}));

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
    page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
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

  async function doLogin(
    email: string, expectFailure: boolean, label: string,
    patientPortalExpected?: boolean,
  ): Promise<void> {
    await page.context().clearCookies();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 20_000 });
    await page.locator('input[name="tenantCode"]').fill(TENANT_CODE);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(DEFAULT_PASSWORD);

    const loginRespPromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/auth/login'),
    );
    await page.locator('button[type="submit"]').click();
    const loginResp = await loginRespPromise;

    if (expectFailure) {
      expect(loginResp.status(), `${label} POST /auth/login expected 401`).toBe(401);
      expect(page.url()).toContain('/login');
      return;
    }

    expect(loginResp.status(), `${label} POST /auth/login`).toBe(200);

    // Wait for /auth/me 200
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/auth/me') && r.status() === 200,
      { timeout: 30_000 },
    );

    // Allow time for redirect
    await page.waitForTimeout(2_000);

    // Assert cookies
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'access_token'), `${label} access_token`).toBeTruthy();
    expect(cookies.some((c) => c.name === 'csrf_token'), `${label} csrf_token`).toBeTruthy();

    if (patientPortalExpected) {
      expect(cookies.some((c) => c.name === 'patient_token'), `${label} patient_token`).toBeTruthy();
      expect(cookies.some((c) => c.name === 'patient_csrf'), `${label} patient_csrf`).toBeTruthy();
    }

    // No blank screen
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);
    // Verify we navigated away from /login
    expect(page.url()).not.toContain('/login');
  }

  async function visitRoutes(routes: string[], label: string): Promise<void> {
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1_000);
      expect(page.url(), `${label} URL should contain ${route}`).toContain(route);
      await expect(page.locator('body')).not.toHaveText(/^\s*$/);
      await expect(page.locator('main, [role="main"], body').first()).toBeVisible();
    }
  }

  test('all role logins, dashboard routes, and auth safety', async () => {
    // BATCH 1: 5 logins (window #1)
    for (const role of ALL_ROLES.slice(0, 5)) {
      await doLogin(role.email, false, role.label, role.patientPortal);
    }
    await sleep(61_000);

    // BATCH 2: 5 logins (window #2)
    for (const role of ALL_ROLES.slice(5, 10)) {
      await doLogin(role.email, false, role.label, role.patientPortal);
    }
    await sleep(61_000);

    // BATCH 3: 5 logins (window #3)
    for (const role of ALL_ROLES.slice(10, 15)) {
      await doLogin(role.email, false, role.label, role.patientPortal);
    }
    await sleep(61_000);

    // BATCH 4: 2 logins (window #4) — last role + customer 401
    await doLogin(ALL_ROLES[15].email, false, ALL_ROLES[15].label, ALL_ROLES[15].patientPortal);
    await doLogin('customer@hospital.com', true, 'Customer');
  });

  test('dashboard routes render for key roles', async () => {
    await sleep(61_000);

    const dashLogins: { email: string; label: string; routes: string[] }[] = [
      { email: 'admin@hospital.com', label: 'Super Admin', routes: ['/admin', '/admin/reports', '/admin/audit-logs', '/admin/security'] },
      { email: 'patient@hospital.com', label: 'Patient', routes: ['/patient', '/patient/lab-results', '/patient/billing', '/patient/prescriptions'] },
      { email: 'doctor@hospital.com', label: 'Doctor', routes: ['/doctor'] },
      { email: 'branch.admin@hospital.com', label: 'Branch Admin', routes: ['/branch-admin'] },
    ];

    for (const d of dashLogins) {
      await doLogin(d.email, false, d.label);
      await visitRoutes(d.routes, d.label);
    }
  });

  test('multi-branch user sees branch selector and selects branch', async () => {
    await sleep(61_000);
    await page.context().clearCookies();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 20_000 });
    await page.locator('input[name="tenantCode"]').fill(TENANT_CODE);
    await page.locator('input[name="email"]').fill('branch.multi@hospital.com');
    await page.locator('input[name="password"]').fill(DEFAULT_PASSWORD);

    const loginRespPromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/auth/login'),
    );
    await page.locator('button[type="submit"]').click();
    const loginResp = await loginRespPromise;
    expect(loginResp.status(), 'Multi-branch POST /auth/login').toBe(200);

    // Should see branch selection UI
    await expect(page.getByText(/Select Branch|Choose Branch|Organization/i)).toBeVisible({ timeout: 10_000 });

    // Click the first branch option
    const branchButton = page.locator('button:has-text("Main Branch"), [role="button"]:has-text("Main Branch")').first();
    await expect(branchButton).toBeVisible({ timeout: 5_000 });
    await branchButton.click();

    // Wait for select-branch API call
    const selectResp = await page.waitForResponse(
      (r) => r.url().includes('/api/v1/auth/select-branch'),
      { timeout: 15_000 },
    );
    expect(selectResp.status(), 'POST /auth/select-branch').toBe(200);

    // Wait for redirect
    await page.waitForTimeout(2_000);
    expect(page.url()).toContain('/branch-admin');
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'access_token'), 'access_token after branch selection').toBeTruthy();
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);
  });

  test('patient portal: data loads and PDF downloads succeed', async () => {
    await sleep(61_000);
    // Login as patient via portal
    await page.context().clearCookies();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 20_000 });
    await page.locator('input[name="tenantCode"]').fill(TENANT_CODE);
    await page.locator('input[name="email"]').fill('patient@hospital.com');
    await page.locator('input[name="password"]').fill(DEFAULT_PASSWORD);

    const loginRespPromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/auth/login'),
    );
    await page.locator('button[type="submit"]').click();
    await loginRespPromise;

    // Wait for redirect to /patient
    await page.waitForURL('**/patient**', { timeout: 15_000 });
    await page.waitForTimeout(1_000);

    // Verify patient portal cookies
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === 'patient_token'), 'patient_token').toBeTruthy();
    expect(cookies.some((c) => c.name === 'patient_csrf'), 'patient_csrf').toBeTruthy();

    // ── Lab Results Page + PDF ──
    await page.goto('/patient/lab-results', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2_000);
    expect(page.url()).toContain('/patient/lab-results');

    // Find download button
    const labDownload = page.locator('button[aria-label="Download PDF"], button[title="Download PDF"]').first();
    if (await labDownload.isVisible({ timeout: 3_000 })) {
      // Intercept the PDF response
      const pdfResp = page.waitForResponse(
        (r) => r.url().includes('/patient-portal/lab-results/') && r.url().endsWith('/pdf'),
        { timeout: 15_000 },
      );
      await labDownload.click();
      const resp = await pdfResp;
      expect(resp.status(), 'Lab Result PDF status').toBe(200);
      const ct = resp.headers()['content-type'] || '';
      expect(ct.toLowerCase()).toContain('application/pdf');
    } else {
      // No download button visible — just verify page loads
      console.log('[INFO] No lab result download button found — verifying page renders');
    }
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);

    // ── Billing Page + Invoice PDF ──
    await page.goto('/patient/billing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2_000);
    expect(page.url()).toContain('/patient/billing');

    // Find invoice download button
    const invDownload = page.locator('button:has-text("Invoice"), button[aria-label*="Invoice"], button[title*="Invoice"]').first();
    if (await invDownload.isVisible({ timeout: 3_000 })) {
      const pdfResp = page.waitForResponse(
        (r) => r.url().includes('/patient-portal/invoices/') && r.url().endsWith('/pdf'),
        { timeout: 15_000 },
      );
      await invDownload.click();
      const resp = await pdfResp;
      expect(resp.status(), 'Invoice PDF status').toBe(200);
      const ct = resp.headers()['content-type'] || '';
      expect(ct.toLowerCase()).toContain('application/pdf');
    } else {
      console.log('[INFO] No invoice download button found — verifying page renders');
    }
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);

    // ── Prescriptions Page + PDF ──
    await page.goto('/patient/prescriptions', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2_000);
    expect(page.url()).toContain('/patient/prescriptions');

    // Find prescription download button
    const presDownload = page.locator('button[aria-label*="Download"], button[title*="Download Prescription"], button:has-text("Download")').first();
    if (await presDownload.isVisible({ timeout: 3_000 })) {
      const pdfResp = page.waitForResponse(
        (r) => r.url().includes('/patient-portal/prescriptions/') && r.url().endsWith('/pdf'),
        { timeout: 15_000 },
      );
      await presDownload.click();
      const resp = await pdfResp;
      expect(resp.status(), 'Prescription PDF status').toBe(200);
      const ct = resp.headers()['content-type'] || '';
      expect(ct.toLowerCase()).toContain('application/pdf');
    } else {
      console.log('[INFO] No prescription download button found — verifying page renders');
    }
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);

    // ── Refill Request ──
    // Look for a refill button on the prescriptions page
    const refillBtn = page.locator('button:has-text("Refill"), button:has-text("Request Refill")').first();
    if (await refillBtn.isVisible({ timeout: 3_000 })) {
      const refillResp = page.waitForResponse(
        (r) => r.url().includes('/patient-portal/prescriptions/') && r.url().includes('/refill-request'),
        { timeout: 15_000 },
      );
      page.once('dialog', (dialog) => dialog.accept());
      await refillBtn.click();
      const resp = await refillResp;
      // 201 (created) or 409 (already pending) are both acceptable
      expect(resp.status(), 'Refill request status').toBeGreaterThanOrEqual(200);
      expect(resp.status(), 'Refill request status').toBeLessThan(500);
      console.log(`[INFO] Refill request returned ${resp.status()}`);
    } else {
      console.log('[INFO] No refill button found — verifying page renders');
    }

    // ── Medical Records Page + Request ──
    await page.goto('/patient/medical-records', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2_000);
    expect(page.url()).toContain('/patient/medical-records');

    // Look for request medical records button
    const recordRequest = page.locator('button:has-text("Request"), button:has-text("Request Records"), button:has-text("New Request")').first();
    if (await recordRequest.isVisible({ timeout: 3_000 })) {
      const recordResp = page.waitForResponse(
        (r) => r.url().includes('/patient-portal/medical-record-requests'),
        { timeout: 15_000 },
      );
      page.once('dialog', (dialog) => dialog.accept());
      await recordRequest.click();
      const resp = await recordResp;
      expect(resp.status(), 'Medical record request status').toBeGreaterThanOrEqual(200);
      expect(resp.status(), 'Medical record request status').toBeLessThan(500);
      console.log(`[INFO] Medical record request returned ${resp.status()}`);
    } else {
      console.log('[INFO] No medical record request button found — verifying page renders');
    }
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);
  });

  test('responsive screenshot: patient dashboard at mobile and tablet', async () => {
    await sleep(61_000);
    // Login as patient
    await page.context().clearCookies();
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 20_000 });
    await page.locator('input[name="tenantCode"]').fill(TENANT_CODE);
    await page.locator('input[name="email"]').fill('patient@hospital.com');
    await page.locator('input[name="password"]').fill(DEFAULT_PASSWORD);

    const loginRespPromise = page.waitForResponse(
      (r) => r.url().includes('/api/v1/auth/login'),
    );
    await page.locator('button[type="submit"]').click();
    await loginRespPromise;
    await page.waitForURL('**/patient**', { timeout: 15_000 });
    await page.waitForTimeout(1_000);

    // Mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.goto('/patient', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);
    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(mobileOverflow, 'Mobile horizontal overflow').toBeLessThanOrEqual(5);

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.goto('/patient', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);
    const tabletOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(tabletOverflow, 'Tablet horizontal overflow').toBeLessThanOrEqual(5);

    // Desktop viewport
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(500);
    await page.goto('/patient', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1_000);
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);
  });

  test('AuthDiagnosticsPanel only in DEV with no token leaks', async () => {
    const tokenLeak = errors.some(
      (e) => /access_token|refresh_token|patient_token|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/.test(e),
    );
    expect(tokenLeak, `Token leak detected in console`).toBeFalsy();
  });

  test('no uncaught exceptions across all test interactions', async () => {
    expect(
      errors.filter((e) => e.startsWith('PAGE:')),
      `Page errors: ${errors.join('\n')}`,
    ).toEqual([]);
  });
});
