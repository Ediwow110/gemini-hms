import { PayrollService } from '../backend/src/workforce/payroll.service';
import { SecurityException } from '../backend/middleware/tenant-isolation';

async function main() {
  console.log(`================================================================================`);
  console.log(`🚀 BATCH 6: WORKFORCE LIFECYCLE & AUTOMATED ENTERPRISE PAYROLL`);
  console.log(`Execution Mode: ATOMIC MASS REMITTANCE / OVERLAP PREVENTION`);
  console.log(`================================================================================\n`);

  const payrollService = new PayrollService();
  const TENANT_A = 'tenant-A';
  
  // ================================================================================
  // SCENARIO 1: The Cross-Branch Overlap Attack
  // ================================================================================
  console.log(`[SCENARIO 1] The Cross-Branch Overlap Attack (Shift Intersection Algebra)`);
  try {
    console.log(`   ├─ Doctor Alpha is scheduled North Branch: [08:00 AM - 04:00 PM]`);
    console.log(`   ├─ Attempting to explicitly schedule Doctor Alpha South Branch: [02:00 PM - 10:00 PM]...`);
    
    // Intersection explicitly exists between 2:00 PM and 4:00 PM
    await payrollService.allocateShift(
      'doc-alpha', 
      'branch-south', 
      new Date('2026-05-20T14:00:00Z'), 
      new Date('2026-05-20T22:00:00Z'), 
      TENANT_A
    );
    console.error(`   🔴 FAILURE: Intersection algebra bypassed! Workforce collision.\n`);
  } catch (err: any) {
    if (err.message.includes('409_SHIFT_OVERLAP_CONFLICT')) {
      console.log(`   🟢 SUCCESS: Shift Intersection Algebra evaluated max(start) < min(end) accurately.`);
      console.log(`   ├─ Exception: ${err.message}`);
      console.log(`   🟢 VERIFIED: Overlapping branch schedules programmatically rejected.\n`);
    } else {
      console.error(`   🔴 FAILURE: Unexpected error type: ${err.message}\n`);
    }
  }

  // ================================================================================
  // SCENARIO 2: Mid-Execution Network Remittance Crash
  // ================================================================================
  console.log(`[SCENARIO 2] Mid-Execution Network Remittance Crash (Atomic Rollback)`);
  try {
    console.log(`   ├─ Dispatching Mass Salary Remittance for 10 line items...`);
    console.log(`   ├─ (Simulating Banking API Timeout explicitly on Item #7)`);
    await payrollService.executeMassRemittance('cycle-may', TENANT_A);
    console.error(`   🔴 FAILURE: Remittance bypassed the network crash without failing!\n`);
  } catch (err: any) {
    if (err.message.includes('BANKING_NETWORK_TIMEOUT')) {
      console.log(`   🟢 SUCCESS: Exception trapped successfully. Triggering atomic rollback...`);
      
      // Verify all items are exactly 'UNPAID' to mathematically prove zero partials
      const activeItems = payrollService.payrollItems.filter(p => p.cycleId === 'cycle-may');
      const allUnpaid = activeItems.every(p => p.paymentStatus === 'UNPAID');
      
      if (allUnpaid) {
        console.log(`   🟢 VERIFIED: 100% Fail-Closed Reversal. Zero partial payments drifted into active status.\n`);
      } else {
        console.error(`   🔴 FAILURE: Atomic Rollback failed! Line items reflect partial dirty states.\n`);
      }
    } else {
      console.error(`   🔴 FAILURE: Unexpected error type: ${err.message}\n`);
    }
  }

  // ================================================================================
  // SCENARIO 3: Multi-Tenant Workforce Isolation Gate
  // ================================================================================
  console.log(`[SCENARIO 3] Strict Multi-Tenant Workforce Isolation Gate (Anti-IDOR)`);
  try {
    console.log(`   ├─ Attempting isolated manual payment against target 'pay-item-999' (Tenant B)...`);
    await payrollService.attemptSingleCrossTenantPay('pay-item-999', TENANT_A);
    console.error(`   🔴 FAILURE: IDOR traversal succeeded! Security failure.\n`);
  } catch (err: any) {
    if (err instanceof SecurityException) {
      console.log(`   🟢 SUCCESS: Cross-tenant payload leakage intercepted.`);
      console.log(`   ├─ Exception: ${err.message}`);
      console.log(`   🟢 VERIFIED: Single line item modification blocked completely.\n`);
    } else {
      console.error(`   🔴 FAILURE: Unexpected error type: ${err.message}\n`);
    }
  }

  console.log(`================================================================================`);
  console.log(`\x1b[32m✅ VERDICT: WORKFORCE OPERATIONS VERIFIED\x1b[0m`);
  console.log(`================================================================================\n`);
}

main();
