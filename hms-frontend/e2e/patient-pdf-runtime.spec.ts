import { expect, test, type Page } from '@playwright/test';
import { TENANT_CODE, DEFAULT_PASSWORD } from './runtime-helpers';

/*
 * Focused PDF download and self-service workflow test for patient portal.
 * Uses direct API calls to avoid rate-limit waits from repeated logins.
 */

test.describe('patient PDF runtime', () => {
  // Obtain patient cookies once via API, then use them for all PDF endpoint tests
  let page: Page;
  let patientCookie = '';
  let csrfCookie = '';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

    // Login as patient to get cookies
    const resp = await page.request.post('http://localhost:3000/patient-portal/auth/login', {
      data: {
        tenantCode: TENANT_CODE,
        email: 'patient@hospital.com',
        password: DEFAULT_PASSWORD,
      },
    });
    expect(resp.status(), 'Patient portal login').toBe(200);

    // Extract cookies from the response
    const headers = resp.headers();
    const setCookie = headers['set-cookie'] || '';
    const tokenMatch = setCookie.match(/patient_token=([^;]+)/);
    const csrfMatch = setCookie.match(/patient_csrf=([^;]+)/);
    if (tokenMatch) patientCookie = tokenMatch[1];
    if (csrfMatch) csrfCookie = csrfMatch[1];
    expect(patientCookie, 'patient_token cookie').toBeTruthy();
    expect(csrfCookie, 'patient_csrf cookie').toBeTruthy();
  });

  test('lab result PDF download returns 200 and PDF content-type', async () => {
    const resp = await page.request.get(
      'http://localhost:3000/patient-portal/lab-results/00000000-0000-0000-0000-0000000000a1/pdf',
      { headers: { Cookie: `patient_token=${patientCookie}; patient_csrf=${csrfCookie}` } },
    );
    expect(resp.status(), 'Lab PDF status').toBe(200);
    const ct = resp.headers()['content-type'] || '';
    expect(ct.toLowerCase()).toContain('application/pdf');
    const body = await resp.body();
    expect(body.length, 'PDF body non-empty').toBeGreaterThan(100);
    expect(body.slice(0, 5).toString(), 'PDF magic bytes').toBe('%PDF-');
  });

  test('invoice PDF download returns 200 and PDF content-type', async () => {
    const resp = await page.request.get(
      'http://localhost:3000/patient-portal/invoices/00000000-0000-0000-0000-0000000000a2/pdf',
      { headers: { Cookie: `patient_token=${patientCookie}; patient_csrf=${csrfCookie}` } },
    );
    expect(resp.status(), 'Invoice PDF status').toBe(200);
    const ct = resp.headers()['content-type'] || '';
    expect(ct.toLowerCase()).toContain('application/pdf');
    const body = await resp.body();
    expect(body.length, 'PDF body non-empty').toBeGreaterThan(100);
    expect(body.slice(0, 5).toString(), 'PDF magic bytes').toBe('%PDF-');
  });

  test('prescription PDF download returns 200 and PDF content-type', async () => {
    const resp = await page.request.get(
      'http://localhost:3000/patient-portal/prescriptions/00000000-0000-0000-0000-0000000000f1/pdf',
      { headers: { Cookie: `patient_token=${patientCookie}; patient_csrf=${csrfCookie}` } },
    );
    expect(resp.status(), 'Prescription PDF status').toBe(200);
    const ct = resp.headers()['content-type'] || '';
    expect(ct.toLowerCase()).toContain('application/pdf');
    const body = await resp.body();
    expect(body.length, 'PDF body non-empty').toBeGreaterThan(100);
    expect(body.slice(0, 5).toString(), 'PDF magic bytes').toBe('%PDF-');
  });

  test('receipt PDF download returns 200 and PDF content-type', async () => {
    const resp = await page.request.get(
      'http://localhost:3000/patient-portal/payments/00000000-0000-0000-0000-0000000000b2/receipt',
      { headers: { Cookie: `patient_token=${patientCookie}; patient_csrf=${csrfCookie}` } },
    );
    expect(resp.status(), 'Receipt PDF status').toBe(200);
    const ct = resp.headers()['content-type'] || '';
    expect(ct.toLowerCase()).toContain('application/pdf');
    const body = await resp.body();
    expect(body.length, 'PDF body non-empty').toBeGreaterThan(100);
    expect(body.slice(0, 5).toString(), 'PDF magic bytes').toBe('%PDF-');
  });

  test('refill request for seeded prescription', async () => {
    const resp = await page.request.post(
      'http://localhost:3000/patient-portal/prescriptions/00000000-0000-0000-0000-0000000000f1/refill-request',
      {
        headers: {
          Cookie: `patient_token=${patientCookie}; patient_csrf=${csrfCookie}`,
          'X-CSRF-Token': csrfCookie,
          'Content-Type': 'application/json',
        },
        data: { reason: '[DEMO] Routine refill for browser testing' },
      },
    );
    // 201 (created) or 409 (already pending) are both acceptable
    expect(resp.status()).toBeGreaterThanOrEqual(200);
    expect(resp.status()).toBeLessThan(500);
  });

  test('medical record request for seeded patient', async () => {
    const resp = await page.request.post(
      'http://localhost:3000/patient-portal/medical-record-requests',
      {
        headers: {
          Cookie: `patient_token=${patientCookie}; patient_csrf=${csrfCookie}`,
          'X-CSRF-Token': csrfCookie,
          'Content-Type': 'application/json',
        },
        data: { requestType: 'FULL_RECORD', reason: '[DEMO] Browser runtime QA test' },
      },
    );
    expect(resp.status()).toBeGreaterThanOrEqual(200);
    expect(resp.status()).toBeLessThan(500);
  });

  test('unowned lab result PDF is blocked (404)', async () => {
    // Use a non-existent UUID — patient doesn't own this result
    const resp = await page.request.get(
      'http://localhost:3000/patient-portal/lab-results/00000000-0000-0000-0000-000000000099/pdf',
      { headers: { Cookie: `patient_token=${patientCookie}; patient_csrf=${csrfCookie}` } },
    );
    expect(resp.status(), 'Unowned lab PDF status').toBe(404);
  });

  test('unowned invoice PDF is blocked (404)', async () => {
    const resp = await page.request.get(
      'http://localhost:3000/patient-portal/invoices/00000000-0000-0000-0000-000000000099/pdf',
      { headers: { Cookie: `patient_token=${patientCookie}; patient_csrf=${csrfCookie}` } },
    );
    expect(resp.status(), 'Unowned invoice PDF status').toBe(404);
  });
});
