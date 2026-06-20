import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60 * 60 * 1000,
  expect: {
    timeout: 10000
  },
  // Cap action-level waits so a stuck page/response surfaces a clear
  // timeout error within 30s instead of consuming the 60min test budget.
  // Without this, page.waitForResponse(predicate) and page.goto inherit
  // the test timeout and a single hung network call stalls the job for
  // the full GHA 25min job timeout. See: PR #229 Browser Smoke hang.
  actionTimeout: 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
