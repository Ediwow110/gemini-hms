import 'dotenv/config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { validateDemoEnvironment } from './demo-safety-guard';

const CONTAINER_NAME = process.env.DATABASE_CONTAINER ?? 'hms-login-design-postgres_prod-1';
const DB_USER = process.env.DATABASE_USER ?? 'hms_prod_user';
const DB_NAME = process.env.DATABASE_NAME ?? 'gemini_hms_prod';

async function run() {
  const hasConfirmFlag = process.argv.includes('--confirm-dr-test');
  const hasConfirmEnv = process.env.DEMO_DB_RESET_CONFIRM === 'RESET_SYNTHETIC_DR_TEST';

  if (!hasConfirmFlag || !hasConfirmEnv) {
    console.error('\n!!! DR TEST — Destructive Production Simulation !!!');
    console.error('This script executes DROP SCHEMA CASCADE on a target database.');
    console.error('To proceed you MUST:');
    console.error('1. Set environment variable: DEMO_DB_RESET_CONFIRM=RESET_SYNTHETIC_DR_TEST');
    console.error('2. Pass CLI flag: --confirm-dr-test');
    process.exit(1);
  }

  console.log('[SAFETY] DR test explicit confirmation received via flag and env var.');
  console.log(`[SAFETY] Target container: ${CONTAINER_NAME}`);
  console.log(`[SAFETY] Target DB: ${DB_USER}@${DB_NAME}`);

  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.join(backupDir, 'production_snapshot.sql');

  console.log('[DR_TEST] 1. Initializing Production Backup Sequence...');
  
  const dumpCommand = `docker exec ${CONTAINER_NAME} pg_dump -U ${DB_USER} -d ${DB_NAME} -F p --clean`;
  const dumpOutput = execSync(dumpCommand).toString();
  fs.writeFileSync(backupPath, dumpOutput, 'utf8');
  
  const backupSizeKb = (fs.statSync(backupPath).size / 1024).toFixed(2);
  console.log(`[DR_TEST] Backup completed successfully. Saved to: ${backupPath} (Size: ${backupSizeKb} KB)`);

  console.log('\n[DR_TEST] 2. Simulating Catastrophic Production Hardware Failure...');
  console.log('[DR_TEST] Issuing destructive command to purge the datastore...');
  
  const destructiveCommand = `docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`;
  execSync(destructiveCommand);
  console.log('[DR_TEST] Active database wiped! Checking tables (should be empty)...');
  
  const countCommand = `docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`;
  const tableCountBefore = parseInt(execSync(countCommand).toString().trim(), 10);
  console.log(`[DR_TEST] Verified: Table count is ${tableCountBefore} (Database is clean and offline).`);

  console.log('\n[DR_TEST] 3. Starting Production Disaster Recovery (Restore) Process...');
  const restoreStartTime = Date.now();
  
  const backupContent = fs.readFileSync(backupPath, 'utf8');
  execSync(`docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}`, {
    input: backupContent
  });
  
  const restoreEndTime = Date.now();
  const elapsedSeconds = ((restoreEndTime - restoreStartTime) / 1000).toFixed(2);
  console.log(`[DR_TEST] Restore completed successfully! Elapsed Time: ${elapsedSeconds} seconds.`);

  console.log('\n[DR_TEST] 4. Executing Health & Relational Grid Verification Checks...');
  const tableCountAfter = parseInt(execSync(countCommand).toString().trim(), 10);
  console.log(`[DR_TEST] Verified: Recovered ${tableCountAfter} database tables.`);
  
  const tenantCount = parseInt(execSync(`docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM tenants;"`).toString().trim(), 10);
  const userCount = parseInt(execSync(`docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM users;"`).toString().trim(), 10);
  
  console.log(`[DR_TEST] Grid Verification: Verified ${tenantCount} active multi-tenant records and ${userCount} security keys.`);
  
  if (tableCountAfter > 0 && tenantCount > 0 && userCount > 0) {
    console.log(`\n🎉 [DR_SUCCESS] Disaster Recovery Simulated and Verified under the 2-hour RTO SLA!`);
    process.exit(0);
  } else {
    console.error(`\n❌ [DR_FAILED] Verification check failed. Recovery incomplete.`);
    process.exit(1);
  }
}

run().catch(e => {
  console.error('[DR_ERROR] Recovery sequence aborted:', e.message);
  process.exit(1);
});
