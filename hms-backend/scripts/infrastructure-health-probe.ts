import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const isSingleRun = args.includes('--single-run');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      'CRITICAL: DATABASE_URL environment variable is not defined.',
    );
    process.exit(1);
  }

  const probeToken = process.env.PROBE_TOKEN;
  if (!probeToken) {
    console.warn(
      'WARNING: PROBE_TOKEN not set — admin health check will be skipped.',
    );
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const tenantId = '00000000-0000-0000-0000-000000000001';

  console.log(
    `\n================================================================================`,
  );
  console.log(`SRE INGRESS HEALTH PROBER`);
  console.log(
    `================================================================================`,
  );
  console.log(
    `Mode:        ${isSingleRun ? 'ONE-SHOT (SINGLE RUN)' : 'DAEMON WATCHDOG'}`,
  );
  console.log(`Target:      http://localhost:3000`);
  console.log(`Tenant ID:   ${tenantId}`);
  console.log(`SLO Latency: < 800ms`);
  console.log(`Safety Heap: < 150MB`);
  console.log(
    `================================================================================\n`,
  );

  let consecutiveFailures = 0;
  const maxConsecutiveFailuresBeforeAlert = 3;

  const runSweep = async (): Promise<boolean> => {
    let sweepSuccess = true;

    // A. Uptime & Core Pings
    const targets: Array<{
      name: string;
      url: string;
      headers: Record<string, string>;
    }> = [
      {
        name: 'Public Health Endpoint',
        url: 'http://localhost:3000/api/v1/health',
        headers: { 'x-tenant-id': tenantId },
      },
    ];

    if (probeToken) {
      targets.push({
        name: 'Admin Health Endpoint',
        url: 'http://localhost:3000/api/v1/admin/health',
        headers: {
          Authorization: `Bearer ${probeToken}`,
          'x-tenant-id': tenantId,
        },
      });
    }

    for (const target of targets) {
      try {
        const start = Date.now();
        const res = await fetch(target.url, { headers: target.headers });
        const rtt = Date.now() - start;

        if (res.ok) {
          console.log(`[PING] ${target.name}: HTTP 200 OK | Latency: ${rtt}ms`);

          if (rtt > 800) {
            consecutiveFailures++;
            console.warn(
              `[SLO_WARNING] Response latency of ${rtt}ms breached the 800ms threshold!`,
            );
          } else {
            consecutiveFailures = 0;
          }
        } else {
          sweepSuccess = false;
          consecutiveFailures++;
          console.error(
            `[PING_FAILED] ${target.name} returned HTTP status ${res.status}`,
          );

          if (res.status >= 500) {
            triggerAlert(
              'CRITICAL',
              'IngressUptime',
              '0.08%',
              `Subsystem crash detected with status code HTTP ${res.status}`,
            );
          }
        }
      } catch (err: any) {
        sweepSuccess = false;
        consecutiveFailures++;
        console.error(
          `[PING_ERROR] Failed to query ${target.name}: ${err.message}`,
        );
      }
    }

    // B. Runtime Resource Isolation Footprints (process.memoryUsage())
    const mem = process.memoryUsage();
    const heapUsedMB = mem.heapUsed / 1024 / 1024;
    console.log(`[RESOURCE] Memory Footprint:`);
    console.log(`   RSS:        ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(
      `   Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(`   Heap Used:  ${heapUsedMB.toFixed(2)} MB`);

    if (heapUsedMB > 150.0) {
      console.error(
        `[RESOURCE_BREACH] Memory usage of ${heapUsedMB.toFixed(2)} MB has crossed the 150MB safety ceiling!`,
      );
      sweepSuccess = false;
    }

    // C. Trigger alert if latency constraints breached consecutively
    if (consecutiveFailures >= maxConsecutiveFailuresBeforeAlert) {
      triggerAlert(
        'WARNING',
        'IngressLatency',
        '0.05%',
        'Subsystem latency bounds violated.',
      );
    }

    return sweepSuccess;
  };

  const triggerAlert = (
    severity: string,
    sloMetric: string,
    budget: string,
    message: string,
  ) => {
    console.log(`\nSRE SEV-1 ALERT TRIGGERED`);
    const alertPayload = {
      cluster: 'gemini-hms-prod',
      severity,
      sloMetric,
      errorBudgetSpent: budget,
      message,
    };
    console.log(JSON.stringify(alertPayload, null, 2));
    console.log();
  };

  if (isSingleRun) {
    const success = await runSweep();
    console.log(`\nPROBING STABILITY SWEEP CONCLUDED`);

    await prisma.$disconnect();

    if (success) {
      console.log(`VERDICT: HEALTH PROBER DEPLOYED (ALL SYSTEMS OPERATIONAL)`);
      process.exit(0);
    } else {
      console.log(
        `VERDICT: HEALTH PROBER BLOCKED (DEGRADED SYSTEMS ENCOUNTERED)`,
      );
      process.exit(1);
    }
  } else {
    while (true) {
      await runSweep();
      console.log(`[WATCHDOG] Sleeping for 10 seconds before next sweep...\n`);
      await sleep(10000);
    }
  }
}

void main();
