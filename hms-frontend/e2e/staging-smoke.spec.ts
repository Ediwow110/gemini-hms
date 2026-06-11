import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.STAGING_URL || 'http://localhost:5173';

test.describe('Staging Smoke Test', () => {
  test('Frontend is accessible and loads login page', async ({ page }) => {
    if (!STAGING_URL.includes('localhost')) {
      expect(STAGING_URL.startsWith('https://')).toBe(true);
    }

    const response = await page.goto(STAGING_URL);
    expect(response?.ok()).toBeTruthy();

    await expect(page).toHaveTitle(/HMS Core/i);
    // Optionally look for a login form element or specific text to ensure it's not a blank page
    await expect(page.locator('form').or(page.locator('text=Sign In').or(page.locator('text=Login'))).first()).toBeVisible();
  });

  test('Protected API route rejects unauthorized access (HTTP 401)', async ({ request }) => {
    // Determine api base URL
    // In staging, API might be under the same domain /api/v1/patients or a different backend domain. 
    // Assuming /api/v1/patients is accessible via STAGING_URL proxy/path.
    let apiUrl = STAGING_URL;
    if (apiUrl.endsWith('/')) {
        apiUrl = apiUrl.slice(0, -1);
    }
    const apiRoute = `${apiUrl}/api/v1/patients`;
    
    const response = await request.get(apiRoute);
    
    // Validate it's rejected with a 401 (Unauthorized) status
    expect(response.status()).toBe(401);
  });
});
