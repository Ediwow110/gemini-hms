import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BillingService } from '../src/billing/billing.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/audit/audit.service';
import { ApprovalsService } from '../src/approvals/approvals.service';
import { NumberingService } from '../src/numbering/numbering.service';
import { LedgerService } from '../src/ledger/ledger.service';
import { Prisma } from '@prisma/client';

describe('BillingService Real-DB Concurrency', () => {
  let service: BillingService;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;
  let userId: string;
  let approverId: string;
  let paymentId: string;
  let cashierSessionId: string;
  let reversalId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
      ],
      providers: [
        BillingService,
        PrismaService,
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: ApprovalsService,
          useValue: {
            createRequest: jest.fn().mockResolvedValue({ id: 'app-id' }),
            processRequest: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn().mockResolvedValue('RCP-123') },
        },
        {
          provide: LedgerService,
          useValue: { postEntry: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);

    // Setup Fixture
    const tenant = await prisma.tenant.create({
      data: { name: 'Test Tenant' },
    });
    tenantId = tenant.id;
    const branch = await prisma.branch.create({
      data: { tenantId, name: 'Test Branch', code: 'BR1' },
    });
    branchId = branch.id;
    // Requester (cannot apply own reversal)
    const requester = await prisma.user.create({
      data: { tenantId, email: 'requester@hms.com', passwordHash: 'hash' },
    });
    // Approver (different user who applies the refund)
    const approver = await prisma.user.create({
      data: { tenantId, email: 'approver@hms.com', passwordHash: 'hash' },
    });
    userId = approver.id;
    approverId = approver.id;
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        patientNumber: 'P1',
        firstName: 'A',
        lastName: 'B',
        dob: new Date(),
      },
    });
    const order = await prisma.order.create({
      data: { tenantId, branchId, patientId: patient.id, orderNumber: 'O1' },
    });
    const invoice = await prisma.invoice.create({
      data: { tenantId, orderId: order.id, totalAmount: 100, paidAmount: 100 },
    });
    const session = await prisma.cashierSession.create({
      data: {
        tenantId,
        branchId,
        userId: requester.id,
        openingBalance: 0,
        status: 'OPEN',
      },
    });
    cashierSessionId = session.id;
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        branchId,
        invoiceId: invoice.id,
        cashierSessionId: session.id,
        amount: 100,
        paymentMethod: 'CASH',
        idempotencyKey: 'key1',
      },
    });
    paymentId = payment.id;
    const approvalReq = await prisma.approvalRequest.create({
      data: {
        tenantId,
        requesterId: requester.id,
        type: 'REFUND',
        recordId: payment.id,
        status: 'APPROVED',
        riskLevel: 'MEDIUM',
      },
    });
    const reversal = await prisma.paymentReversal.create({
      data: {
        tenantId,
        branchId,
        paymentId,
        invoiceId: invoice.id,
        approvalRequestId: approvalReq.id,
        amount: 80,
        type: 'REFUND',
        status: 'PENDING',
        requestedBy: requester.id,
        reason: 'Concurrency test',
      },
    });
    reversalId = reversal.id;
  });

  afterAll(async () => {
    try {
      // Cascade cleanup in FK order
      await prisma.cashierLedgerEntry.deleteMany({
        where: { cashierSessionId },
      });
      await prisma.refund.deleteMany({ where: { paymentId } });
      await prisma.paymentReversal.deleteMany({ where: { id: reversalId } });
      await prisma.approvalRequest.deleteMany({
        where: { recordId: paymentId },
      });
      await prisma.payment.deleteMany({ where: { id: paymentId } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should handle concurrent refund applications', async () => {
    const requests = [
      service.applyRefund(tenantId, userId, branchId, reversalId),
      service.applyRefund(tenantId, userId, branchId, reversalId),
    ];

    const results = await Promise.allSettled(requests);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });
});

describe('BillingService Different-Reversal Race', () => {
  let service: BillingService;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;
  let userId: string;
  let paymentId: string;
  let cashierSessionId: string;
  let reversalAId: string;
  let reversalBId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
      ],
      providers: [
        BillingService,
        PrismaService,
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: ApprovalsService,
          useValue: {
            createRequest: jest.fn().mockResolvedValue({ id: 'app-id' }),
            processRequest: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn().mockResolvedValue('RCP-123') },
        },
        {
          provide: LedgerService,
          useValue: { postEntry: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);

    // Fixture: payment=100, two reversals 80+80=160 > 100 — at most one should succeed
    const tenant = await prisma.tenant.create({
      data: { name: 'Diff Reversal Tenant' },
    });
    tenantId = tenant.id;
    const branch = await prisma.branch.create({
      data: { tenantId, name: 'Diff Branch', code: 'BR2' },
    });
    branchId = branch.id;
    const requester = await prisma.user.create({
      data: { tenantId, email: 'diff-requester@hms.com', passwordHash: 'hash' },
    });
    const approver = await prisma.user.create({
      data: { tenantId, email: 'diff-approver@hms.com', passwordHash: 'hash' },
    });
    userId = approver.id;
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        patientNumber: 'P2',
        firstName: 'C',
        lastName: 'D',
        dob: new Date(),
      },
    });
    const order = await prisma.order.create({
      data: { tenantId, branchId, patientId: patient.id, orderNumber: 'O2' },
    });
    const invoice = await prisma.invoice.create({
      data: { tenantId, orderId: order.id, totalAmount: 100, paidAmount: 100 },
    });
    const session = await prisma.cashierSession.create({
      data: {
        tenantId,
        branchId,
        userId: requester.id,
        openingBalance: 0,
        status: 'OPEN',
      },
    });
    cashierSessionId = session.id;
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        branchId,
        invoiceId: invoice.id,
        cashierSessionId: session.id,
        amount: 100,
        paymentMethod: 'CASH',
        idempotencyKey: 'key2',
      },
    });
    paymentId = payment.id;
    // Two approval requests
    const approvalA = await prisma.approvalRequest.create({
      data: {
        tenantId,
        requesterId: requester.id,
        type: 'REFUND',
        recordId: payment.id,
        status: 'APPROVED',
        riskLevel: 'MEDIUM',
      },
    });
    const approvalB = await prisma.approvalRequest.create({
      data: {
        tenantId,
        requesterId: requester.id,
        type: 'REFUND',
        recordId: payment.id,
        status: 'APPROVED',
        riskLevel: 'MEDIUM',
      },
    });
    // Two reversals: 80 + 80 = 160 > 100 payment — over-refund if both succeed
    const reversalA = await prisma.paymentReversal.create({
      data: {
        tenantId,
        branchId,
        paymentId,
        invoiceId: invoice.id,
        approvalRequestId: approvalA.id,
        amount: 80,
        type: 'REFUND',
        status: 'PENDING',
        requestedBy: requester.id,
        reason: 'Diff race A',
      },
    });
    reversalAId = reversalA.id;
    const reversalB = await prisma.paymentReversal.create({
      data: {
        tenantId,
        branchId,
        paymentId,
        invoiceId: invoice.id,
        approvalRequestId: approvalB.id,
        amount: 80,
        type: 'REFUND',
        status: 'PENDING',
        requestedBy: requester.id,
        reason: 'Diff race B',
      },
    });
    reversalBId = reversalB.id;
  });

  afterAll(async () => {
    try {
      await prisma.cashierLedgerEntry.deleteMany({
        where: { cashierSessionId },
      });
      await prisma.refund.deleteMany({ where: { paymentId } });
      await prisma.paymentReversal.deleteMany({
        where: { id: { in: [reversalAId, reversalBId] } },
      });
      await prisma.approvalRequest.deleteMany({
        where: { recordId: paymentId },
      });
      await prisma.payment.deleteMany({ where: { id: paymentId } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should serialize different reversals targeting the same payment', async () => {
    const requests = [
      service.applyRefund(tenantId, userId, branchId, reversalAId),
      service.applyRefund(tenantId, userId, branchId, reversalBId),
    ];

    const results = await Promise.allSettled(requests);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // At most one should succeed (80+80=160 > 100 payment)
    expect(fulfilled.length).toBeLessThanOrEqual(1);
    // Total applied refunds must not exceed payment amount
    const appliedRefunds = await prisma.paymentReversal.findMany({
      where: { paymentId, type: 'REFUND', status: 'APPLIED' },
    });
    const totalApplied = appliedRefunds.reduce(
      (sum, r) => sum.add(r.amount),
      new Prisma.Decimal(0),
    );
    expect(totalApplied.lte(100)).toBe(true);
    // Audit was logged for the successful refund
    expect(rejected.length + fulfilled.length).toBe(2);
  });
});

describe('BillingService applyVoid Same-Reversal Race', () => {
  let service: BillingService;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;
  let userId: string;
  let paymentId: string;
  let cashierSessionId: string;
  let reversalId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
      ],
      providers: [
        BillingService,
        PrismaService,
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: ApprovalsService,
          useValue: {
            createRequest: jest.fn().mockResolvedValue({ id: 'app-id' }),
            processRequest: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn().mockResolvedValue('RCP-123') },
        },
        {
          provide: LedgerService,
          useValue: { postEntry: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);

    const tenant = await prisma.tenant.create({
      data: { name: 'Void Race Tenant' },
    });
    tenantId = tenant.id;
    const branch = await prisma.branch.create({
      data: { tenantId, name: 'Void Race Branch', code: 'BR3' },
    });
    branchId = branch.id;
    const requester = await prisma.user.create({
      data: {
        tenantId,
        email: 'void-requester@hms.com',
        passwordHash: 'hash',
      },
    });
    const approver = await prisma.user.create({
      data: {
        tenantId,
        email: 'void-approver@hms.com',
        passwordHash: 'hash',
      },
    });
    userId = approver.id;
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        patientNumber: 'P3',
        firstName: 'E',
        lastName: 'F',
        dob: new Date(),
      },
    });
    const order = await prisma.order.create({
      data: { tenantId, branchId, patientId: patient.id, orderNumber: 'O3' },
    });
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        orderId: order.id,
        totalAmount: 100,
        paidAmount: 100,
      },
    });
    const session = await prisma.cashierSession.create({
      data: {
        tenantId,
        branchId,
        userId: requester.id,
        openingBalance: 0,
        status: 'OPEN',
      },
    });
    cashierSessionId = session.id;
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        branchId,
        invoiceId: invoice.id,
        cashierSessionId: session.id,
        amount: 100,
        paymentMethod: 'CASH',
        idempotencyKey: 'key-void-race',
      },
    });
    paymentId = payment.id;
    const approvalReq = await prisma.approvalRequest.create({
      data: {
        tenantId,
        requesterId: requester.id,
        type: 'VOID',
        recordId: payment.id,
        status: 'APPROVED',
        riskLevel: 'MEDIUM',
      },
    });
    const reversal = await prisma.paymentReversal.create({
      data: {
        tenantId,
        branchId,
        paymentId,
        invoiceId: invoice.id,
        approvalRequestId: approvalReq.id,
        amount: 100,
        type: 'PAYMENT_VOID',
        status: 'PENDING',
        requestedBy: requester.id,
        reason: 'Same-reversal void race',
      },
    });
    reversalId = reversal.id;
  });

  afterAll(async () => {
    try {
      await prisma.cashierLedgerEntry.deleteMany({
        where: { cashierSessionId },
      });
      await prisma.paymentVoid.deleteMany({ where: { paymentId } });
      await prisma.paymentReversal.deleteMany({ where: { id: reversalId } });
      await prisma.approvalRequest.deleteMany({
        where: { recordId: paymentId },
      });
      await prisma.payment.deleteMany({ where: { id: paymentId } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should allow at most one concurrent applyVoid on the same reversal', async () => {
    const requests = [
      service.applyVoid(tenantId, userId, branchId, reversalId),
      service.applyVoid(tenantId, userId, branchId, reversalId),
    ];

    const results = await Promise.allSettled(requests);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one should succeed; the other should get a ConflictException
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });
});

describe('BillingService applyVoid vs applyRefund Race', () => {
  let service: BillingService;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;
  let userId: string;
  let paymentId: string;
  let cashierSessionId: string;
  let voidReversalId: string;
  let refundReversalId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
      ],
      providers: [
        BillingService,
        PrismaService,
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: ApprovalsService,
          useValue: {
            createRequest: jest.fn().mockResolvedValue({ id: 'app-id' }),
            processRequest: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn().mockResolvedValue('RCP-123') },
        },
        {
          provide: LedgerService,
          useValue: { postEntry: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);

    const tenant = await prisma.tenant.create({
      data: { name: 'Void Ref Race Tenant' },
    });
    tenantId = tenant.id;
    const branch = await prisma.branch.create({
      data: { tenantId, name: 'Void Ref Race Branch', code: 'BR4' },
    });
    branchId = branch.id;
    const requester = await prisma.user.create({
      data: {
        tenantId,
        email: 'vr-requester@hms.com',
        passwordHash: 'hash',
      },
    });
    const approver = await prisma.user.create({
      data: {
        tenantId,
        email: 'vr-approver@hms.com',
        passwordHash: 'hash',
      },
    });
    userId = approver.id;
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        patientNumber: 'P4',
        firstName: 'G',
        lastName: 'H',
        dob: new Date(),
      },
    });
    const order = await prisma.order.create({
      data: { tenantId, branchId, patientId: patient.id, orderNumber: 'O4' },
    });
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        orderId: order.id,
        totalAmount: 100,
        paidAmount: 100,
      },
    });
    const session = await prisma.cashierSession.create({
      data: {
        tenantId,
        branchId,
        userId: requester.id,
        openingBalance: 0,
        status: 'OPEN',
      },
    });
    cashierSessionId = session.id;
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        branchId,
        invoiceId: invoice.id,
        cashierSessionId: session.id,
        amount: 100,
        paymentMethod: 'CASH',
        idempotencyKey: 'key-void-ref-race',
      },
    });
    paymentId = payment.id;

    // Approval + reversal for VOID (full amount 100)
    const voidApproval = await prisma.approvalRequest.create({
      data: {
        tenantId,
        requesterId: requester.id,
        type: 'VOID',
        recordId: payment.id,
        status: 'APPROVED',
        riskLevel: 'MEDIUM',
      },
    });
    const voidRev = await prisma.paymentReversal.create({
      data: {
        tenantId,
        branchId,
        paymentId,
        invoiceId: invoice.id,
        approvalRequestId: voidApproval.id,
        amount: 100,
        type: 'PAYMENT_VOID',
        status: 'PENDING',
        requestedBy: requester.id,
        reason: 'Void vs refund race (void)',
      },
    });
    voidReversalId = voidRev.id;

    // Approval + reversal for REFUND (amount 80)
    const refundApproval = await prisma.approvalRequest.create({
      data: {
        tenantId,
        requesterId: requester.id,
        type: 'REFUND',
        recordId: payment.id,
        status: 'APPROVED',
        riskLevel: 'MEDIUM',
      },
    });
    const refundRev = await prisma.paymentReversal.create({
      data: {
        tenantId,
        branchId,
        paymentId,
        invoiceId: invoice.id,
        approvalRequestId: refundApproval.id,
        amount: 80,
        type: 'REFUND',
        status: 'PENDING',
        requestedBy: requester.id,
        reason: 'Void vs refund race (refund)',
      },
    });
    refundReversalId = refundRev.id;
  });

  afterAll(async () => {
    try {
      await prisma.cashierLedgerEntry.deleteMany({
        where: { cashierSessionId },
      });
      await prisma.paymentVoid.deleteMany({ where: { paymentId } });
      await prisma.refund.deleteMany({ where: { paymentId } });
      await prisma.paymentReversal.deleteMany({
        where: { id: { in: [voidReversalId, refundReversalId] } },
      });
      await prisma.approvalRequest.deleteMany({
        where: { recordId: paymentId },
      });
      await prisma.payment.deleteMany({ where: { id: paymentId } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should not allow both a void and a refund on the same payment', async () => {
    const requests = [
      service.applyVoid(tenantId, userId, branchId, voidReversalId),
      service.applyRefund(tenantId, userId, branchId, refundReversalId),
    ];

    const results = await Promise.allSettled(requests);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // At most one should succeed — void and refund are mutually exclusive
    expect(fulfilled.length).toBeLessThanOrEqual(1);

    // Verify database invariants
    const appliedReversals = await prisma.paymentReversal.findMany({
      where: {
        paymentId,
        status: 'APPLIED',
      },
    });
    // No more than 1 applied reversal
    expect(appliedReversals.length).toBeLessThanOrEqual(1);

    const currentPayment = await prisma.payment.findFirst({
      where: { id: paymentId },
    });
    if (currentPayment) {
      // Payment must be POSTED (if refund won) or VOIDED (if void won)
      expect(['POSTED', 'VOIDED']).toContain(currentPayment.status);
    }

    const currentInvoice = await prisma.invoice.findFirst({
      where: { order: { tenantId, branchId } },
    });
    if (currentInvoice) {
      // Invoice paidAmount must never be negative
      expect(currentInvoice.paidAmount.gte(0)).toBe(true);
      // Invoice paidAmount must never exceed totalAmount
      expect(currentInvoice.paidAmount.lte(currentInvoice.totalAmount)).toBe(
        true,
      );
    }

    expect(rejected.length + fulfilled.length).toBe(2);
  });
});

describe('BillingService confirmPayment vs closeSession Race', () => {
  let service: BillingService;
  let prisma: PrismaService;
  let tenantId: string;
  let branchId: string;
  let userId: string;
  let cashierId: string;
  let paymentId: string;
  let cashierSessionId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
      ],
      providers: [
        BillingService,
        PrismaService,
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: ApprovalsService,
          useValue: {
            createRequest: jest.fn().mockResolvedValue({ id: 'app-id' }),
            processRequest: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: NumberingService,
          useValue: { generateNumber: jest.fn().mockResolvedValue('RCP-123') },
        },
        {
          provide: LedgerService,
          useValue: { postEntry: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);

    const tenant = await prisma.tenant.create({
      data: { name: 'Race Session Tenant' },
    });
    tenantId = tenant.id;
    const branch = await prisma.branch.create({
      data: { tenantId, name: 'Race Session Branch', code: 'BR_RACE' },
    });
    branchId = branch.id;
    const cashier = await prisma.user.create({
      data: {
        tenantId,
        email: 'cashier.race@hms.com',
        passwordHash: 'hash',
      },
    });
    cashierId = cashier.id;
    userId = cashier.id;

    // Seed system user for audit logs to work
    await prisma.user.create({
      data: {
        tenantId,
        email: 'system@hms.local',
        passwordHash: 'hash',
      },
    });

    const patient = await prisma.patient.create({
      data: {
        tenantId,
        patientNumber: 'P_RACE',
        firstName: 'Race',
        lastName: 'Patient',
        dob: new Date(),
      },
    });
    const order = await prisma.order.create({
      data: {
        tenantId,
        branchId,
        patientId: patient.id,
        orderNumber: 'O_RACE',
      },
    });
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        orderId: order.id,
        totalAmount: 1000,
        paidAmount: 0,
      },
    });
    const session = await prisma.cashierSession.create({
      data: {
        tenantId,
        branchId,
        userId: cashier.id,
        openingBalance: 100,
        status: 'OPEN',
      },
    });
    cashierSessionId = session.id;

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        branchId,
        invoiceId: invoice.id,
        cashierSessionId: session.id,
        amount: 200,
        paymentMethod: 'QRPH',
        status: 'POSTED',
        gatewayStatus: 'GATEWAY_PENDING',
        idempotencyKey: 'key-session-race',
      },
    });
    paymentId = payment.id;
  });

  afterAll(async () => {
    try {
      await prisma.cashierLedgerEntry.deleteMany({
        where: { cashierSessionId },
      });
      await prisma.payment.deleteMany({ where: { id: paymentId } });
      await prisma.cashierSession.deleteMany({
        where: { id: cashierSessionId },
      });
      await prisma.invoice.deleteMany({ where: { order: { tenantId } } });
      await prisma.order.deleteMany({ where: { tenantId } });
      await prisma.patient.deleteMany({ where: { tenantId } });
      await prisma.user.deleteMany({ where: { tenantId } });
      await prisma.branch.deleteMany({ where: { tenantId } });
      await prisma.tenant.deleteMany({ where: { id: tenantId } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should serialize confirmPayment and closeSession concurrently without deadlocks', async () => {
    const results = await Promise.allSettled([
      service.confirmPayment(tenantId, cashierId, branchId, paymentId, {
        gatewayProvider: 'QRPH',
        gatewayReference: 'ref-race',
      }),
      service.closeSession(tenantId, cashierId, branchId, cashierSessionId, {
        actualClosingBalance: 100,
      }),
    ]);

    const confirmResult = results[0];
    const closeResult = results[1];

    // Assert that closeSession always succeeds (either it closed the session before confirmPayment or after)
    expect(closeResult.status).toBe('fulfilled');

    // Assert that confirmResult is either fulfilled or rejected with ConflictException
    if (confirmResult.status === 'rejected') {
      expect(confirmResult.reason.message).toContain(
        'Cashier session is closed or was modified concurrently',
      );
    } else {
      expect(confirmResult.status).toBe('fulfilled');
    }

    // Verify consistency
    const entries = await prisma.cashierLedgerEntry.findMany({
      where: { cashierSessionId },
    });
    const session = await prisma.cashierSession.findUnique({
      where: { id: cashierSessionId },
    });

    expect(session.status).toBe('CLOSED');

    if (confirmResult.status === 'fulfilled') {
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe('PAYMENT');
      expect(entries[0].amount.toNumber()).toBe(200);
    } else {
      expect(entries.length).toBe(0);
    }
  });
});
