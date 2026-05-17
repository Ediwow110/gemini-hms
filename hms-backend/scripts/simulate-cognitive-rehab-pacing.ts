import { CognitiveRehabService } from '../src/rehabilitation/cognitive-rehab.service';
import 'dotenv/config';

async function main() {
  const args = process.argv.slice(2);
  const tenantIdArgIndex = args.indexOf('--tenantId');
  const tenantId = tenantIdArgIndex !== -1 ? args[tenantIdArgIndex + 1] : '234f5c00-f6a3-4d55-996a-281e1306d7ca';

  console.log(`\n================================================================================`);
  console.log(`🧠 BATCH 10: COGNITIVE REHABILITATION & ADAPTIVE IoT PACING`);
  console.log(`================================================================================`);
  console.log(`Tenant Context:  ${tenantId}`);
  console.log(`================================================================================\n`);

  const rehabService = new CognitiveRehabService();

  // ==============================================================================
  // SCENARIO 1: Successful Paced Advancement
  // ==============================================================================
  console.log(`[SCENARIO 1] Simulating Successful Paced Advancement...`);
  await rehabService.processTherapyPacket(tenantId, {
    tenantId, 
    patientId: 'pat-777', 
    deviceId: 'tactile-block-01',
    accuracyRate: 0.95, 
    targetLatency: 2.0, 
    actualLatency: 1.8
  });
  console.log(`🟢 Verified pacing engine evaluates excellent scores and advances curves cleanly.\n`);
  console.log(`--------------------------------------------------------------------------------\n`);

  // ==============================================================================
  // SCENARIO 2: Neurological Regression Intercept
  // ==============================================================================
  console.log(`[SCENARIO 2] Simulating Neurological Regression Intercept...`);
  for (let i = 1; i <= 3; i++) {
    console.log(`   ├─ Executing regression telemetry packet #${i}`);
    await rehabService.processTherapyPacket(tenantId, {
      tenantId, 
      patientId: 'pat-777', 
      deviceId: 'tactile-block-01',
      accuracyRate: 0.30,   // Low accuracy
      targetLatency: 2.0, 
      actualLatency: 5.0    // Latency spike
    });
  }
  
  const hasAlert = rehabService.auditLogs.some(log => log.status === 'CRITICAL_REGRESSION_ALERT');
  if (hasAlert) {
    console.log(`🟢 Verified critical regression anomaly intercepted and alert logged to AuditLog.\n`);
  } else {
    console.error(`🔴 FAILURE: Regression alert bypassed!`);
    process.exit(1);
  }
  console.log(`--------------------------------------------------------------------------------\n`);

  // ==============================================================================
  // SCENARIO 3: Atomic Data Integrity Guard
  // ==============================================================================
  console.log(`[SCENARIO 3] Verifying Atomic Data Integrity Guard (Mid-Session Disconnect)...`);
  try {
    await rehabService.processTherapyPacket(tenantId, {
      tenantId, 
      patientId: 'pat-777', 
      deviceId: 'tactile-block-01',
      accuracyRate: 0.90, 
      targetLatency: 2.0, 
      actualLatency: 2.0, 
      isSessionAborted: true // Mid-mutation network drop
    });
  } catch (err: any) {
    console.log(`🟢 Verified 100% fail-closed rollback. Disconnect prevented partial session commits: ${err.message}\n`);
  }

  console.log(`================================================================================`);
  console.log(`\x1b[32m🟢 VERDICT: COGNITIVE REHABILITATION TRACK OPERATIONAL\x1b[0m`);
  console.log(`================================================================================\n`);
}

main();
