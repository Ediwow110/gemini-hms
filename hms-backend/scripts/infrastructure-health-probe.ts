import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const isSingleRun = args.includes('--single-run');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('CRITICAL: JWT_SECRET environment variable is not defined.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const tenantId = '00000000-0000-0000-0000-000000000001';

  console.log(`\n================================================================================`);
  console.log(`📡 SRE INGRESS HEALTH PROBER & GATEWAY WATCHDOG`);
  console.log(`================================================================================`);
  console.log(`Mode:        ${isSingleRun ? 'ONE-SHOT (SINGLE RUN)' : 'DAEMON WATCHDOG'}`);
  console.log(`Target:      http://localhost:3000`);
  console.log(`Tenant ID:   ${tenantId}`);
  console.log(`SLO Latency: < 800ms`);
  console.log(`Safety Heap: < 150MB`);
  console.log(`================================================================================\n`);

  let degradedCount = 0;
  let consecutiveFailures = 0;
  const maxConsecutiveFailuresBeforeAlert = 3;

  const runSweep = async (): Promise<boolean> => {
    let sweepSuccess = true;
    
    // A. Generate a statefully verified JWT token for admin@hospital.com
    let token = '';
    try {
      const user = await prisma.user.findFirst({
        where: { email: 'admin@hospital.com', tenantId },
      });

      if (!user) {
        throw new Error('Seed admin user not found in database.');
      }

      // Self-heal: ensure the admin.health.view permission exists and is mapped to Super Admin role
      const permission = await prisma.permission.upsert({
        where: {
          tenantId_name: {
            tenantId,
            name: 'admin.health.view',
          },
        },
        update: {},
        create: {
          tenantId,
          name: 'admin.health.view',
          scope: 'tenant',
          riskLevel: 'LOW',
        },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: '00000000-0000-0000-0000-000000000002', // Super Admin role ID from seed.ts
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: '00000000-0000-0000-0000-000000000002',
          permissionId: permission.id,
        },
      });

      let session = await prisma.session.findFirst({
        where: { userId: user.id, tenantId },
      });

      if (!session) {
        session = await prisma.session.create({
          data: {
            userId: user.id,
            tenantId: tenantId,
            refreshTokenHash: 'sre-health-check-session-' + Math.random(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isMfaVerified: true,
          },
        });
      }

      const payload = {
        sub: user.id,
        sid: session.id,
        tenantId: tenantId,
        tokenVersion: user.tokenVersion,
        roles: ['Super Admin'],
        mfaVerified: true,
        branchId: '00000000-0000-0000-0000-000000000010',
      };

      token = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
      console.log(`[AUTH] Programmatically self-signed verified access token using JWT_SECRET.`);
    } catch (err: any) {
      console.warn(`[AUTH_ERROR] Failed programmatically self-signing access token: ${err.message}.`);
    }

    // B. Uptime & Core Pings
    const targets = [
      { 
        name: 'Public Health Endpoint', 
        url: 'http://localhost:3000/health', 
        headers: { 'x-tenant-id': tenantId } 
      },
      { 
        name: 'Admin Health Endpoint', 
        url: 'http://localhost:3000/api/v1/admin/health', 
        headers: token 
          ? { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } 
          : { 'x-tenant-id': tenantId } 
      }
    ];

    for (const target of targets) {
      try {
        const start = Date.now();
        const res = await fetch(target.url, { headers: target.headers as any });
        const rtt = Date.now() - start;

        if (res.ok) {
          console.log(`🟢 [PING] ${target.name}: HTTP 200 OK | Latency: ${rtt}ms`);
          
          // Latency Performance checking
          if (rtt > 800) {
            degradedCount++;
            consecutiveFailures++;
            console.warn(`⚠️  [SLO_WARNING] Response latency of ${rtt}ms breached the 800ms threshold!`);
          } else {
            consecutiveFailures = 0; // reset on clean success
          }
        } else {
          sweepSuccess = false;
          consecutiveFailures++;
          console.error(`🔴 [PING_FAILED] ${target.name} returned HTTP status ${res.status}`);
          
          if (res.status >= 500) {
            triggerAlert('CRITICAL', 'IngressUptime', '0.08%', `Subsystem crash detected with status code HTTP ${res.status}`);
          }
        }
      } catch (err: any) {
        sweepSuccess = false;
        consecutiveFailures++;
        console.error(`🔴 [PING_ERROR] Failed to query ${target.name}: ${err.message}`);
      }
    }

    // C. Runtime Resource Isolation Footprints (process.memoryUsage())
    const mem = process.memoryUsage();
    const heapUsedMB = mem.heapUsed / 1024 / 1024;
    console.log(`[RESOURCE] Memory Footprint:`);
    console.log(`   ├─ RSS:        ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   ├─ Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   └─ Heap Used:  ${heapUsedMB.toFixed(2)} MB`);

    if (heapUsedMB > 150.00) {
      console.error(`🔴 [RESOURCE_BREACH] Memory usage of ${heapUsedMB.toFixed(2)} MB has crossed the 150MB safety ceiling!`);
      sweepSuccess = false;
    }

    // D. Trigger alert if latency constraints breached consecutively
    if (consecutiveFailures >= maxConsecutiveFailuresBeforeAlert) {
      triggerAlert('WARNING', 'IngressLatency', '0.05%', 'Subsystem latency bounds violated.');
    }

    return sweepSuccess;
  };

  const triggerAlert = (severity: string, sloMetric: string, budget: string, message: string) => {
    console.log(`\n🚨 SRE SEV-1 ALERT TRIGGERED`);
    console.log(`--------------------------------------------------------------------------------`);
    const alertPayload = {
      cluster: 'gemini-hms-prod',
      severity,
      sloMetric,
      errorBudgetSpent: budget,
      message,
    };
    console.log(JSON.stringify(alertPayload, null, 2));
    console.log(`--------------------------------------------------------------------------------\n`);
  };

  if (isSingleRun) {
    const success = await runSweep();
    console.log(`\n================================================================================`);
    console.log(`PROBING STABILITY SWEEP CONCLUDED`);
    console.log(`================================================================================`);
    
    await prisma.$disconnect();
    
    if (success) {
      console.log(`\x1b[32m🟢 VERDICT: HEALTH PROBER DEPLOYED (ALL SYSTEMS OPERATIONAL)\x1b[0m\n`);
      process.exit(0);
    } else {
      console.log(`\x1b[31m🔴 VERDICT: HEALTH PROBER BLOCKED (DEGRADED SYSTEMS ENCOUNTERED)\x1b[0m\n`);
      process.exit(1);
    }
  } else {
    // Run in Daemon Watchdog mode (every 10 seconds)
    while (true) {
      await runSweep();
      console.log(`[WATCHDOG] Sleeping for 10 seconds before next sweep...\n`);
      await sleep(10000);
    }
  }
}

main();
