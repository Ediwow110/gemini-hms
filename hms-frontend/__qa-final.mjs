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
  roles: ['Super Admin'],
  permissions: ['*'],
  branchId: 'main-branch',
};

async function main() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Mock ALL API calls to return valid data (empty arrays/objects)
  await context.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/me') || url.includes('/auth/login')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    }
    if (url.includes('/billing/invoices') || url.includes('/billing/sessions')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (url.includes('/pharmacy/prescriptions')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (url.includes('/pharmacy/drugs')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (url.includes('/inventory/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (url.includes('/nursing/tasks')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (url.includes('/logistics/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }
    // Default: return empty object
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });

  console.log('=== BROWSER QA START ===\n');

  const results = [];

  for (const db of DASHBOARDS) {
    console.log(`--- ${db.name} (${db.route}) ---`);
    const page = await context.newPage();
    const errors = [];
    const crashErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        errors.push(text.substring(0, 200));
        // Detect crashes
        if (text.includes('TypeError') || text.includes('is not a function') || text.includes('is not iterable')) {
          crashErrors.push(text.substring(0, 200));
        }
      }
    });
    page.on('pageerror', err => {
      crashErrors.push(err.message.substring(0, 200));
    });

    try {
      await page.goto(BASE + db.route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(6000);

      const url = page.url();
      const text = await page.textContent('body').catch(() => '') || '';
      const isLogin = url.includes('/login');
      
      // Check for synthetic labels
      const hasSyntheticLabels = text.includes('Demo Patient') || text.includes('Sample Patient') || 
                                 text.includes('Anonymous Client') || text.includes('Sample Client');

      // Check for old PHI-like names
      const hasOldPHI = text.includes('Juan Dela Cruz') || text.includes('John Doe') || 
                         text.includes('Jane Smith') || text.includes('Patient P-101') ||
                         text.includes('Private Patient');

      const svgCount = await page.evaluate(() => document.querySelectorAll('svg').length).catch(() => 0);
      const rechartsCount = await page.evaluate(() => document.querySelectorAll('.recharts-wrapper, svg.recharts-surface').length).catch(() => 0);

      const crashed = crashErrors.length > 0;
      
      console.log(`  URL: ${url.substring(0, 60)}${isLogin ? ' (LOGIN)' : ''}`);
      console.log(`  Crashed: ${crashed ? 'YES!' : 'NO'}`);
      console.log(`  SVGs: ${svgCount} | Recharts: ${rechartsCount}`);
      console.log(`  Synthetic labels: ${hasSyntheticLabels ? 'YES' : 'no'}`);
      console.log(`  Old PHI names: ${hasOldPHI ? 'FOUND!' : 'none'}`);

      if (crashed) {
        console.log(`  ❌ CRASH: ${crashErrors[0]}`);
      }

      results.push({
        name: db.name,
        route: db.route,
        url,
        isLogin,
        crashed,
        crashErrors: crashErrors.slice(0, 3),
        svgCount,
        rechartsCount,
        hasSyntheticLabels,
        hasOldPHI,
        consoleErrors: errors.slice(0, 5),
        textLength: text.length,
      });

    } catch (e) {
      console.log(`  ❌ ERROR: ${e.message.substring(0, 100)}`);
      results.push({ name: db.name, route: db.route, error: e.message.substring(0, 150) });
    } finally {
      await page.close();
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('BROWSER QA SUMMARY');
  console.log('='.repeat(70));
  console.log(`${'Name'.padEnd(18)} ${'Load'.padEnd(5)} ${'Crash'.padEnd(7)} ${'SVGs'.padEnd(5)} ${'Charts'.padEnd(7)} ${'Synthetic'.padEnd(10)} ${'PHI'.padEnd(5)}`);

  let allPass = true;
  for (const r of results) {
    const ok = !r.isLogin && !r.crashed;
    if (!ok) allPass = false;
    const icon = ok ? '✓' : '✗';
    const crashIcon = r.crashed ? '❌' : '✓';
    console.log(`${icon} ${r.name.padEnd(17)} ${(!r.isLogin?'✓':'○').padEnd(5)} ${crashIcon.padEnd(7)} ${String(r.svgCount??0).padEnd(5)} ${String((r.rechartsCount??0)>0?'✓':'○').padEnd(7)} ${String(r.hasSyntheticLabels?'✓':'○').padEnd(10)} ${String(r.hasOldPHI?'⚠':'✓').padEnd(5)}`);
  }

  console.log(`\nAll dashboards loaded without crash: ${allPass}`);

  writeFileSync('__qa-final-results.json', JSON.stringify(results, null, 2));
  await browser.close();
  console.log('\nDone. Final results: __qa-final-results.json');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
