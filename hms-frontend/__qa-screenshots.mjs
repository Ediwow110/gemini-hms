import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://127.0.0.1:5173';
const DASHBOARDS = [
  { name: 'billing', route: '/billing/dashboard' },
  { name: 'pharmacy', route: '/pharmacy' },
  { name: 'admin-executive', route: '/admin/executive' },
  { name: 'field-service', route: '/field-service' },
  { name: 'clinical-ops', route: '/clinical/ops' },
];

const MOCK_USER = {
  id: 'ce8cbfaa-ccd3-4406-8bf9-9ed38fb246f5',
  email: 'admin@hospital.com',
  tenantId: '00000000-0000-0000-0000-000000000001',
  tenantCode: 'default',
  roles: ['Super Admin'],
  permissions: ['*'],
  status: 'ACTIVE',
  branchId: 'main-branch',
  name: 'Admin User',
};

async function main() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Intercept ALL API calls to return either mock data or 2xx success
  await context.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    
    // Auth endpoint - return valid user
    if (url.includes('/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      });
    }
    if (url.includes('/auth/login')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock-token', user: MOCK_USER }),
      });
    }
    
    // Billing endpoints - return empty/success data to not trigger 401
    if (url.includes('/billing/invoices')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    if (url.includes('/billing/sessions/active')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ payments: [] }),
      });
    }
    
    // Pharmacy endpoints
    if (url.includes('/pharmacy/prescriptions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    if (url.includes('/pharmacy/drugs')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    
    // Inventory
    if (url.includes('/inventory/alerts/low-stock')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    if (url.includes('/inventory/catalog')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    
    // Nursing tasks
    if (url.includes('/nursing/tasks')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    
    // Clinical workflow
    if (url.includes('/clinical-workflow/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }
    
    // Logistics
    if (url.includes('/logistics/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    
    // Dashboard admin endpoints
    if (url.includes('/dashboard/admin/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }
    
    // For unhandled API endpoints, return empty but success
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  const results = [];

  for (const db of DASHBOARDS) {
    console.log(`\n--- Testing ${db.name} (${db.route}) ---`);
    const page = await context.newPage();
    const errors = [];
    const networkFailures = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`[CONSOLE] ${msg.text().substring(0, 200)}`);
      }
    });
    page.on('pageerror', err => {
      errors.push(`[PAGE] ${err.message.substring(0, 200)}`);
    });
    page.on('response', response => {
      if (!response.ok()) {
        networkFailures.push(`${response.status()} ${response.url().substring(0, 120)}`);
      }
    });

    try {
      await page.goto(BASE + db.route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(8000); // Wait for React rendering + data fetching

      // Take screenshot
      await page.screenshot({ path: `__qa-screenshot-${db.name}.png`, fullPage: false });
      
      // Get page content
      const text = await page.textContent('body').catch(() => '');
      const currentUrl = page.url();
      
      const demoLabels = (text.match(/[Dd]emo[^.]{0,120}\./g) || []).map(s => s.trim());
      const chartRefs = text.match(/VolumeArea|StatusDonut|ComparisonBar|TrendLineChart|[A-Z][a-z]+ [Cc]hart/g) || [];
      const kpiTexts = (text.match(/[A-Z][a-zA-Z\s]{2,30}:?\s*[\d,]+\.?\d*/g) || [])
        .filter(s => !s.includes('Demo') && !s.includes('Account') && !s.includes('Only') && !s.includes('Secure'))
        .slice(0, 20);
      const rawErrors = text.match(/[Ff]ailed to (load|fetch)|[Ee]rror [Ll]oading|Cannot GET/g) || [];
      const kpiMetrics = text.match(/Today['\u2019s]*\s*[A-Za-z]+|Pending|Overdue|Active|Completed|Open|Low Stock|Collection|Revenue|Prescriptions|Triage|Encounter|Outstanding|Invoice|Queue|Stockout|Breach|Handover|Volume|Patients|Labs|Stock|Security|Tasks/g) || [];

      // Detect if page is dashboard or login
      const isLoginPage = currentUrl.includes('/login') || text.includes('Authorized Personnel Only');
      const hasDemoBadge = demoLabels.length > 0;
      const hasKpiStrip = kpiMetrics.length >= 3;
      const hasCharts = chartRefs.length > 0;

      results.push({
        name: db.name,
        route: db.route,
        finalUrl: currentUrl,
        isLoginPage,
        textLength: text.length,
        hasKpiStrip,
        hasCharts,
        hasDemoBadge,
        chartTypes: [...new Set(chartRefs)].slice(0, 10),
        kpiMetricsFound: [...new Set(kpiMetrics)].slice(0, 25),
        kpiTextSample: kpiTexts.slice(0, 15),
        demoLabels,
        rawErrorTexts: rawErrors,
        consoleErrors: errors.slice(0, 5),
        networkFailures: networkFailures.slice(0, 5),
        textPreview: text.substring(0, 500).replace(/\s+/g, ' ').trim(),
      });

      console.log(`  URL: ${currentUrl.substring(0, 60)}${isLoginPage ? ' (LOGIN)' : ''}`);
      console.log(`  KPI: ${hasKpiStrip} | Charts: ${hasCharts} | Demo badge: ${hasDemoBadge}`);
      if (chartRefs.length > 0) console.log(`  Charts: ${[...new Set(chartRefs)].join(', ')}`);
      if (kpiMetrics.length > 0) console.log(`  KPIs: ${[...new Set(kpiMetrics)].slice(0, 10).join(', ')}`);
      if (rawErrors.length > 0) console.log(`  ⚠ RAW ERRORS: ${rawErrors.join(', ')}`);
      if (errors.length > 0) console.log(`  ⚠ Console errors: ${errors.length}`);

    } catch (e) {
      console.log(`  ✗ ERROR: ${e.message.substring(0, 100)}`);
      results.push({
        name: db.name,
        route: db.route,
        status: 'error',
        error: e.message.substring(0, 150),
      });
    } finally {
      await page.close();
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('QA RESULTS SUMMARY');
  console.log('='.repeat(70));

  let allOnDashboard = true;
  for (const r of results) {
    const ok = !r.isLoginPage;
    if (!ok) allOnDashboard = false;
    const icon = ok ? '✓' : '○';
    const details = ok 
      ? `KPI:${r.hasKpiStrip} Charts:${r.hasCharts} Demo:${r.hasDemoBadge}`
      : 'LOGIN PAGE';
    console.log(`${icon} ${r.name.padEnd(20)} ${details}`);
  }
  
  console.log(`\nAll on dashboard pages: ${allOnDashboard}`);

  writeFileSync('__qa-results.json', JSON.stringify(results, null, 2));

  await browser.close();
  console.log('\nDone. Screenshots and results saved to __qa-*.json/png');
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
