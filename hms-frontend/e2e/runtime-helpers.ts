import { expect, type Page, type APIResponse, type BrowserContext } from '@playwright/test';

export const FRONTEND_URL = 'http://localhost:5173';
export const BACKEND_URL = 'http://localhost:3000';
export const TENANT_CODE = 'Central Hospital (Main Branch)';
export const DEFAULT_PASSWORD = 'Admin@123';

export interface RoleAccount {
  label: string;
  email: string;
  roles: string[];
  expectedRoute: string;
  mfaExpected: boolean;
  branchSelectionExpected: 'global-bypass' | 'single-branch-bypass' | 'multi-branch-required' | 'not-applicable';
}

export const ROLE_ACCOUNTS: RoleAccount[] = [
  { label: 'Super Admin', email: 'admin@hospital.com', roles: ['Super Admin'], expectedRoute: '/admin', mfaExpected: false, branchSelectionExpected: 'global-bypass' },
  { label: 'Branch Admin', email: 'branch.admin@hospital.com', roles: ['Branch Admin'], expectedRoute: '/branch-admin', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
  { label: 'Marketplace Admin', email: 'marketplace.admin@hospital.com', roles: ['Marketplace Admin'], expectedRoute: '/marketplace-admin', mfaExpected: false, branchSelectionExpected: 'global-bypass' },
  { label: 'Compliance Officer', email: 'compliance@hospital.com', roles: ['Compliance Officer'], expectedRoute: '/compliance', mfaExpected: false, branchSelectionExpected: 'global-bypass' },
  { label: 'IT Support', email: 'it.support@hospital.com', roles: ['IT Support'], expectedRoute: '/it', mfaExpected: false, branchSelectionExpected: 'global-bypass' },
  { label: 'HR Manager', email: 'hr.manager@hospital.com', roles: ['HR Manager'], expectedRoute: '/hr', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
  { label: 'Procurement Officer', email: 'procurement@hospital.com', roles: ['Procurement Officer'], expectedRoute: '/procurement', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
  { label: 'Doctor', email: 'doctor@hospital.com', roles: ['Doctor'], expectedRoute: '/doctor', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
  { label: 'Nurse', email: 'nurse@hospital.com', roles: ['Nurse'], expectedRoute: '/nurse', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
  { label: 'Med-Tech', email: 'medtech@hospital.com', roles: ['Med-Tech'], expectedRoute: '/lab', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
  { label: 'Cashier', email: 'cashier@hospital.com', roles: ['Cashier'], expectedRoute: '/cashier', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
  { label: 'Pharmacist', email: 'pharmacist@hospital.com', roles: ['Pharmacist'], expectedRoute: '/pharmacy', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
  { label: 'Supplier', email: 'supplier@hospital.com', roles: ['Supplier'], expectedRoute: '/supplier', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
  { label: 'Patient', email: 'patient@hospital.com', roles: ['Patient'], expectedRoute: '/patient', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
  { label: 'Field Technician', email: 'field.tech@hospital.com', roles: ['Field Technician'], expectedRoute: '/field-service', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
  { label: 'Receptionist', email: 'receptionist@hospital.com', roles: ['Receptionist'], expectedRoute: '/queue', mfaExpected: false, branchSelectionExpected: 'single-branch-bypass' },
];

const sensitiveTokenPattern = /(access_token|refresh_token|csrf_token|patient_token|patient_csrf)\s*[=:]\s*[^;\s]+|Bearer\s+eyJ|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/i;

export interface RuntimeTelemetry {
  consoleErrors: string[];
  pageErrors: string[];
  tokenLeaks: string[];
}

export function attachRuntimeTelemetry(page: Page): RuntimeTelemetry {
  const telemetry: RuntimeTelemetry = { consoleErrors: [], pageErrors: [], tokenLeaks: [] };
  page.on('console', (msg) => {
    const text = msg.text();
    if (sensitiveTokenPattern.test(text)) {
      telemetry.tokenLeaks.push(text);
    }
    if (msg.type() === 'error') {
      telemetry.consoleErrors.push(text);
    }
  });
  page.on('pageerror', (error) => {
    telemetry.pageErrors.push(error.message);
  });
  return telemetry;
}

export async function assertNoRuntimeCrashes(telemetry: RuntimeTelemetry): Promise<void> {
  expect(telemetry.pageErrors, `Uncaught browser exceptions: ${telemetry.pageErrors.join('\n')}`).toEqual([]);
  expect(telemetry.tokenLeaks, `Sensitive token-like values logged to console: ${telemetry.tokenLeaks.join('\n')}`).toEqual([]);
  const criticalConsoleErrors = telemetry.consoleErrors.filter((message) => {
    if (message.includes('[Auth Diagnostics]') && message.includes('status: 401')) return false;
    if (message.includes('Failed to load resource: the server responded with a status of 401')) return false;
    return true;
  });
  expect(criticalConsoleErrors, `Critical console errors: ${criticalConsoleErrors.join('\n')}`).toEqual([]);
}

async function sleepForThrottleWindowIfNeeded(attempt: number): Promise<void> {
  if (attempt > 0) {
    await new Promise((resolve) => setTimeout(resolve, 61_000));
  }
}

export async function loginAsRole(page: Page, account: RoleAccount, loginIndex = 0): Promise<{ loginResponse: APIResponse; meResponses: APIResponse[]; redirects: string[] }> {
  await sleepForThrottleWindowIfNeeded(loginIndex);
  await page.context().clearCookies();
  const redirects: string[] = [];
  const meResponses: APIResponse[] = [];
  let countMe = false;

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      redirects.push(frame.url());
    }
  });
  page.on('response', (response) => {
    if (countMe && response.url().includes('/api/v1/auth/me')) {
      meResponses.push(response);
    }
  });

  let loginResponse: APIResponse | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto('/login');
    await expect(page.locator('input[name="tenantCode"]')).toBeVisible({ timeout: 15_000 });
    await page.locator('input[name="tenantCode"]').fill(TENANT_CODE);
    await page.locator('input[name="email"]').fill(account.email);
    await page.locator('input[name="password"]').fill(DEFAULT_PASSWORD);
    redirects.splice(0, redirects.length);
    countMe = true;
    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/v1/auth/login')),
      page.locator('button[type="submit"]').click(),
    ]);
    if (response.status() === 429 && attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 61_000));
      continue;
    }
    loginResponse = response;
    break;
  }

  if (!loginResponse) {
    throw new Error(`No login response captured for ${account.label}`);
  }

  expect([200, 202], `${account.label} login status`).toContain(loginResponse.status());
  if (loginResponse.status() === 202 || account.mfaExpected) {
    await expect(page.getByText(/Security Verification|Multi-factor/i)).toBeVisible();
    return { loginResponse, meResponses, redirects };
  }

  try {
    await page.waitForResponse((resp) => resp.url().includes('/api/v1/auth/me') && resp.status() === 200, { timeout: 20_000 });
  } catch (error) {
    if (meResponses.some((resp) => resp.status() === 429)) {
      await new Promise((resolve) => setTimeout(resolve, 61_000));
      redirects.splice(0, redirects.length);
      await page.reload();
      await page.waitForResponse((resp) => resp.url().includes('/api/v1/auth/me') && resp.status() === 200, { timeout: 20_000 });
    } else {
      throw error;
    }
  }
  await page.waitForURL(`**${account.expectedRoute}`, { timeout: 20_000 });
  await page.waitForTimeout(1_000);
  expect(new URL(page.url()).pathname, `${account.label} final URL should remain stable`).toBe(account.expectedRoute);
  expect(meResponses.filter((resp) => resp.status() === 200).length, `${account.label} /auth/me success count`).toBeGreaterThanOrEqual(1);
  expect(meResponses.length, `${account.label} repeated /auth/me loop`).toBeLessThanOrEqual(3);
  expect(redirects.length, `${account.label} redirect count`).toBeLessThanOrEqual(3);

  const cookies = await page.context().cookies(BACKEND_URL);
  expect(cookies.some((cookie) => cookie.name === 'access_token'), `${account.label} access_token cookie`).toBeTruthy();
  expect(cookies.some((cookie) => cookie.name === 'csrf_token'), `${account.label} csrf_token cookie`).toBeTruthy();

  if (account.label === 'Patient') {
    const patientCookies = await page.context().cookies();
    expect(patientCookies.some((cookie) => cookie.name === 'patient_token'), 'Patient portal patient_token cookie').toBeTruthy();
    expect(patientCookies.some((cookie) => cookie.name === 'patient_csrf'), 'Patient portal CSRF cookie').toBeTruthy();
  }

  await assertPageNotBlank(page);
  return { loginResponse, meResponses, redirects };
}

export async function assertPageNotBlank(page: Page): Promise<void> {
  await expect(page.locator('body')).not.toHaveText(/^\s*$/);
  await expect(page.locator('main, [role="main"], body').first()).toBeVisible();
  await expect(page.getByText(/Something went wrong/i)).not.toBeVisible();
}

export async function assertDashboardPage(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(700);
  await assertPageNotBlank(page);
  const safeSurface = page.locator('h1, h2, main, [role="main"], table, [role="table"], text=/No .*found|empty|Coming soon|Work in Progress/i').first();
  await expect(safeSurface, `Visible content for ${route}`).toBeVisible({ timeout: 10_000 });
}

export async function assertNoBodyHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `Unexpected horizontal overflow at ${page.url()}`).toBeLessThanOrEqual(8);
}

export async function logoutViaCookies(context: BrowserContext): Promise<void> {
  await context.clearCookies();
}
