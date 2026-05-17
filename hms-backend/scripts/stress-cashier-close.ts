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
  console.log('--- STARTING STRESS TEST: CASHIER SESSION CLOSE CONCURRENCY ---');

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
  await prisma.tenant.create({ data: { id: tenantId, name: `Stress-Cashier-${randomUUID()}` } });
  
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

  // 1. Open cashier session
  console.log('Opening cashier session...');
  const cashierSession = await billingService.openSession(tenantId, userId, branchId, { branchId, openingBalance: 5000 });

  // 2. Prepare payload
  const closeDto = {
    actualClosingBalance: 5000,
    remarks: 'Reconciled',
  };

  console.log(`Firing 2 concurrent closeSession attempts for sessionId: ${cashierSession.id}...`);

  const promises: Promise<any>[] = [];
  // Fire 2 concurrent close requests
  for (let i = 0; i < 2; i++) {
    promises.push(
      billingService.closeSession(tenantId, userId, branchId, cashierSession.id, closeDto)
        .then(res => ({ success: true, data: res }))
        .catch(err => ({ success: false, status: err.status || 400, error: err.message || err }))
    );
  }

  const results = await Promise.all(promises);

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  console.log(`Results:`);
  console.log(`- Succeeded closes: ${successCount}`);
  console.log(`- Failed closes: ${failureCount}`);
  results.forEach((r, idx) => {
    if (!r.success) {
      console.log(`  - Failed request ${idx + 1} with error: "${r.error}"`);
    }
  });

  // Invariant checks
  const sessionAfter = await prisma.cashierSession.findUnique({
    where: { id: cashierSession.id }
  });
  const closeAuditLogs = await prisma.auditLog.findMany({
    where: { recordId: cashierSession.id, eventKey: 'SESSION_CLOSED' }
  });

  const sessionIsClosed = sessionAfter !== null && sessionAfter.status === 'CLOSED';
  const exactOneAuditLog = closeAuditLogs.length === 1;

  const pass = successCount === 1 && failureCount === 1 && sessionIsClosed && exactOneAuditLog;

  const output = {
    testName: 'Cashier Session Close Concurrency Stress Test',
    timestamp: new Date().toISOString(),
    totalRequests: 2,
    successCount,
    failureCount,
    invariants: {
      sessionIsClosed,
      exactOneAuditLog,
    },
    pass,
    details: results.map((r, i) => ({
      requestIndex: i,
      success: r.success,
      error: r.error || null,
    })),
  };

  const outputPath = path.join(__dirname, '..', 'stress-cashier-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Saved results to ${outputPath}`);
  console.log(`Verdict: ${pass ? 'PASS' : 'FAIL'}\n`);

  await app.close();

  if (!pass) {
    process.exit(1);
  }
}

run();
