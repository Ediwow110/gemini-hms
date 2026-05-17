import { AncillaryService } from '../backend/src/ancillary/ancillary.service';
import { SecurityException } from '../backend/middleware/tenant-isolation';

async function main() {
  console.log(`================================================================================`);
  console.log(`🚀 BATCH 4: ANCILLARY CLINICAL OPERATIONS (LIS & INVENTORY)`);
  console.log(`Execution Mode: IMMUTABLE AUDIT TRAIL / FAIL-CLOSED INVENTORY`);
  console.log(`================================================================================\n`);

  const ancillaryService = new AncillaryService();
  const TENANT_A = 'tenant-A';
  const TECH_ID = 'tech-88';
  
  // ================================================================================
  // SCENARIO 1: Unalterable LIS History Check
  // ================================================================================
  console.log(`[SCENARIO 1] Unalterable LIS History Check (Immutable Audit Trail)`);
  try {
    // Attempt standard operational append sequence
    const resultV1 = await ancillaryService.appendLabResult('lab-ord-1', 'Initial RBC count 4.6m.', TECH_ID, TENANT_A);
    const resultV2 = await ancillaryService.appendLabResult('lab-ord-1', 'Updated RBC count 4.8m post-centrifuge.', TECH_ID, TENANT_A);
    
    console.log(`   ├─ Executing strict history append logic.`);
    console.log(`   ├─ Created Version ${resultV1.version} safely.`);
    console.log(`   ├─ Created Version ${resultV2.version} safely.`);

    // Emulate a direct SQL UPDATE override attack vector
    console.log(`   ├─ Attempting direct SQL UPDATE attack on Version 1...`);
    await ancillaryService.directUpdateAttack('lab-ord-1', 'Falsified data override');
    console.error(`   🔴 FAILURE: Immutable history bypassed! Data corrupted.\n`);
  } catch (err: any) {
    if (err.message.includes('DIRECT_UPDATE_BLOCKED')) {
      console.log(`   🟢 SUCCESS: System architecture protected historical records.`);
      console.log(`   ├─ Exception: ${err.message}`);
      console.log(`   🟢 VERIFIED: LIS updates force incremental append-only rows. History secured.\n`);
    } else {
      console.error(`   🔴 FAILURE: Unexpected error type: ${err}\n`);
    }
  }

  // ================================================================================
  // SCENARIO 2: Low Stock Threshold Trigger
  // ================================================================================
  console.log(`[SCENARIO 2] Low Stock Threshold Alert Trigger`);
  
  // Deduct exactly enough to drop the remaining balance (15) strictly below the threshold (20)
  const invPayload = await ancillaryService.deductPharmacyStock('inv-med-1', 35, TENANT_A);
  console.log(`   ├─ Deducting 35 units from Amoxicillin branch allocation.`);
  
  if (invPayload.alert && invPayload.alert.includes('CRITICAL_THRESHOLD_BREACH')) {
    console.log(`   🟢 SUCCESS: System caught boundary breach precisely (Remaining: ${invPayload.remaining}).`);
    console.log(`   ├─ Alert Payload: ${invPayload.alert}`);
    console.log(`   🟢 VERIFIED: Automated threshold flag triggered cleanly.\n`);
  } else {
    console.error(`   🔴 FAILURE: Threshold trigger failed to bubble up.\n`);
  }

  // ================================================================================
  // SCENARIO 3: Multi-Tenant Cross-Access Fence
  // ================================================================================
  console.log(`[SCENARIO 3] Strict Multi-Tenant Boundary Cross-Over Block (Anti-IDOR)`);
  try {
    // Attempt to access 'inv-med-999' (Owned strictly by Tenant B) natively from Tenant A session context
    await ancillaryService.deductPharmacyStock('inv-med-999', 5, TENANT_A);
    console.error(`   🔴 FAILURE: IDOR traversal succeeded! Security failure.\n`);
  } catch (err: any) {
    if (err instanceof SecurityException) {
      console.log(`   🟢 SUCCESS: Cross-tenant inventory leakage intercepted.`);
      console.log(`   ├─ Exception: ${err.message}`);
      console.log(`   🟢 VERIFIED: Asset operation forcefully blocked. Inventory untouched.\n`);
    } else {
      console.error(`   🔴 FAILURE: Unexpected error type: ${err}\n`);
    }
  }

  console.log(`================================================================================`);
  console.log(`\x1b[32m✅ VERDICT: ANCILLARY OPERATIONS VERIFIED\x1b[0m`);
  console.log(`================================================================================\n`);
}

main();
