import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : '';
  };

  const tenantId = getArg('--tenantId');
  const key = getArg('--key');
  const valueStr = getArg('--value');

  const allowedKeys = ['MAINTENANCE_MODE', 'BILLING_READ_ONLY', 'LAB_QUEUE_PAUSE'];

  if (!tenantId || !key || !valueStr) {
    console.error('Usage: npx tsx scripts/toggle-circuit-breaker.ts --tenantId <UUID> --key <MAINTENANCE_MODE|BILLING_READ_ONLY|LAB_QUEUE_PAUSE> --value <true|false>');
    process.exit(1);
  }

  if (!allowedKeys.includes(key)) {
    console.error(`Error: Key "${key}" is invalid. Allowed keys are: ${allowedKeys.join(', ')}`);
    process.exit(1);
  }

  const value = valueStr.toLowerCase() === 'true';

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(`\n================================================================================`);
  console.log(`🛡️  HMS CIRCUIT BREAKER CONTROLLER`);
  console.log(`================================================================================`);

  try {
    // 1. Verify Tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error(`Tenant ID "${tenantId}" not found.`);

    // 2. Fetch a Super Admin / Tenant Admin to sign the critical audit log
    const superAdmin = await prisma.user.findFirst({ where: { tenantId } });
    const actorId = superAdmin ? superAdmin.id : '00000000-0000-0000-0000-000000000000';
    const actorEmail = superAdmin ? superAdmin.email : 'system@hms.com';

    // 3. Persist circuit breaker JSON configurations in the container context
    const jsonPath = path.join(__dirname, 'circuit-breaker.json');
    let config: Record<string, Record<string, boolean>> = {};

    if (fs.existsSync(jsonPath)) {
      try {
        config = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      } catch {
        config = {};
      }
    }

    if (!config[tenantId]) {
      config[tenantId] = {};
    }

    // Set new value
    config[tenantId][key] = value;
    fs.writeFileSync(jsonPath, JSON.stringify(config, null, 2), 'utf-8');

    // 4. Log a critical audit record representing the state shift
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: actorId,
        eventKey: 'CIRCUIT_BREAKER_MUTED',
        recordType: 'SystemConfig',
        recordId: tenantId,
        newValues: {
          key,
          value,
          severity: 'CRITICAL',
          remarks: `Circuit breaker flipped dynamically by Super Admin. Module status: ${value ? 'TRIPPED/MUTED' : 'RESET/ACTIVE'}`,
          updatedBy: actorEmail,
        },
      },
    });

    console.log(`\n\x1b[33m⚡ CIRCUIT BREAKER PARAMETER FLIPPED SUCCESSFULLY\x1b[0m`);
    console.log(`   ├─ Tenant:   ${tenant.name} (${tenantId})`);
    console.log(`   ├─ Key:      ${key}`);
    console.log(`   ├─ Action:   ${value ? '🚨 TRIPPED (ON)' : '🟢 RESET (OFF)'}`);
    console.log(`   └─ Auditor:  Logged CRITICAL state shift under user [${actorEmail}]`);
    console.log(`================================================================================\n`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ [BREAKER_FAILED] Failsafe toggle execution aborted:`, error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
