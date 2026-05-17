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

describe('Cashier Voids Maker-Checker & Ledger (e2e)', () => {
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
      data: { name: `Void-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'Void Branch',
        code: `V-${randomUUID().substring(0, 4)}`,
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

  it('should process void approval, block self-approval, update ledger and closing totals', async () => {
    // 1. Open session as Cashier
    MockJwtAuthGuard.user.tenantId = tenantId;
    MockJwtAuthGuard.user.branchId = branchId;
    MockJwtAuthGuard.user.userId = cashierId;

    const sessionRes = await request(app.getHttpServer())
      .post('/api/v1/billing/sessions/open')
      .send({ branchId, openingBalance: 1000 })
      .expect(201);

    const sessionId = sessionRes.body.id;

    // Seed Patient, Order, Invoice
    const patientId = randomUUID();
    await prisma.patient.create({
      data: {
        id: patientId,
        tenantId,
        patientNumber: `PT-VOID-${randomUUID()}`,
        firstName: 'Jane',
        lastName: 'Doe',
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
        orderNumber: `ORD-VOID-${randomUUID()}`,
        status: 'PENDING_PAYMENT',
      },
    });

    const invoiceId = randomUUID();
    await prisma.invoice.create({
      data: {
        id: invoiceId,
        tenantId,
        orderId,
        invoiceNumber: `INV-VOID-${randomUUID()}`,
        totalAmount: 400,
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
        amount: 400,
        paymentMethod: 'CASH',
      })
      .expect(201);

    const paymentId = paymentRes.body.payment.id;

    // 2. Request Void as Cashier
    await request(app.getHttpServer())
      .post(`/api/v1/billing/payments/${paymentId}/void`)
      .send({ reason: 'Accidental charge' })
      .expect(201);

    // Assert that paymentReversal was created in PENDING state
    const reversal = await prisma.paymentReversal.findFirst({
      where: { paymentId },
    });
    expect(reversal).toBeDefined();
    expect(reversal?.status).toBe('PENDING');

    // Assert that cashier ledger entry has PAYMENT entry
    const initialLedger = await prisma.cashierLedgerEntry.findMany({
      where: { cashierSessionId: sessionId, type: 'PAYMENT' },
    });
    expect(initialLedger.length).toBe(1);
    expect(Number(initialLedger[0].amount)).toBe(400);

    // 3. Maker-checker self-approval check (Cashier tries to self-approve own void)
    await request(app.getHttpServer())
      .patch(`/api/v1/billing/payments/voids/${reversal?.id}/approve`)
      .send({ remarks: 'Self approve' })
      .expect(403); // Blocked

    // 4. Approve as Supervisor
    MockJwtAuthGuard.user.userId = supervisorId;

    await request(app.getHttpServer())
      .patch(`/api/v1/billing/payments/voids/${reversal?.id}/approve`)
      .send({ remarks: 'Looks correct' })
      .expect(200);

    // Verify database updates
    const updatedPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    expect(updatedPayment?.status).toBe('VOIDED');

    // Verify ledger entry for VOID is added
    const voidLedger = await prisma.cashierLedgerEntry.findFirst({
      where: { cashierSessionId: sessionId, type: 'VOID' },
    });
    expect(voidLedger).toBeDefined();
    expect(Number(voidLedger?.amount)).toBe(400);

    // Verify audit logs contain immutable VOID_APPROVED or equivalent applied logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        eventKey: { in: ['APPROVAL_APPROVED', 'PAYMENT_VOID_APPLIED'] },
      },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);

    // 5. Cashier session closing total is correct
    // Switch back to cashier to close session
    MockJwtAuthGuard.user.userId = cashierId;

    const closeRes = await request(app.getHttpServer())
      .patch(`/api/v1/billing/sessions/${sessionId}/close`)
      .send({ actualClosingBalance: 1000 }) // 1000 opening + 400 payment - 400 void = 1000
      .expect(200);

    expect(Number(closeRes.body.expectedCash)).toBe(1000);
    expect(closeRes.body.voids.length).toBe(1);
    expect(closeRes.body.voids[0].paymentId).toBe(paymentId);
  });

  afterAll(async () => {
    await app.close();
  });
});
