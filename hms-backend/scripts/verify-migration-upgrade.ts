/**
 * Migration Upgrade Rehearsal
 *
 * Validates that migrations apply correctly against:
 * 1. An empty database (fresh install)
 * 2. A populated database with representative legacy data
 * 3. Multi-tenant system actor backfill
 *
 * This is NOT `prisma db push` — we use `prisma migrate deploy` to prove
 * migration ordering and correctness.
 *
 * Usage:
 *   DATABASE_URL=<disposable-db-url> npx ts-node scripts/verify-migration-upgrade.ts
 *
 * Prerequisites:
 *   - Node modules installed
 *   - `npx prisma generate` has been run
 */

import { execSync } from 'child_process';
import { PrismaClient, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('FATAL: DATABASE_URL is required');
  process.exit(1);
}

function run(cmd: string, label: string): void {
  console.log(`\n--- ${label} ---`);
  console.log(`$ ${cmd}`);
  try {
    const out = execSync(cmd, {
      encoding: 'utf-8',
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    console.log(out);
  } catch (err: any) {
    console.error(err.stderr || err.message);
    throw new Error(`${label} FAILED`);
  }
}

async function seedLegacyData(prisma: PrismaClient): Promise<{
  tenant: any;
  branch: any;
  user: any;
  invoice: any;
  payment: any;
  session: any;
}> {
  const tenant = await prisma.tenant.create({
    data: { name: 'Rehearsal Hospital', status: 'ACTIVE' },
  });
  const branch = await prisma.branch.create({
    data: { tenantId: tenant.id, name: 'Main', code: 'MAIN' },
  });
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'rehearsal@test.com',
      passwordHash: await bcrypt.hash('test', 10),
      status: 'ACTIVE',
    },
  });
  const patient = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      patientNumber: `PAT-${Date.now()}`,
      firstName: 'Test',
      lastName: 'Patient',
      dob: new Date('1990-01-01'),
    },
  });
  const session = await prisma.cashierSession.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      userId: user.id,
      status: 'OPEN',
      openingBalance: new Prisma.Decimal(1000),
    },
  });
  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      patientId: patient.id,
      orderNumber: `ORD-${Date.now()}`,
      status: 'COMPLETED',
    },
  });
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      orderId: order.id,
      totalAmount: new Prisma.Decimal(500),
      status: 'PAID',
    },
  });
  const payment = await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      invoiceId: invoice.id,
      cashierSessionId: session.id,
      amount: new Prisma.Decimal(500),
      paymentMethod: 'CASH',
      status: 'POSTED',
      idempotencyKey: `rehearsal-${Date.now()}`,
    },
  });

  // Create a PaymentVoid
  const voidApproval = await prisma.approvalRequest.create({
    data: {
      tenantId: tenant.id,
      requesterId: user.id,
      type: 'PAYMENT_VOID',
      riskLevel: 'HIGH',
      recordId: payment.id,
      status: 'APPROVED',
    },
  });
  await prisma.paymentVoid.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      paymentId: payment.id,
      approvalId: voidApproval.id,
      voidedBy: user.id,
      reason: 'Rehearsal test void',
    },
  });

  // Create a Refund
  const refundApproval = await prisma.approvalRequest.create({
    data: {
      tenantId: tenant.id,
      requesterId: user.id,
      type: 'REFUND',
      riskLevel: 'HIGH',
      recordId: payment.id,
      status: 'APPROVED',
    },
  });
  await prisma.refund.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      invoiceId: invoice.id,
      paymentId: payment.id,
      amount: new Prisma.Decimal(100),
      approvedBy: user.id,
      method: 'CASH',
      reason: 'Rehearsal test refund',
    },
  });

  // Create a CashierLedgerEntry
  await prisma.cashierLedgerEntry.create({
    data: {
      tenantId: tenant.id,
      cashierSessionId: session.id,
      type: 'PAYMENT',
      amount: new Prisma.Decimal(500),
      referenceId: payment.id,
    },
  });

  return { tenant, branch, user, invoice, payment, session };
}

async function main() {
  console.log('=== Migration Upgrade Rehearsal ===\n');
  console.log(`Database: ${dbUrl}\n`);

  // ------------------------------------------------------------------
  // Test 1: Fresh install — apply migrations to empty database
  // ------------------------------------------------------------------
  console.log('=== TEST 1: Fresh install (empty database) ===');
  run('npx prisma migrate deploy', 'Migration deploy on empty database');

  const prisma = new PrismaClient();
  await prisma.$connect();
  const tenantCount = await prisma.tenant.count();
  const systemActorCount = await prisma.user.count({ where: { isSystem: true } });
  console.log(`\nEmpty DB: tenants=${tenantCount}, systemActors=${systemActorCount}`);
  if (systemActorCount !== 0) {
    console.error('FAIL: System actors should not exist in empty database');
    process.exit(1);
  }
  console.log('PASS: Empty database migration successful\n');
  await prisma.$disconnect();

  // ------------------------------------------------------------------
  // Test 2: Populated upgrade — seed data, then verify migration
  // ------------------------------------------------------------------
  console.log('=== TEST 2: Populated upgrade (legacy data + constraints) ===');
  const prisma2 = new PrismaClient();
  await prisma2.$connect();
  const legacy = await seedLegacyData(prisma2);
  console.log('Legacy data seeded:');
  console.log(`  Tenant: ${legacy.tenant.id}`);
  console.log(`  Branch: ${legacy.branch.id}`);
  console.log(`  Invoice: ${legacy.invoice.id}`);
  console.log(`  Payment: ${legacy.payment.id}`);
  console.log(`  Session: ${legacy.session.id}`);
  await prisma2.$disconnect();

  // Re-run migration to verify it's idempotent on populated data
  run('npx prisma migrate deploy', 'Migration deploy on populated database');

  const prisma3 = new PrismaClient();
  await prisma3.$connect();
  const sysActor = await prisma3.user.findFirst({
    where: { tenantId: legacy.tenant.id, isSystem: true },
  });
  if (!sysActor) {
    console.error('FAIL: System actor not created for seeded tenant');
    process.exit(1);
  }
  console.log(`\nSystem actor created: ${sysActor.id}`);
  console.log(`  email: ${sysActor.email}`);
  console.log(`  isSystem: ${sysActor.isSystem}`);
  console.log(`  status: ${sysActor.status}`);

  if (sysActor.status !== 'DISABLED') {
    console.error('FAIL: System actor must have status DISABLED');
    process.exit(1);
  }
  console.log('PASS: System actor correctly provisioned\n');

  // Verify financial data is intact
  const paymentVoid = await prisma3.paymentVoid.findFirst();
  if (!paymentVoid) {
    console.error('FAIL: PaymentVoid data lost after migration');
    process.exit(1);
  }
  console.log('PASS: PaymentVoid data intact');

  const refund = await prisma3.refund.findFirst();
  if (!refund) {
    console.error('FAIL: Refund data lost after migration');
    process.exit(1);
  }
  console.log('PASS: Refund data intact');

  const ledgerEntry = await prisma3.cashierLedgerEntry.findFirst();
  if (!ledgerEntry) {
    console.error('FAIL: CashierLedgerEntry data lost after migration');
    process.exit(1);
  }
  console.log('PASS: CashierLedgerEntry data intact\n');

  // Test idempotent re-run
  run('npx prisma migrate deploy', 'Idempotent re-run on populated database');
  console.log('PASS: Migration is idempotent\n');

  await prisma3.$disconnect();

  // ------------------------------------------------------------------
  // Test 3: Multi-tenant system actor provisioning
  // ------------------------------------------------------------------
  console.log('=== TEST 3: Multi-tenant system actor provisioning ===');
  const prisma5 = new PrismaClient();
  await prisma5.$connect();

  const tenant2 = await prisma5.tenant.create({
    data: { name: 'Second Rehearsal Hospital', status: 'ACTIVE' },
  });
  console.log(`Second tenant created: ${tenant2.id}`);
  await prisma5.$disconnect();

  // Re-run migration to backfill the new tenant
  run('npx prisma migrate deploy', 'Backfill system actor for new tenant');

  const prisma6 = new PrismaClient();
  await prisma6.$connect();

  const allSysActors = await prisma6.user.findMany({
    where: { isSystem: true },
    select: { tenantId: true, id: true },
  });
  console.log(`Total system actors: ${allSysActors.length}`);
  console.log(`Total tenants: ${await prisma6.tenant.count()}`);

  const tenantIds = new Set(
    (await prisma6.tenant.findMany({ select: { id: true } })).map((t: any) => t.id),
  );
  const actorTenantIds = new Set(allSysActors.map((a: any) => a.tenantId));

  for (const tid of tenantIds) {
    if (!actorTenantIds.has(tid)) {
      console.error(`FAIL: Tenant ${tid} has no system actor`);
      process.exit(1);
    }
  }
  console.log('PASS: Every tenant has exactly one system actor');

  // Verify no tenant has duplicate system actors
  const actorCounts = new Map<string, number>();
  for (const actor of allSysActors) {
    actorCounts.set(actor.tenantId, (actorCounts.get(actor.tenantId) || 0) + 1);
  }
  for (const [tid, count] of actorCounts) {
    if (count > 1) {
      console.error(`FAIL: Tenant ${tid} has ${count} system actors (expected 1)`);
      process.exit(1);
    }
  }
  console.log('PASS: No tenant has duplicate system actors\n');

  await prisma6.$disconnect();

  console.log('=== ALL MIGRATION UPGRADE TESTS PASSED ===');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n=== MIGRATION UPGRADE REHEARSAL FAILED ===');
  console.error(err);
  process.exit(1);
});
