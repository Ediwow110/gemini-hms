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

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Mock ALL API calls
  await context.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/me') || url.includes('/auth/login')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });

  const results = [];

  for (const db of DASHBOARDS) {
    console.log(`\n--- ${db.name} (${db.route}) ---`);
    const page = await context.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`  [CONSOLE] ${msg.text().substring(0, 150)}`);
    });

    try {
      await page.goto(BASE + db.route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(8000);

      // Detailed DOM analysis
      const domInfo = await page.evaluate(() => {
        const body = document.body;
        const text = body?.textContent || '';
        
        // Count chart-related elements
        const svgs = document.querySelectorAll('svg').length;
        const rechartsSvgs = document.querySelectorAll('.recharts-wrapper, svg.recharts-surface').length;
        const chartCards = document.querySelectorAll('[class*="Chart"], [class*="chart"], [class*="Card"]').length;
        
        // Count KPI cards
        const kpiCards = document.querySelectorAll('[class*="KPI"], [class*="Metric"], [class*="Stat"]').length;
        const metricCards = document.querySelectorAll('[class*="metric"], [class*="Metric"]').length;
        
        // Look for demo badges
        const allText = body?.innerText || '';
        const hasDemoPreviewBadge = allText.includes('Demo Preview') || allText.includes('DEMO');
        const hasSampleDataLabel = allText.includes('sample data') || allText.includes('client walkthrough');
        
        // Check error states
        const hasFailedLoad = allText.includes('Failed to load') || allText.includes('Error loading');
        const hasCannotGet = allText.includes('Cannot GET');
        
        // Count meaningful metrics
        const metrics = (allText.match(/\d{1,3}(,\d{3})*/g) || []).length;
        
        // Find chart-specific data text patterns
        const chartLabels = (allText.match(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/g) || []).length;
        
        return {
          textLength: text?.length || 0,
          svgCount: svgs,
          rechartsCount: rechartsSvgs,
          chartCardCount: chartCards,
          kpiCardCount: kpiCards,
          metricCardCount: metricCards,
          hasDemoPreviewBadge,
          hasSampleDataLabel,
          hasFailedLoad,
          hasCannotGet,
          metricNumberCount: metrics,
          chartDayLabels: chartLabels,
          allTextSample: allText?.substring(0, 3000) || '',
        };
      });

      // Take screenshot at multiple viewports
      const screenshots = {};
      for (const [label, vp] of [['1440', {width:1440,height:900}], ['1280', {width:1280,height:800}], ['768', {width:768,height:1024}]]) {
        await page.setViewportSize(vp);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `__qa-${db.name}-${label}.png`, fullPage: false });
        screenshots[label] = `__qa-${db.name}-${label}.png`;
      }
      // Reset viewport
      await page.setViewportSize({ width: 1440, height: 900 });

      console.log(`  SVGs: ${domInfo.svgCount} | Recharts: ${domInfo.rechartsCount} | Charts cards: ${domInfo.chartCardCount}`);
      console.log(`  KPIs: ${domInfo.kpiCardCount} | Demo badge: ${domInfo.hasDemoPreviewBadge} | Sample label: ${domInfo.hasSampleDataLabel}`);
      console.log(`  Failed load: ${domInfo.hasFailedLoad} | Cannot GET: ${domInfo.hasCannotGet} | Day labels: ${domInfo.chartDayLabels}`);
      console.log(`  Screenshots saved: 1440px, 1280px, 768px`);

      results.push({
        name: db.name,
        route: db.route,
        ...domInfo,
        screenshots,
      });

    } catch (e) {
      console.log(`  ERROR: ${e.message.substring(0, 120)}`);
      results.push({ name: db.name, route: db.route, error: e.message.substring(0, 200) });
    } finally {
      await page.close();
    }
  }

  // Summary table
  console.log('\n' + '='.repeat(90));
  console.log('DASHBOARD QA SUMMARY TABLE');
  console.log('='.repeat(90));
  console.log(`${'Name'.padEnd(18)} ${'Loads'.padEnd(6)} ${'SVGs'.padEnd(5)} ${'Charts'.padEnd(7)} ${'KPIs'.padEnd(5)} ${'Demo'.padEnd(6)} ${'Errors'.padEnd(7)} ${'Score'.padEnd(6)}`);
  console.log('-'.repeat(90));

  let allPass = true;
  for (const r of results) {
    const loads = r.error ? '✗' : '✓';
    const svgCount = r.svgCount ?? 0;
    const hasCharts = (r.rechartsCount ?? 0) > 0 || (r.chartDayLabels ?? 0) >= 3 || (r.chartCardCount ?? 0) > 2;
    const hasKpis = (r.kpiCardCount ?? 0) > 0 || (r.metricNumberCount ?? 0) > 5;
    const demo = r.hasDemoPreviewBadge ? '✓' : '○';
    const errs = r.hasFailedLoad || r.hasCannotGet ? '⚠' : '✓';
    
    // Visual score 0-5 based on evidence
    let score = 0;
    if (loads === '✓') score += 1;
    if (hasCharts) score += 2;
    if (hasKpis) score += 1;
    if (demo === '✓') score += 1;
    
    if (!hasCharts) allPass = false;
    
    console.log(`${r.name.padEnd(18)} ${loads.padEnd(6)} ${String(svgCount).padEnd(5)} ${String(hasCharts ? '✓' : '○').padEnd(7)} ${String(hasKpis ? '✓' : '○').padEnd(5)} ${demo.padEnd(6)} ${errs.padEnd(7)} ${String(score).padEnd(6)}`);
  }

  writeFileSync('__qa-charts-results.json', JSON.stringify(results, null, 2));
  console.log('\nDone. Detailed results: __qa-charts-results.json');
  console.log('Screenshots: __qa-{name}-{1440|1280|768}.png');
  
  await browser.close();
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
