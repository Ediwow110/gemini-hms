import { execSync } from 'child_process';
import 'dotenv/config';

console.log(`\n================================================================================`);
console.log(`🚀 LAUNCHING HMS MASTER ARCHITECTURAL VERIFICATION SUITE`);
console.log(`================================================================================`);
console.log(`Execution Mode: STRICT COMPLIANCE / ZERO STRUCTURAL DRIFT`);
console.log(`================================================================================\n`);

const scriptsToExecute = [
  {
    name: 'BATCH 9: B2B Marketplace & Regulatory Gating',
    command: 'npx tsx scripts/ultimate-marketplace-stress-test.ts'
  },
  {
    name: 'TRACK 5: ZKP Clinical Attestation Core',
    command: 'npx tsx scripts/zkp-exchange-core.ts'
  },
  {
    name: 'TRACK 7: Silicon Secure Enclaves',
    command: 'npx tsx scripts/confidential-enclave-core.ts'
  },
  {
    name: 'TRACK 8: Blockchain Reentrancy Clearinghouse',
    command: 'npx tsx scripts/simulate-blockchain-settlement.ts'
  },
  {
    name: 'UNIFIED ENDGAME: Multi-Cloud Federated Failover',
    command: 'npx tsx scripts/multi-cloud-federated-failover.ts'
  }
];

let allPassed = true;

for (const script of scriptsToExecute) {
  console.log(`\n================================================================================`);
  console.log(`⚡ EXECUTING: ${script.name}`);
  console.log(`================================================================================`);
  
  try {
    const output = execSync(script.command, { stdio: 'inherit', env: process.env });
  } catch (error: any) {
    console.error(`\n🔴 FATAL EXCEPTION IN VERIFICATION MODULE: ${script.name}`);
    console.error(`Exit Code: ${error.status}`);
    allPassed = false;
    break; // Fail-closed execution stop
  }
}

console.log(`\n================================================================================`);
if (allPassed) {
  console.log(`\x1b[32m✅ SYSTEM DIRECTIVE ENFORCED: THE HOSPITAL MANAGEMENT SYSTEM IS CYBERNETICALLY SEALED AND 100% COMPLIANT.\x1b[0m`);
} else {
  console.log(`\x1b[31m❌ DIRECTIVE FAILED: STRUCTURAL DRIFT DETECTED. SYSTEM COMPROMISED.\x1b[0m`);
}
console.log(`================================================================================\n`);
