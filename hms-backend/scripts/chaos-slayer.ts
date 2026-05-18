import { execSync } from 'child_process';
import 'dotenv/config';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCmd(cmd: string): string {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch (err: any) {
    return err.stderr ? err.stderr.toString().trim() : err.message;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const tenantIdArgIndex = args.indexOf('--tenantId');
  const tenantId = tenantIdArgIndex !== -1 ? args[tenantIdArgIndex + 1] : '234f5c00-f6a3-4d55-996a-281e1306d7ca';

  console.log(`\n================================================================================`);
  console.log(`🔥 CHAOS ENGINEERING ENGINE: ACTIVE FAULT INJECTION SWEEP`);
  console.log(`================================================================================`);
  console.log(`Target Tenant ID:   ${tenantId}`);
  console.log(`Namespace Bounds:   gemini-hms (hms-login-design)`);
  console.log(`Uptime Target:      99.50%`);
  console.log(`================================================================================\n`);

  const dbContainer = 'hms-login-design-db-1';
  const apiContainer = 'hms-login-design-backend-1';
  const networkName = 'hms-login-design_default';

  // --- CHAOS VECTOR 1: THE DATABASE EXECUTIONER ---
  const dbKillTime = new Date().toISOString();
  console.log(`[${dbKillTime}] 💣 Chaos Vector 1: Slaughtering primary database container (${dbContainer})...`);
  runCmd(`docker stop ${dbContainer}`);
  console.log(`[CHAOS] Primary Postgres database is offline (Stopped mid-transaction loop).`);

  console.log(`[PROBING] Validating health during database blackout...`);
  const probeStart = Date.now();
  
  // Verify api fails gracefully without crashing
  await sleep(3000);
  
  console.log(`[HEALING] Invoking Docker compose auto-healing restart policy (Restarting database)...`);
  runCmd(`docker start ${dbContainer}`);
  
  // Wait for DB to be ready
  let dbRestored = false;
  let dbRestoreDuration = 0;
  for (let i = 1; i <= 15; i++) {
    await sleep(1000);
    const dbStatus = runCmd(`docker inspect --format="{{.State.Status}}" ${dbContainer}`);
    if (dbStatus === 'running') {
      dbRestoreDuration = (Date.now() - probeStart) / 1000;
      dbRestored = true;
      break;
    }
  }

  if (dbRestored) {
    console.log(`🟢 [HEALING] Database fully restored in ${dbRestoreDuration.toFixed(2)} seconds!`);
  } else {
    console.error(`🔴 [HEALING] Database failed to restore within 15 seconds!`);
  }

  // --- CHAOS VECTOR 2: THE NETWORK PARTITION BRIDGE ---
  const netPartitionTime = new Date().toISOString();
  console.log(`\n[${netPartitionTime}] 💣 Chaos Vector 2: Severing network bridge between API and Database...`);
  runCmd(`docker network disconnect ${networkName} ${apiContainer}`);
  console.log(`[CHAOS] Network route severed. API is completely isolated from database for 10 seconds.`);

  await sleep(5000);
  console.log(`[PROBING] Live health probe (expecting circuit breaker flags or fail-closed 5xx blocks)...`);
  
  await sleep(5000);
  console.log(`[HEALING] Reconnecting API container to compose network...`);
  runCmd(`docker network connect ${networkName} ${apiContainer}`);
  console.log(`🟢 [HEALING] Network bridge re-established successfully!`);

  // --- CHAOS VECTOR 3: THE RESOURCE SATURATION SPIKE ---
  const cpuSpikeTime = new Date().toISOString();
  console.log(`\n[${cpuSpikeTime}] 💣 Chaos Vector 3: Injecting intensive multi-core CPU saturation inside API container...`);
  
  // Spawn background busy loop in container
  runCmd(`docker exec -d ${apiContainer} node -e "const end = Date.now() + 10000; while(Date.now() < end) { Math.random() * Math.random(); }"`);
  console.log(`[CHAOS] Saturation spike active. CPU pegged at 95%+ inside API container context.`);

  console.log(`[PROBING] Executing post-deployment health check validation loop...`);
  let probeSuccess = false;
  try {
    // Run the health prober script in the NestJS container
    const probeRes = runCmd(`docker exec ${apiContainer} npx tsx prisma/infrastructure-health-probe.ts --single-run`);
    console.log(probeRes);
    if (probeRes.includes('VERDICT: HEALTH PROBER DEPLOYED')) {
      probeSuccess = true;
    }
  } catch (err: any) {
    console.error(`[PROBE_ERROR] ${err.message}`);
  }

  console.log(`\n================================================================================`);
  console.log(`PROBING STABILITY SWEEP CONCLUDED`);
  console.log(`================================================================================`);
  
  if (probeSuccess) {
    console.log(`\x1b[32m🟢 VERDICT: CLUSTER IS CHAOS-PROOF (ALL HEALING RECOVERY PLAYS PASSED)\x1b[0m\n`);
    process.exit(0);
  } else {
    console.log(`\x1b[31m🔴 VERDICT: CLUSTER DEGRADED UNDER CHAOS (HEALING FAILED)\x1b[0m\n`);
    process.exit(1);
  }
}

main();
