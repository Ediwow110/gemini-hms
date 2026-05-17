import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { BillingModule } from '../src/billing/billing.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { NumberingModule } from '../src/numbering/numbering.module';
import { AuditModule } from '../src/audit/audit.module';
import { ApprovalsModule } from '../src/approvals/approvals.module';
import { seedUser } from './helpers/seed.helper';
import { randomUUID } from 'crypto';

describe('Refund Ledger & Maker-Checker (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tenantId: string;
  let branchId: string;
  let cashierId: string;
  let supervisorId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      'test-secret-key-for-e2e-tests-that-is-long-enough';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        PrismaModule,
        NumberingModule,
        AuditModule,
        ApprovalsModule,
        BillingModule,
      ],
      providers: [],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BranchGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalGuards(new MockJwtAuthGuard());
    await app.init();

    prisma = app.get(PrismaService);

    const tenant = await prisma.tenant.create({
      data: { name: `Refund-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'Refund Branch',
        code: `R-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;
    cashierId = '11111111-1111-4111-8111-111111111111';
    supervisorId = randomUUID();

    await seedUser(prisma, tenantId, 'cashier@hms.local');
    await prisma.user.create({
      data: {
        id: supervisorId,
        tenantId,
        email: 'supervisor@hms.local',
        passwordHash: 'dummy',
      },
    });
  });

  it('should process refund, enforce maker-checker, update invoice balance, and verify ledger/closing totals', async () => {
    // 1. Open session as Cashier
    MockJwtAuthGuard.user.tenantId = tenantId;
    MockJwtAuthGuard.user.branchId = branchId;
    MockJwtAuthGuard.user.userId = cashierId;

    const sessionRes = await request(app.getHttpServer())
      .post('/api/v1/billing/sessions/open')
      .send({ branchId, openingBalance: 2000 })
      .expect(201);

    const sessionId = sessionRes.body.id;

    // Seed Patient, Order, Invoice
    const patientId = randomUUID();
    await prisma.patient.create({
      data: {
        id: patientId,
        tenantId,
        patientNumber: `PT-REFUND-${randomUUID()}`,
        firstName: 'Bob',
        lastName: 'Smith',
        dob: new Date(),
      },
    });

    const orderId = randomUUID();
    await prisma.order.create({
      data: {
        id: orderId,
        tenantId,
        branchId,
        patientId,
        orderNumber: `ORD-REFUND-${randomUUID()}`,
        status: 'PENDING_PAYMENT',
      },
    });

    const invoiceId = randomUUID();
    await prisma.invoice.create({
      data: {
        id: invoiceId,
        tenantId,
        orderId,
        invoiceNumber: `INV-REFUND-${randomUUID()}`,
        totalAmount: 1000,
        paidAmount: 0,
        status: 'UNPAID',
      },
    });

    // Post Payment as cashier
    const paymentRes = await request(app.getHttpServer())
      .post('/api/v1/billing/payments')
      .set('idempotency-key', randomUUID())
      .send({
        invoiceId,
        cashierSessionId: sessionId,
        amount: 1000,
        paymentMethod: 'CASH',
      })
      .expect(201);

    const paymentId = paymentRes.body.payment.id;

    // Verify invoice is fully paid
    const paidInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    expect(paidInvoice?.status).toBe('PAID');
    expect(Number(paidInvoice?.paidAmount)).toBe(1000);

    // 2. Request Refund as Cashier
    await request(app.getHttpServer())
      .post(`/api/v1/billing/invoices/${invoiceId}/refund`)
      .send({
        paymentId,
        amount: 300,
        reason: 'Overcharged medical test fee',
      })
      .expect(201);

    // Assert that paymentReversal was created in PENDING state
    const reversal = await prisma.paymentReversal.findFirst({
      where: { paymentId, type: 'REFUND' },
    });
    expect(reversal).toBeDefined();
    expect(reversal?.status).toBe('PENDING');
    expect(Number(reversal?.amount)).toBe(300);

    // 3. Maker-checker self-approval check (Cashier tries to self-approve own refund)
    await request(app.getHttpServer())
      .patch(`/api/v1/billing/refunds/${reversal?.id}/approve`)
      .send({ remarks: 'Self approve' })
      .expect(403); // Blocked

    // 4. Approve as Supervisor
    MockJwtAuthGuard.user.userId = supervisorId;

    await request(app.getHttpServer())
      .patch(`/api/v1/billing/refunds/${reversal?.id}/approve`)
      .send({ remarks: 'Refund approved' })
      .expect(200);

    // Verify invoice balance is decremented
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    expect(updatedInvoice?.status).toBe('PARTIALLY_PAID');
    expect(Number(updatedInvoice?.paidAmount)).toBe(700);

    // Verify ledger entry for REFUND is added
    const refundLedger = await prisma.cashierLedgerEntry.findFirst({
      where: { cashierSessionId: sessionId, type: 'REFUND' },
    });
    expect(refundLedger).toBeDefined();
    expect(Number(refundLedger?.amount)).toBe(300);

    // Verify audit logs contain immutable REFUND_APPROVED or equivalent applied logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        eventKey: { in: ['APPROVAL_APPROVED', 'REFUND_APPLIED'] },
      },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);

    // 5. Cashier session closing total is correct
    // Switch back to cashier to close session
    MockJwtAuthGuard.user.userId = cashierId;

    const closeRes = await request(app.getHttpServer())
      .patch(`/api/v1/billing/sessions/${sessionId}/close`)
      .send({ actualClosingBalance: 2700 }) // 2000 opening + 1000 payment - 300 refund = 2700
      .expect(200);

    expect(Number(closeRes.body.expectedCash)).toBe(2700);
    expect(closeRes.body.refunds.length).toBe(1);
    expect(Number(closeRes.body.refunds[0].amount)).toBe(300);
  });

  afterAll(async () => {
    await app.close();
  });
});
