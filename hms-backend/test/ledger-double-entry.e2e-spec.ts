import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { BillingModule } from '../src/billing/billing.module';
import { LedgerModule } from '../src/ledger/ledger.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { MockJwtAuthGuard } from './helpers/mock-jwt-auth.guard';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { BranchGuard } from '../src/auth/guards/branch.guard';
import { randomUUID } from 'crypto';
import { NumberingModule } from '../src/numbering/numbering.module';
import { AuditModule } from '../src/audit/audit.module';
import { ApprovalsModule } from '../src/approvals/approvals.module';

describe('Ledger Double-Entry E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;
  let cashierId: string;
  let supervisorId: string;
  let patientId: string;
  let sessionId: string;

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
        LedgerModule,
      ],
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

    // Create unique tenant and branch
    const tenant = await prisma.tenant.create({
      data: { name: `Ledger-Tenant-${randomUUID()}` },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: {
        tenantId,
        name: 'Ledger Branch',
        code: `LED-${randomUUID().substring(0, 4)}`,
      },
    });
    branchId = branch.id;

    // Create cashier & supervisor users
    cashierId = randomUUID();
    await prisma.user.create({
      data: {
        id: cashierId,
        tenantId,
        email: `cashier-${randomUUID()}@hms.local`,
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    });

    supervisorId = randomUUID();
    await prisma.user.create({
      data: {
        id: supervisorId,
        tenantId,
        email: `supervisor-${randomUUID()}@hms.local`,
        passwordHash: 'dummy',
        status: 'ACTIVE',
      },
    });

    // Create Patient
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        patientNumber: `PT-LEDGER-${randomUUID()}`,
        firstName: 'Ledger',
        lastName: 'Patient',
        dob: new Date('1990-01-01'),
      },
    });
    patientId = patient.id;

    // Create Cashier Session
    const session = await prisma.cashierSession.create({
      data: {
        tenantId,
        branchId,
        userId: cashierId,
        openingBalance: 2000,
        status: 'OPEN',
      },
    });
    sessionId = session.id;
  });

  beforeEach(() => {
    MockJwtAuthGuard.user = {
      userId: cashierId,
      tenantId,
      branchId,
      roles: ['Super Admin'],
      permissions: ['*'],
      email: 'admin@hms.local',
    };
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should post ledger entries and aggregate correct account balances through payments, voids, and refunds', async () => {
    // 1. POST A PAYMENT
    // Switch auth to Cashier
    MockJwtAuthGuard.user = {
      userId: cashierId,
      tenantId,
      branchId,
      roles: ['Cashier'],
      permissions: ['*'],
      email: 'cashier@hms.local',
    };

    // Create order & invoice A (1000.00)
    const orderIdA = randomUUID();
    await prisma.order.create({
      data: {
        id: orderIdA,
        tenantId,
        branchId,
        patientId,
        orderNumber: `ORD-LED-A-${randomUUID()}`,
        status: 'PENDING_PAYMENT',
      },
    });

    const invoiceIdA = randomUUID();
    await prisma.invoice.create({
      data: {
        id: invoiceIdA,
        tenantId,
        orderId: orderIdA,
        invoiceNumber: `INV-LED-A-${randomUUID()}`,
        totalAmount: 1000.0,
        paidAmount: 0.0,
        status: 'UNPAID',
      },
    });

    const paymentResA = await request(app.getHttpServer())
      .post('/api/v1/billing/payments')
      .set('idempotency-key', randomUUID())
      .send({
        invoiceId: invoiceIdA,
        cashierSessionId: sessionId,
        amount: 1000.0,
        paymentMethod: 'CASH',
      })
      .expect(201);

    const paymentIdA = paymentResA.body.payment.id;
    expect(paymentIdA).toBeDefined();

    // Verify double-entry: DEBIT CASH / CREDIT REVENUE
    MockJwtAuthGuard.user.roles = ['Super Admin']; // Elevate to Super Admin to read entries
    const paymentLedgerEntries = await request(app.getHttpServer())
      .get(`/ledger/entries?referenceType=PAYMENT&referenceId=${paymentIdA}`)
      .expect(200);

    expect(paymentLedgerEntries.body.length).toBe(1);
    expect(paymentLedgerEntries.body[0].debitAccount).toBe('CASH');
    expect(paymentLedgerEntries.body[0].creditAccount).toBe('REVENUE');
    expect(paymentLedgerEntries.body[0].amount).toBe('1000');

    // 2. APPLY A VOID
    // Cashier requests Void
    MockJwtAuthGuard.user = {
      userId: cashierId,
      tenantId,
      branchId,
      roles: ['Cashier'],
      permissions: ['*'],
      email: 'cashier@hms.local',
    };

    await request(app.getHttpServer())
      .post(`/api/v1/billing/payments/${paymentIdA}/void`)
      .send({ reason: 'Incorrect patient billing' })
      .expect(201);

    const voidReversal = await prisma.paymentReversal.findFirst({
      where: { paymentId: paymentIdA, type: 'PAYMENT_VOID' },
    });
    expect(voidReversal).toBeDefined();
    const voidReversalId = voidReversal!.id;

    // Supervisor approves Void
    MockJwtAuthGuard.user = {
      userId: supervisorId,
      tenantId,
      branchId,
      roles: ['Super Admin'], // Using Super Admin to approve
      permissions: ['*'],
      email: 'admin@hms.local',
    };

    await request(app.getHttpServer())
      .patch(`/api/v1/billing/payments/voids/${voidReversalId}/approve`)
      .send({ remarks: 'Approve void' })
      .expect(200);

    // Verify double-entry for VOID: DEBIT REVENUE / CREDIT CASH
    const voidLedgerEntries = await request(app.getHttpServer())
      .get(`/ledger/entries?referenceType=VOID&referenceId=${voidReversalId}`)
      .expect(200);

    expect(voidLedgerEntries.body.length).toBe(1);
    expect(voidLedgerEntries.body[0].debitAccount).toBe('REVENUE');
    expect(voidLedgerEntries.body[0].creditAccount).toBe('CASH');
    expect(voidLedgerEntries.body[0].amount).toBe('1000');

    // 3. POST PAYMENT B
    MockJwtAuthGuard.user = {
      userId: cashierId,
      tenantId,
      branchId,
      roles: ['Cashier'],
      permissions: ['*'],
      email: 'cashier@hms.local',
    };

    // Create order & invoice B (1500.00)
    const orderIdB = randomUUID();
    await prisma.order.create({
      data: {
        id: orderIdB,
        tenantId,
        branchId,
        patientId,
        orderNumber: `ORD-LED-B-${randomUUID()}`,
        status: 'PENDING_PAYMENT',
      },
    });

    const invoiceIdB = randomUUID();
    await prisma.invoice.create({
      data: {
        id: invoiceIdB,
        tenantId,
        orderId: orderIdB,
        invoiceNumber: `INV-LED-B-${randomUUID()}`,
        totalAmount: 1500.0,
        paidAmount: 0.0,
        status: 'UNPAID',
      },
    });

    const paymentResB = await request(app.getHttpServer())
      .post('/api/v1/billing/payments')
      .set('idempotency-key', randomUUID())
      .send({
        invoiceId: invoiceIdB,
        cashierSessionId: sessionId,
        amount: 1500.0,
        paymentMethod: 'CASH',
      })
      .expect(201);

    const paymentIdB = paymentResB.body.payment.id;

    // 4. APPLY A REFUND
    // Cashier requests Refund
    await request(app.getHttpServer())
      .post(`/api/v1/billing/invoices/${invoiceIdB}/refund`)
      .send({
        paymentId: paymentIdB,
        amount: 400.0,
        reason: 'Partial discount refund',
      })
      .expect(201);

    const refundReversal = await prisma.paymentReversal.findFirst({
      where: { paymentId: paymentIdB, type: 'REFUND' },
    });
    expect(refundReversal).toBeDefined();
    const refundReversalId = refundReversal!.id;

    // Supervisor approves Refund
    MockJwtAuthGuard.user = {
      userId: supervisorId,
      tenantId,
      branchId,
      roles: ['Super Admin'],
      permissions: ['*'],
      email: 'admin@hms.local',
    };

    await request(app.getHttpServer())
      .patch(`/api/v1/billing/refunds/${refundReversalId}/approve`)
      .send({ remarks: 'Approve refund' })
      .expect(200);

    // Verify double-entry for REFUND: DEBIT REVENUE / CREDIT CASH
    const refundLedgerEntries = await request(app.getHttpServer())
      .get(
        `/ledger/entries?referenceType=REFUND&referenceId=${refundReversalId}`,
      )
      .expect(200);

    expect(refundLedgerEntries.body.length).toBe(1);
    expect(refundLedgerEntries.body[0].debitAccount).toBe('REVENUE');
    expect(refundLedgerEntries.body[0].creditAccount).toBe('CASH');
    expect(refundLedgerEntries.body[0].amount).toBe('400');

    // 5. GET ACCOUNT BALANCE
    // Get cash balance: sum of payments (1000 + 1500) minus voids (1000) minus refunds (400) = 1100
    const balanceRes = await request(app.getHttpServer())
      .get('/ledger/balance?account=CASH')
      .expect(200);

    expect(balanceRes.body.balance).toBe(1100);
  });
});
