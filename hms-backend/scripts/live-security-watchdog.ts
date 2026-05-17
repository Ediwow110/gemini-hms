import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

function parseDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'UNKNOWN';
  const ua = userAgent.toUpperCase();
  if (ua.includes('POSTMAN') || ua.includes('NEWMAN')) return 'API CLIENT (POSTMAN)';
  if (ua.includes('CURL')) return 'CLI (CURL)';
  if (ua.includes('MOBILE') || ua.includes('ANDROID') || ua.includes('IPHONE')) return 'MOBILE BROWSER';
  if (ua.includes('CHROME')) return 'DESKTOP (CHROME)';
  if (ua.includes('FIREFOX')) return 'DESKTOP (FIREFOX)';
  if (ua.includes('SAFARI')) return 'DESKTOP (SAFARI)';
  return 'DESKTOP BROWSER';
}

async function runWatchdog(prisma: PrismaClient, tenantId: string): Promise<boolean> {
  // Clear terminal screen for a smooth dashboard refresh
  console.clear();

  // 1. Fetch Tenant Name
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    console.error(`\n❌ Error: Tenant with ID "${tenantId}" not found.`);
    return false;
  }

  // 2. Fetch Active Sessions
  const activeSessions = await prisma.session.findMany({
    where: {
      tenantId,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          userBranches: {
            include: {
              branch: true,
            },
          },
        },
      },
    },
    orderBy: {
      expiresAt: 'desc',
    },
  });

  // 3. Fetch Authentication Failures for Current Calendar Date
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const authFailures = await prisma.auditLog.findMany({
    where: {
      tenantId,
      eventKey: { in: ['LOGIN_FAILED', 'LOGIN_FAILURE', 'MFA_REJECTED', 'AUTH_FAILED', 'AUTH_FAILURE'] },
      createdAt: { gte: todayStart },
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 4. Brute-force Detection (rolling 15-minute window count > 3)
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
  const rollingFailures = authFailures.filter(log => log.createdAt >= fifteenMinsAgo);

  // Group failures by IP and User
  const ipFailuresMap: { [ip: string]: number } = {};
  const userFailuresMap: { [userId: string]: { email: string; count: number } } = {};
  let bruteForceAlerts: string[] = [];

  for (const log of rollingFailures) {
    // Track by IP
    if (log.ipAddress) {
      ipFailuresMap[log.ipAddress] = (ipFailuresMap[log.ipAddress] || 0) + 1;
      if (ipFailuresMap[log.ipAddress] === 4) {
        bruteForceAlerts.push(`🚨 POTENTIAL BRUTE FORCE DETECTED: IP Address [${log.ipAddress}] amassed > 3 failures in 15 mins!`);
      }
    }
    // Track by User ID
    if (log.userId && log.user) {
      const uId = log.userId;
      if (!userFailuresMap[uId]) {
        userFailuresMap[uId] = { email: log.user.email, count: 0 };
      }
      userFailuresMap[uId].count++;
      if (userFailuresMap[uId].count === 4) {
        bruteForceAlerts.push(`🚨 POTENTIAL BRUTE FORCE DETECTED: User Account [${log.user.email}] amassed > 3 failures in 15 mins!`);
      }
    }
  }

  // ============================================================================
  // TERMINAL DASHBOARD LAYOUT
  // ============================================================================
  console.log(`================================================================================`);
  console.log(`🛡️  HMS LIVE SESSION WATCHDOG & BRUTE-FORCE TELEMETRY GUARD`);
  console.log(`================================================================================`);
  console.log(`Tenant:      ${tenant.name} (${tenant.id})`);
  console.log(`Live Time:   ${new Date().toISOString()}`);
  console.log(`Sessions:    ${activeSessions.length} Active`);
  console.log(`Failures:    ${authFailures.length} Logged Today`);
  console.log(`================================================================================`);

  // Print Brute Force Alerts if present
  if (bruteForceAlerts.length > 0) {
    console.log(`\n🚨 ALERT ANOMALIES`);
    console.log(`--------------------------------------------------------------------------------`);
    for (const alert of bruteForceAlerts) {
      console.log(`\x1b[31m${alert}\x1b[0m`);
    }
    console.log(`--------------------------------------------------------------------------------`);
  }

  // Main Section 1: Active User Sessions Matrix
  console.log(`\n📊 ACTIVE USER SESSIONS MATRIX (${activeSessions.length})`);
  console.log(`--------------------------------------------------------------------------------`);
  if (activeSessions.length === 0) {
    console.log(`No active user sessions currently online.`);
  } else {
    console.log(
      `EMAIL                      | ROLE         | IP ADDRESS      | DEVICE TYPE          | MFA`
    );
    console.log(`--------------------------------------------------------------------------------`);
    for (const session of activeSessions) {
      const email = (session.user.email || 'N/A').padEnd(26).slice(0, 26);
      const roleName = (session.user.userRoles[0]?.role.name || 'N/A').padEnd(12).slice(0, 12);
      const ip = (session.ipAddress || 'N/A').padEnd(15).slice(0, 15);
      const device = parseDeviceType(session.userAgent).padEnd(20).slice(0, 20);
      const mfa = session.isMfaVerified ? '✅ VERIFIED' : '❌ PENDING';
      console.log(`${email} | ${roleName} | ${ip} | ${device} | ${mfa}`);
    }
  }
  console.log(`--------------------------------------------------------------------------------`);

  // Main Section 2: Recent Security Exceptions Ledger
  console.log(`\n🔑 RECENT SECURITY EXCEPTIONS LEDGER (LAST 10)`);
  console.log(`--------------------------------------------------------------------------------`);
  if (authFailures.length === 0) {
    console.log(`No login failures or security exceptions logged today.`);
  } else {
    console.log(
      `TIMESTAMP            | EVENT TYPE      | TARGET USER                | SOURCE IP`
    );
    console.log(`--------------------------------------------------------------------------------`);
    const recentFailures = authFailures.slice(0, 10);
    for (const failure of recentFailures) {
      const ts = failure.createdAt.toISOString().slice(11, 19).padEnd(8);
      const event = failure.eventKey.padEnd(15).slice(0, 15);
      const target = (failure.user?.email || 'N/A').padEnd(26).slice(0, 26);
      const ip = (failure.ipAddress || 'N/A').padEnd(15).slice(0, 15);
      console.log(`${ts}             | ${event} | ${target} | ${ip}`);
    }
  }
  console.log(`================================================================================`);

  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : '';
  };

  const tenantId = getArg('--tenantId');
  const singleRun = args.includes('--single-run');

  if (!tenantId) {
    console.error('Usage: npx tsx scripts/live-security-watchdog.ts --tenantId <UUID> [--single-run]');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  if (singleRun) {
    const success = await runWatchdog(prisma, tenantId);
    await prisma.$disconnect();
    process.exit(success ? 0 : 1);
  } else {
    console.log(`[WATCHDOG] Starting active security daemon (polling every 5 seconds)...`);
    const runLoop = async () => {
      try {
        await runWatchdog(prisma, tenantId);
      } catch (err: any) {
        console.error(`\n❌ [WATCHDOG_ERROR] Polling loop failed:`, err.message);
      }
    };

    // Immediate run
    await runLoop();
    // Continuous polling interval
    setInterval(runLoop, 5000);
  }
}

main();
