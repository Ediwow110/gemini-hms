import { Test } from '@nestjs/testing';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../src/audit/audit.module';
import { BillingModule } from '../src/billing/billing.module';
import { BillingService } from '../src/billing/billing.service';
import { NumberingModule } from '../src/numbering/numbering.module';
import { ApprovalsModule } from '../src/approvals/approvals.module';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

async function run() {
  console.log('--- STARTING STRESS TEST: PAYMENT IDEMPOTENCY CONCURRENCY ---');

  process.env.JWT_SECRET = 'test-secret-key-for-mfa-recovery-e2e-tests-long-enough';
  process.env.MASTER_MFA_KEY = 'master-mfa-key-for-encryption-long-enough';

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
      PrismaModule,
      AuditModule,
      NumberingModule,
      ApprovalsModule,
      BillingModule,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const billingService = app.get(BillingService);
  const prisma = app.get(PrismaService);

  // Setup seed data
  const tenantId = randomUUID();
  await prisma.tenant.create({ data: { id: tenantId, name: `Stress-Payment-${randomUUID()}` } });
  
  const branchId = randomUUID();
  await prisma.branch.create({
    data: {
      id: branchId,
      tenantId,
      name: 'Stress Branch',
      code: `S-${randomUUID().substring(0, 4)}`,
    }
  });

  const userId = randomUUID();
  await prisma.user.create({
    data: {
      id: userId,
      tenantId,
      email: `cashier-${randomUUID()}@hms.local`,
      passwordHash: 'not-needed',
      mfaEnabled: false,
    }
  });

  const patientId = randomUUID();
  await prisma.patient.create({
    data: {
      id: patientId,
      tenantId,
      patientNumber: `PT-STRESS-${randomUUID()}`,
      firstName: 'Jane',
      lastName: 'Doe',
      dob: new Date(),
    }
  });

  const orderId = randomUUID();
  await prisma.order.create({
    data: {
      id: orderId,
      tenantId,
      branchId,
      patientId,
      orderNumber: `ORD-STRESS-${randomUUID()}`,
      status: 'PENDING_PAYMENT',
    }
  });

  const invoiceId = randomUUID();
  const totalAmount = 1000;
  await prisma.invoice.create({
    data: {
      id: invoiceId,
      tenantId,
      orderId,
      invoiceNumber: `INV-STRESS-${randomUUID()}`,
      totalAmount,
      paidAmount: 0,
      status: 'UNPAID',
    }
  });

  // 1. Open cashier session
  console.log('Opening cashier session...');
  const cashierSession = await billingService.openSession(tenantId, userId, branchId, { branchId, openingBalance: 5000 });

  // 2. Prepare payload and key
  const idempotencyKey = randomUUID();
  const payload = {
    invoiceId,
    cashierSessionId: cashierSession.id,
    amount: totalAmount,
    paymentMethod: 'CASH',
  };

  console.log(`Firing 20 concurrent payment attempts under idempotencyKey: ${idempotencyKey}...`);

  const totalRequests = 20;
  const promises: Promise<any>[] = [];

  for (let i = 0; i < totalRequests; i++) {
    promises.push(
      billingService.postPayment(tenantId, userId, branchId, payload, idempotencyKey)
        .then(res => ({ success: true, replayed: (res as any)._replayed || false, data: res }))
        .catch(err => ({ success: false, status: err.status || 500, error: err.message || err }))
    );
  }

  const results = await Promise.all(promises);

  const newPaymentCount = results.filter(r => r.success && !r.replayed).length;
  const replayedCount = results.filter(r => r.success && r.replayed).length;
  const conflictCount = results.filter(r => !r.success && r.status === 409).length;
  const otherFailCount = results.filter(r => !r.success && r.status !== 409).length;

  console.log(`Results:`);
  console.log(`- New payments created: ${newPaymentCount}`);
  console.log(`- Replayed successful responses: ${replayedCount}`);
  console.log(`- Conflicting requests rejected (409): ${conflictCount}`);
  console.log(`- Other failures: ${otherFailCount}`);

  // Invariant checks
  const paymentsInDb = await prisma.payment.findMany({
    where: { cashierSessionId: cashierSession.id }
  });
  const invoiceAfter = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  });

  const exactOnePaymentRow = paymentsInDb.length === 1;
  const invoiceCorrectBalance = invoiceAfter !== null && Number(invoiceAfter.paidAmount) === totalAmount;
  const invoiceCorrectStatus = invoiceAfter !== null && invoiceAfter.status === 'PAID';

  const pass = exactOnePaymentRow && invoiceCorrectBalance && invoiceCorrectStatus && (newPaymentCount + replayedCount + conflictCount === totalRequests);

  const output = {
    testName: 'Payment Idempotency Concurrency Stress Test',
    timestamp: new Date().toISOString(),
    totalRequests,
    newPaymentCount,
    replayedCount,
    conflictCount,
    otherFailCount,
    invariants: {
      exactOnePaymentRow,
      invoiceCorrectBalance,
      invoiceCorrectStatus,
    },
    pass,
    details: results.map((r, i) => ({
      requestIndex: i,
      success: r.success,
      replayed: r.replayed || false,
      status: r.success ? 201 : r.status,
      error: r.error || null,
    })),
  };

  const outputPath = path.join(__dirname, '..', 'stress-payment-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Saved results to ${outputPath}`);
  console.log(`Verdict: ${pass ? 'PASS' : 'FAIL'}\n`);

  await app.close();

  if (!pass) {
    process.exit(1);
  }
}

run();
