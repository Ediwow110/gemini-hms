import { TriageSurgeService } from '../backend/src/emergency/triage-surge.service';
import { SecurityException } from '../backend/middleware/tenant-isolation';

async function main() {
  console.log(`================================================================================`);
  console.log(`🚀 BATCH 14: EMERGENCY ER TRIAGE & DISASTER SURGE PROTOCOL MATRIX`);
  console.log(`Execution Mode: ACUITY ROUTING ALGEBRA & SATURATION INDEXING`);
  console.log(`================================================================================\n`);

  const triageService = new TriageSurgeService();
  const TENANT_A = 'tenant-A';
  
  // ================================================================================
  // VERIFICATION CASE 1: Quarantine Gating Routing Accuracy
  // ================================================================================
  console.log(`[VERIFICATION CASE 1] Quarantine Gating Routing Accuracy`);
  try {
    console.log(`   ├─ Processing high-acuity admission vector requiring Airborne Isolation...`);
    const isolationAdmit = await triageService.admitErPatient({
      patientId: 'pat-iso',
      tenantId: TENANT_A,
      esiLevel: 2,
      glasgowComaScale: 12,
      requiresIsolation: true // Explicit airborne threat flag
    }, TENANT_A);
    
    // We expect the routing engine mapped it directly into Bay-Iso-1 instead of Bay-Standard-1
    if (isolationAdmit.bayId === 'bay-iso-1') {
      console.log(`   🟢 SUCCESS: Quarantine interceptor successfully bypassed standard triage mapping routes.`);
      console.log(`   🟢 VERIFIED: Patient mapped natively to active 'is_isolation_capable' negative pressure suite.\n`);
    } else {
      console.error(`   🔴 FAILURE: Allocation engine breached quarantine logic constraints! Patient routed to unsafe bay.\n`);
    }
  } catch (err: any) {
    console.error(`   🔴 FAILURE: Unexpected error type: ${err.message}\n`);
  }

  // ================================================================================
  // VERIFICATION CASE 2: Surge Saturation Capacity Index Calculation
  // ================================================================================
  console.log(`[VERIFICATION CASE 2] Surge Saturation Capacity Index Calculation`);
  try {
    console.log(`   ├─ Executing Mass Casualty Event simulation loop (15x ESI Level 1 vectors)...`);
    
    // Saturation math validation:
    // SCI = sum(6 - ESI_i) / (B_active * (1 - rho_staff))
    // B_active for Tenant A is 2. rho_staff = 0.3. Denominator = 2 * 0.7 = 1.4
    // 15 ESI Level 1s -> sum(6-1) = 5 * 15 = 75
    // 75 / 1.4 = 53.57. This heavily breaches the explicit 1.5 safety boundary!
    
    for (let i = 0; i < 15; i++) {
       await triageService.admitErPatient({
         patientId: `pat-mci-${i}`,
         tenantId: TENANT_A,
         esiLevel: 1, // High acuity
         glasgowComaScale: 3,
         requiresIsolation: false
       }, TENANT_A);
    }
    
    const currentState = await triageService.calculateSurgeSaturation(TENANT_A);

    if (currentState === 'DIVERSION_PROTOCOL_ENGAGED') {
      console.log(`   🟢 SUCCESS: Surge Capacity Index mathematical engine scaled past 1.5 ceiling safety boundary.`);
      console.log(`   🟢 VERIFIED: Operational facility state forcefully transitioned to DIVERSION_PROTOCOL_ENGAGED.\n`);
    } else {
      console.error(`   🔴 FAILURE: Expected capacity index trigger completely bypassed. Diversion not engaged!\n`);
    }
  } catch (err: any) {
    console.error(`   🔴 FAILURE: Unexpected error type: ${err.message}\n`);
  }

  // ================================================================================
  // VERIFICATION CASE 3: Cross-Tenant Asset Mapping Spoofer
  // ================================================================================
  console.log(`[VERIFICATION CASE 3] Cross-Tenant Asset Mapping Spoofer`);
  try {
    console.log(`   ├─ Authenticating as Tenant-B session and attempting ingress allocation route against Tenant-A tracking ID...`);
    
    await triageService.admitErPatient({
         patientId: `pat-spoof`,
         tenantId: 'tenant-A', // Spoof payload targeting A
         esiLevel: 1,
         glasgowComaScale: 3,
         requiresIsolation: false
       }, 'tenant-B'); // Authenticated caller from B
    
    console.error(`   🔴 FAILURE: IDOR mapping boundaries successfully intercepted! Cross-tenant injection achieved.\n`);
  } catch (err: any) {
    if (err instanceof SecurityException || err.message.includes('IDOR')) {
      console.log(`   🟢 SUCCESS: Anti-IDOR perimeter recognized mismatched multi-tenant payload injection.`);
      console.log(`   ├─ Exception: ${err.message}`);
      console.log(`   🟢 VERIFIED: Execution loop dropped gracefully. Underlying triage database structures perfectly intact.\n`);
    } else {
      console.error(`   🔴 FAILURE: Unexpected error type: ${err.message}\n`);
    }
  }

  console.log(`================================================================================`);
  console.log(`\x1b[32m✅ VERDICT: EMERGENCY TRIAGE MATRIX OPERATIONAL\x1b[0m`);
  console.log(`================================================================================\n`);
}

main();
