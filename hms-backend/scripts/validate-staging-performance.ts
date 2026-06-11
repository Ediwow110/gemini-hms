import 'dotenv/config';
import { Pool } from 'pg';

/**
 * Staging Performance Validation Script
 * Executes heavy clinical queries and logs execution time and query plans.
 */
async function validateStagingPerformance() {
  const connectionString = process.env.DATABASE_URL;

  // 5. Safety guard requiring 'staging' in DATABASE_URL
  if (!connectionString || !connectionString.includes('staging')) {
    console.error('CRITICAL ERROR: This script MUST only be run against a STAGING database.');
    console.error('The DATABASE_URL environment variable must contain the string "staging".');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  // 2. Define Heavy Clinical Queries
  const queries = [
    {
      name: 'Global Patient Search (Fuzzy Name + Patient Number)',
      sql: `
        SELECT p.*, e.id as last_encounter_id
        FROM patients p
        LEFT JOIN encounters e ON e.patient_id = p.id
        WHERE (p.last_name ILIKE '%Smith%' OR p.first_name ILIKE '%John%' OR p.patient_number ILIKE '%PAT-100%')
          AND p.status = 'ACTIVE'
        ORDER BY p.created_at DESC
        LIMIT 50;
      `
    },
    {
      name: 'Clinical Summary Join (Patient + Encounters + Vitals + LabResults)',
      sql: `
        SELECT 
          p.id, p.first_name, p.last_name, 
          e.id as encounter_id, e.encountered_at,
          v.id as vitals_id,
          lr.id as lab_id, lr.status as lab_status
        FROM patients p
        JOIN encounters e ON e.patient_id = p.id
        LEFT JOIN vitals v ON v.encounter_id = e.id
        LEFT JOIN lab_results lr ON lr.order_id IN (SELECT id FROM orders WHERE encounter_id = e.id)
        WHERE p.tenantId IS NOT NULL
        ORDER BY e.encountered_at DESC
        LIMIT 100;
      `
    },
    {
      name: 'Cross-Module Invoice Report (Invoice + Order + Patient + Branch)',
      sql: `
        SELECT 
          i.invoice_number, i.total_amount, i.status as invoice_status,
          o.order_number, o.created_at as order_date,
          p.patient_number, p.last_name,
          b.name as branch_name
        FROM invoices i
        JOIN orders o ON i.order_id = o.id
        JOIN patients p ON o.patient_id = p.id
        JOIN branches b ON o.branchId = b.id
        WHERE i.status = 'UNPAID'
          AND i.created_at > NOW() - INTERVAL '90 days'
        ORDER BY i.created_at DESC
        LIMIT 100;
      `
    }
  ];

  console.log('=== HMS STAGING PERFORMANCE VALIDATION ===');
  console.log(`Target Database: ${connectionString.split('@')[1] || 'Unknown Host'}\n`);

  for (const q of queries) {
    console.log(`[TESTING] ${q.name}...`);
    
    // 3. Timing block
    const start = Date.now();
    try {
      await pool.query(q.sql);
      const duration = Date.now() - start;
      console.log(`[SUCCESS] Execution Time: ${duration}ms`);

      // 4. EXPLAIN ANALYZE
      console.log('[PLAN] Fetching Query Execution Plan...');
      const explainSql = `EXPLAIN (ANALYZE, BUFFERS) ${q.sql}`;
      const plan = await pool.query(explainSql);
      plan.rows.forEach(row => console.log(`  ${row['QUERY PLAN']}`));
      console.log('\n' + '-'.repeat(50) + '\n');
    } catch (err: any) {
      console.error(`[ERROR] Failed to execute ${q.name}:`, err.message);
    }
  }

  await pool.end();
  console.log('Validation completed.');
}

validateStagingPerformance().catch((err) => {
  console.error('Fatal Script Error:', err);
  process.exit(1);
});
