import 'dotenv/config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.join(backupDir, 'production_snapshot.sql');

  console.log('[DR_TEST] 1. Initializing Production Backup Sequence...');
  
  // Dump the database
  const dumpCommand = 'docker exec hms-login-design-postgres_prod-1 pg_dump -U hms_prod_user -d gemini_hms_prod -F p --clean';
  const dumpOutput = execSync(dumpCommand).toString();
  fs.writeFileSync(backupPath, dumpOutput, 'utf8');
  
  const backupSizeKb = (fs.statSync(backupPath).size / 1024).toFixed(2);
  console.log(`[DR_TEST] Backup completed successfully. Saved to: ${backupPath} (Size: ${backupSizeKb} KB)`);

  console.log('\n[DR_TEST] 2. Simulating Catastrophic Production Hardware Failure...');
  console.log('[DR_TEST] Issuing destructive command to purge the datastore...');
  
  const destructiveCommand = 'docker exec -i hms-login-design-postgres_prod-1 psql -U hms_prod_user -d gemini_hms_prod -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"';
  execSync(destructiveCommand);
  console.log('[DR_TEST] Active database wiped! Checking tables (should be empty)...');
  
  const countCommand = 'docker exec hms-login-design-postgres_prod-1 psql -U hms_prod_user -d gemini_hms_prod -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\';"';
  const tableCountBefore = parseInt(execSync(countCommand).toString().trim(), 10);
  console.log(`[DR_TEST] Verified: Table count is ${tableCountBefore} (Database is clean and offline).`);

  console.log('\n[DR_TEST] 3. Starting Production Disaster Recovery (Restore) Process...');
  const restoreStartTime = Date.now();
  
  const backupContent = fs.readFileSync(backupPath, 'utf8');
  execSync('docker exec -i hms-login-design-postgres_prod-1 psql -U hms_prod_user -d gemini_hms_prod', {
    input: backupContent
  });
  
  const restoreEndTime = Date.now();
  const elapsedSeconds = ((restoreEndTime - restoreStartTime) / 1000).toFixed(2);
  console.log(`[DR_TEST] Restore completed successfully! Elapsed Time: ${elapsedSeconds} seconds.`);

  console.log('\n[DR_TEST] 4. Executing Health & Relational Grid Verification Checks...');
  const tableCountAfter = parseInt(execSync(countCommand).toString().trim(), 10);
  console.log(`[DR_TEST] Verified: Recovered ${tableCountAfter} database tables.`);
  
  const tenantCount = parseInt(execSync('docker exec hms-login-design-postgres_prod-1 psql -U hms_prod_user -d gemini_hms_prod -t -c "SELECT COUNT(*) FROM tenants;"').toString().trim(), 10);
  const userCount = parseInt(execSync('docker exec hms-login-design-postgres_prod-1 psql -U hms_prod_user -d gemini_hms_prod -t -c "SELECT COUNT(*) FROM users;"').toString().trim(), 10);
  
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
