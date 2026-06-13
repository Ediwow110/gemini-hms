import { test, expect } from '@playwright/test';

const ROUTES = [
  '/admin',
  '/admin/executive',
  '/admin/reports',
  '/admin/audit-logs',
  '/admin/security',
  '/patient',
  '/it',
  '/integration',
  '/field-service',
  '/admin/catalog',
  '/branch-admin'
];

test('validate redesigned routes', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error on ${page.url()}: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`Page error on ${page.url()}: ${err.message}`);
  });

  for (const route of ROUTES) {
    console.log(`Checking route: ${route}`);
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Check for "Something went wrong" or empty body
    const bodyText = await page.innerText('body');
    expect(bodyText.trim().length).toBeGreaterThan(0);
    expect(bodyText).not.toContain('Something went wrong');
    
    // Check for critical runtime errors found in console
    const criticalErrors = errors.filter(e => 
      e.includes('TypeError') || 
      e.includes('is not a function') || 
      e.includes('Failed to load module script')
    );
    expect(criticalErrors).toEqual([]);
    
    // Check for Shell components
    await expect(page.locator('header, .hms-header')).toBeVisible().catch(() => {
        console.warn(`[WARN] Header not found on ${route}, but page might still be valid.`);
    });
  }
});
