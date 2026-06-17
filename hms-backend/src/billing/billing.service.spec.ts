import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { NumberingService } from '../numbering/numbering.service';
import { LedgerService } from '../ledger/ledger.service';
import { computePaymentFingerprint } from './utils/idempotency';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('BillingService Reversals', () => {
  let service: BillingService;
  let prisma: any;
  let audit: any;
  let approvals: any;

  const mockTenantId = 'tenant-uuid';
  const mockUserId = 'user-uuid';
  const mockBranchId = 'branch-uuid';
  const mockPaymentId = 'payment-uuid';
  const mockInvoiceId = 'invoice-uuid';

  const createPrismaMock = () => {
    const mock: any = {
      payment: {
        findFirst: jest.fn(),
        create: jest
          .fn()
          .mockResolvedValue({ id: 'pay-temp', amount: new Prisma.Decimal(0) }),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      invoice: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue({
          id: 'inv-temp',
          totalAmount: new Prisma.Decimal(1000),
          paidAmount: new Prisma.Decimal(0),
          status: 'UNPAID',
          order: { id: 'o1', tenantId: mockTenantId, branchId: mockBranchId },
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'inv-temp',
          totalAmount: new Prisma.Decimal(1000),
          paidAmount: new Prisma.Decimal(0),
          status: 'UNPAID',
          order: { id: 'o1', tenantId: mockTenantId, branchId: mockBranchId },
        }),
      },
      order: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      idempotencyRecord: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'rec-temp' }),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      approvalRequest: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      paymentReversal: {
        create: jest.fn().mockResolvedValue({ id: 'rev-uuid' }),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      cashierSession: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'sess-temp',
          tenantId: mockTenantId,
          branchId: mockBranchId,
          userId: mockUserId,
          status: 'OPEN',
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
        create: jest.fn(),
      },
      paymentVoid: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      refund: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      cashierLedgerEntry: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => await cb(mock)),
    };
    return mock;
  };

  beforeEach(async () => {
    prisma = createPrismaMock();
    audit = { log: jest.fn().mockResolvedValue({}) };
    approvals = {
      createRequest: jest.fn().mockResolvedValue({ id: 'req-uuid' }),
      processRequest: jest.fn(),
    };
    const numbering = {
      generateNumber: jest.fn().mockResolvedValue('RCP-000001'),
    };
    const ledgerService = {
      postEntry: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: ApprovalsService, useValue: approvals },
        { provide: NumberingService, useValue: numbering },
        { provide: LedgerService, useValue: ledgerService },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  describe('getMyReversals', () => {
    it('returns reversals scoped to the requesting user', async () => {
      const mockRows = [
        {
          id: 'rev-1',
          type: 'REFUND',
          amount: new Prisma.Decimal(500),
          status: 'PENDING',
          reason: 'Duplicate charge',
          requestedAt: new Date('2026-06-13T10:14:00Z'),
          approvedAt: null,
          paymentId: mockPaymentId,
          payment: { receiptNumber: 'RCP-2026-5120' },
          invoice: {
            invoiceNumber: 'INV-2026-001',
            order: {
              patient: { firstName: 'Jonathan', lastName: 'Harker' },
            },
          },
        },
      ];

      prisma.paymentReversal.findMany.mockResolvedValue(mockRows);

      const result = await service.getMyReversals(
        mockTenantId,
        mockUserId,
        mockBranchId,
      );

      expect(prisma.paymentReversal.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          branchId: mockBranchId,
          requestedBy: mockUserId,
        },
        include: {
          payment: { select: { receiptNumber: true } },
          invoice: {
            select: {
              invoiceNumber: true,
              order: {
                select: {
                  patient: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      });

      expect(result).toEqual([
        {
          id: 'rev-1',
          type: 'REFUND',
          amount: 500,
          status: 'PENDING',
          reason: 'Duplicate charge',
          requestedAt: new Date('2026-06-13T10:14:00Z'),
          approvedAt: null,
          paymentId: mockPaymentId,
          receiptNumber: 'RCP-2026-5120',
          invoiceNumber: 'INV-2026-001',
          patientName: 'Jonathan Harker',
        },
      ]);
    });

    it('returns empty array when user has no reversals', async () => {
      prisma.paymentReversal.findMany.mockResolvedValue([]);

      const result = await service.getMyReversals(
        mockTenantId,
        mockUserId,
        mockBranchId,
      );

      expect(result).toEqual([]);
    });

    it('maps null patients gracefully', async () => {
      const mockRows = [
        {
          id: 'rev-2',
          type: 'PAYMENT_VOID',
          amount: new Prisma.Decimal(1000),
          status: 'APPLIED',
          reason: 'Wrong amount',
          requestedAt: new Date(),
          approvedAt: new Date(),
          paymentId: 'other-pay',
          payment: { receiptNumber: null },
          invoice: { invoiceNumber: null, order: null },
        },
      ];

      prisma.paymentReversal.findMany.mockResolvedValue(mockRows);

      const result = await service.getMyReversals(
        mockTenantId,
        mockUserId,
        mockBranchId,
      );

      expect(result).toEqual([
        {
          id: 'rev-2',
          type: 'PAYMENT_VOID',
          amount: 1000,
          status: 'APPLIED',
          reason: 'Wrong amount',
          requestedAt: expect.any(Date),
          approvedAt: expect.any(Date),
          paymentId: 'other-pay',
          receiptNumber: null,
          invoiceNumber: null,
          patientName: null,
        },
      ]);
    });
  });

  describe('requestRefund', () => {
    const validRefundDto = {
      paymentId: mockPaymentId,
      amount: 100,
      reason: 'Customer overpaid',
    };

    it('should reject blank or missing reason', async () => {
      const dto = { ...validRefundDto, reason: ' ' };
      await expect(
        service.requestRefund(mockTenantId, mockUserId, mockBranchId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject zero or negative amount', async () => {
      const zeroDto = { ...validRefundDto, amount: 0 };
      const negDto = { ...validRefundDto, amount: -10 };
      await expect(
        service.requestRefund(mockTenantId, mockUserId, mockBranchId, zeroDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.requestRefund(mockTenantId, mockUserId, mockBranchId, negDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject amount greater than payment amount', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: mockPaymentId,
        amount: 50,
        status: 'POSTED',
        cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
        invoice: { id: mockInvoiceId },
      });

      await expect(
        service.requestRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          validRefundDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject nonexistent payment or wrong scope', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);
      await expect(
        service.requestRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          validRefundDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject non-POSTED payments', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: mockPaymentId,
        amount: 200,
        status: 'VOIDED',
        cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
      });

      await expect(
        service.requestRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          validRefundDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate pending refund requests', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: mockPaymentId,
        amount: 200,
        status: 'POSTED',
        cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
      });
      prisma.approvalRequest.findFirst.mockResolvedValue({
        id: 'req-1',
        status: 'PENDING',
        type: 'REFUND',
      });

      await expect(
        service.requestRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          validRefundDto,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create ApprovalRequest with correct structured metadata and audit event', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: mockPaymentId,
        amount: 200,
        status: 'POSTED',
        cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
        invoice: { id: mockInvoiceId },
      });
      prisma.approvalRequest.findFirst.mockResolvedValue(null);
      prisma.paymentReversal.findMany.mockResolvedValue([]);

      const result = await service.requestRefund(
        mockTenantId,
        mockUserId,
        mockBranchId,
        validRefundDto,
      );

      expect(result).toEqual({ id: 'req-uuid' });
      expect(approvals.createRequest).toHaveBeenCalledWith(
        mockTenantId,
        mockUserId,
        expect.objectContaining({
          type: 'REFUND',
          recordId: mockPaymentId,
          details: expect.objectContaining({
            action: 'REFUND',
            paymentId: mockPaymentId,
            amount: 100,
            tenantId: mockTenantId,
            branchId: mockBranchId,
            requesterId: mockUserId,
          }),
        }),
        expect.anything(),
      );
      expect(prisma.paymentReversal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paymentId: mockPaymentId,
          amount: 100,
          type: 'REFUND',
          status: 'PENDING',
        }),
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'REFUND_REQUESTED',
          recordType: 'Payment',
          recordId: mockPaymentId,
        }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should reject refund if amount exceeds remaining reversible amount', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: mockPaymentId,
        amount: 200,
        status: 'POSTED',
        cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
        invoice: { id: mockInvoiceId },
      });
      prisma.paymentReversal.findMany.mockResolvedValue([
        { amount: 150, status: 'APPLIED' },
      ]);

      await expect(
        service.requestRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          validRefundDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not mutate Payment or Invoice', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: mockPaymentId,
        amount: 200,
        status: 'POSTED',
        cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
      });
      prisma.approvalRequest.findFirst.mockResolvedValue(null);

      await service.requestRefund(
        mockTenantId,
        mockUserId,
        mockBranchId,
        validRefundDto,
      );

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('should reject refund for QRPH payment with GATEWAY_PENDING', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: mockPaymentId,
        amount: 200,
        status: 'POSTED',
        gatewayProvider: 'QRPH',
        gatewayStatus: 'GATEWAY_PENDING',
        cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
      });

      await expect(
        service.requestRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          validRefundDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject refund for QRPH payment with GATEWAY_FAILED', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: mockPaymentId,
        amount: 200,
        status: 'POSTED',
        gatewayProvider: 'QRPH',
        gatewayStatus: 'GATEWAY_FAILED',
        cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
      });

      await expect(
        service.requestRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          validRefundDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject refund for QRPH payment with GATEWAY_EXPIRED', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: mockPaymentId,
        amount: 200,
        status: 'POSTED',
        gatewayProvider: 'QRPH',
        gatewayStatus: 'GATEWAY_EXPIRED',
        cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
      });

      await expect(
        service.requestRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          validRefundDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('applyRefund', () => {
    const mockReversalId = 'rev-uuid';
    const mockApprovalId = 'app-uuid';

    const mockReversal = {
      id: mockReversalId,
      tenantId: mockTenantId,
      branchId: mockBranchId,
      paymentId: mockPaymentId,
      invoiceId: mockInvoiceId,
      approvalRequestId: mockApprovalId,
      amount: new Prisma.Decimal(100),
      type: 'REFUND',
      status: 'PENDING',
    };

    const mockApproval = {
      id: mockApprovalId,
      status: 'APPROVED',
      requesterId: 'other-user',
    };

    const mockPayment = {
      id: mockPaymentId,
      amount: new Prisma.Decimal(200),
      status: 'POSTED',
    };

    const mockInvoice = {
      id: mockInvoiceId,
      paidAmount: new Prisma.Decimal(200),
      totalAmount: new Prisma.Decimal(500),
      status: 'PARTIALLY_PAID',
    };

    it('should apply valid refund and update invoice', async () => {
      prisma.paymentReversal.findFirst
        .mockResolvedValueOnce(mockReversal) // first call: reversal
        .mockResolvedValueOnce(null); // second call: void check

      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst
        .mockResolvedValueOnce(mockInvoice) // 1st: outside tx
        .mockResolvedValueOnce(mockInvoice) // 2nd: inside tx re-read (fresh paidAmount)
        .mockResolvedValueOnce({
          // 3rd: after invoice update
          ...mockInvoice,
          paidAmount: new Prisma.Decimal(100),
          status: 'PARTIALLY_PAID',
        });
      prisma.paymentReversal.findMany.mockResolvedValue([]);
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });
      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
      prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.applyRefund(
        mockTenantId,
        mockUserId,
        mockBranchId,
        mockReversalId,
      );

      expect(result.reversal.status).toBe('APPLIED');
      expect(result.invoice.paidAmount).toEqual(new Prisma.Decimal(100));
      expect(prisma.paymentReversal.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: mockReversalId,
          tenantId: mockTenantId,
          branchId: mockBranchId,
          status: 'PENDING',
        }),
        data: expect.any(Object),
      });
      expect(prisma.invoice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: mockInvoiceId,
            order: { tenantId: mockTenantId, branchId: mockBranchId },
            archivedAt: null,
          },
        }),
      );
      expect(prisma.approvalRequest.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockApprovalId,
          tenantId: mockTenantId,
          status: 'APPROVED',
        },
        data: { status: 'APPLIED' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'REFUND_APPLIED',
          recordId: mockReversalId,
        }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should reject if reversal is not a refund', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValueOnce({
        ...mockReversal,
        type: 'PAYMENT_VOID',
      });

      await expect(
        service.applyRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if reversal is not PENDING', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValueOnce({
        ...mockReversal,
        status: 'APPLIED',
      });

      await expect(
        service.applyRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject if approval request is not APPROVED', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValueOnce(mockReversal);
      prisma.approvalRequest.findFirst.mockResolvedValue({
        ...mockApproval,
        status: 'PENDING',
      });

      await expect(
        service.applyRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if applicant is the requester', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValueOnce(mockReversal);
      prisma.approvalRequest.findFirst.mockResolvedValue({
        ...mockApproval,
        requesterId: mockUserId,
      });

      await expect(
        service.applyRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if refund exceeds remaining balance', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValueOnce(mockReversal);
      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      // findMany includes both existing and the just-applied reversal (amount=100)
      prisma.paymentReversal.findMany.mockResolvedValue([
        { amount: new Prisma.Decimal(150), status: 'APPLIED' },
        { amount: new Prisma.Decimal(100), status: 'APPLIED' },
      ]);
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.applyRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if a void has already been applied', async () => {
      prisma.paymentReversal.findFirst
        .mockResolvedValueOnce(mockReversal) // first call: reversal
        .mockResolvedValueOnce({
          // second call: void check
          id: 'void-id',
          type: 'PAYMENT_VOID',
          status: 'APPLIED',
        });
      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.applyRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should recalculate invoice status correctly (to UNPAID)', async () => {
      prisma.paymentReversal.findFirst
        .mockResolvedValueOnce(mockReversal)
        .mockResolvedValueOnce(null);

      const lowPaidInvoice = {
        ...mockInvoice,
        paidAmount: new Prisma.Decimal(100),
      };
      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst
        .mockResolvedValueOnce(lowPaidInvoice) // 1st: outside tx
        .mockResolvedValueOnce(lowPaidInvoice) // 2nd: inside tx re-read (fresh paidAmount)
        .mockResolvedValueOnce({
          // 3rd: after invoice update
          ...lowPaidInvoice,
          paidAmount: new Prisma.Decimal(0),
          status: 'UNPAID',
        });
      prisma.paymentReversal.findMany.mockResolvedValue([]);
      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
      prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.applyRefund(
        mockTenantId,
        mockUserId,
        mockBranchId,
        mockReversalId,
      );

      expect(result.invoice.status).toBe('UNPAID');
    });

    it('should reject applyRefund for QRPH payment with GATEWAY_PENDING', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValue(mockReversal);
      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        gatewayProvider: 'QRPH',
        gatewayStatus: 'GATEWAY_PENDING',
      });

      await expect(
        service.applyRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject applyRefund for QRPH payment with GATEWAY_FAILED', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValue(mockReversal);
      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        gatewayProvider: 'QRPH',
        gatewayStatus: 'GATEWAY_FAILED',
      });

      await expect(
        service.applyRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow applyRefund for confirmed QRPH payment', async () => {
      prisma.paymentReversal.findFirst
        .mockResolvedValueOnce(mockReversal)
        .mockResolvedValueOnce(null);
      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        gatewayProvider: 'QRPH',
        gatewayStatus: 'GATEWAY_CONFIRMED',
      });
      prisma.invoice.findFirst
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce({
          ...mockInvoice,
          paidAmount: new Prisma.Decimal(100),
          status: 'PARTIALLY_PAID',
        });
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });
      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
      prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.paymentReversal.findMany.mockResolvedValue([]);

      await expect(
        service.applyRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('applyReversal', () => {
    it('should dispatch to applyRefund if type is REFUND', async () => {
      const mockResult = {
        reversal: {
          id: 'test',
          type: 'REFUND',
          status: 'APPLIED',
          reason: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
          tenantId: 'test',
          branchId: 'test',
          paymentId: 'test',
          invoiceId: 'test',
          approvalRequestId: 'test',
          amount: new Prisma.Decimal(10),
          requestedBy: 'test',
          approvedBy: null,
          appliedBy: 'test',
          requestedAt: new Date(),
          approvedAt: null,
          appliedAt: new Date(),
        },
        invoice: {
          id: 'test',
          orderId: 'test',
          invoiceNumber: null,
          totalAmount: new Prisma.Decimal(10),
          paidAmount: new Prisma.Decimal(10),
          status: 'PAID',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const spy = jest
        .spyOn(service, 'applyRefund')
        .mockResolvedValue(mockResult as any);
      prisma.paymentReversal.findFirst.mockResolvedValue({
        type: 'REFUND',
      });
      await service.applyReversal('tenant', 'user', 'branch', 'rev-id');
      expect(spy).toHaveBeenCalledWith('tenant', 'user', 'branch', 'rev-id');
      spy.mockRestore();
    });

    it('should dispatch to applyVoid if type is PAYMENT_VOID', async () => {
      const mockResult = {
        reversal: {
          id: 'test',
          type: 'PAYMENT_VOID',
          status: 'APPLIED',
          reason: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
          tenantId: 'test',
          branchId: 'test',
          paymentId: 'test',
          invoiceId: 'test',
          approvalRequestId: 'test',
          amount: new Prisma.Decimal(10),
          requestedBy: 'test',
          approvedBy: null,
          appliedBy: 'test',
          requestedAt: new Date(),
          approvedAt: null,
          appliedAt: new Date(),
        },
        invoice: {
          id: 'test',
          orderId: 'test',
          invoiceNumber: null,
          totalAmount: new Prisma.Decimal(10),
          paidAmount: new Prisma.Decimal(0),
          status: 'UNPAID',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const spy = jest
        .spyOn(service, 'applyVoid')
        .mockResolvedValue(mockResult as any);
      prisma.paymentReversal.findFirst.mockResolvedValue({
        type: 'PAYMENT_VOID',
      });
      await service.applyReversal('tenant', 'user', 'branch', 'rev-id');
      expect(spy).toHaveBeenCalledWith('tenant', 'user', 'branch', 'rev-id');
      spy.mockRestore();
    });

    it('should throw BadRequestException if type is unknown', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValue({
        type: 'UNKNOWN',
      });
      await expect(
        service.applyReversal('tenant', 'user', 'branch', 'rev-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if reversal not found', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValue(null);
      await expect(
        service.applyReversal('tenant', 'user', 'branch', 'rev-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('applyVoid', () => {
    const mockReversalId = 'rev-uuid';
    const mockApprovalId = 'app-uuid';

    const mockReversal = {
      id: mockReversalId,
      tenantId: mockTenantId,
      branchId: mockBranchId,
      paymentId: mockPaymentId,
      invoiceId: mockInvoiceId,
      approvalRequestId: mockApprovalId,
      amount: new Prisma.Decimal(200),
      type: 'PAYMENT_VOID',
      status: 'PENDING',
    };

    const mockApproval = {
      id: mockApprovalId,
      status: 'APPROVED',
      requesterId: 'other-user',
    };

    const mockPayment = {
      id: mockPaymentId,
      amount: new Prisma.Decimal(200),
      status: 'POSTED',
    };

    const mockInvoice = {
      id: mockInvoiceId,
      paidAmount: new Prisma.Decimal(200),
      totalAmount: new Prisma.Decimal(500),
      status: 'PARTIALLY_PAID',
    };

    it('should apply valid void, update payment, and update invoice', async () => {
      prisma.paymentReversal.findFirst
        .mockResolvedValueOnce(mockReversal) // 1. fetch reversal
        .mockResolvedValueOnce(null) // inside tx: otherVoid
        .mockResolvedValueOnce(null); // inside tx: refundReversal

      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst
        .mockResolvedValueOnce(mockInvoice) // 1. pre-tx fetch
        .mockResolvedValueOnce(mockInvoice) // 2. inside-tx re-read after lock
        .mockResolvedValueOnce({
          // 3. post-update refreshed
          ...mockInvoice,
          paidAmount: new Prisma.Decimal(0),
          status: 'UNPAID',
        });
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });

      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });
      prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.applyVoid(
        mockTenantId,
        mockUserId,
        mockBranchId,
        mockReversalId,
      );

      expect(result.reversal.status).toBe('APPLIED');
      expect(result.invoice.paidAmount).toEqual(new Prisma.Decimal(0));
      expect(result.invoice.status).toBe('UNPAID');
      expect(prisma.paymentReversal.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: mockReversalId,
          tenantId: mockTenantId,
          branchId: mockBranchId,
          status: 'PENDING',
        }),
        data: expect.any(Object),
      });
      expect(prisma.invoice.updateMany).toHaveBeenCalled();
      // First payment.updateMany call is the lock (updatedAt); second is status→VOIDED
      expect(prisma.payment.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: mockPaymentId, status: 'POSTED', archivedAt: null },
        data: { updatedAt: expect.any(Date) },
      });
      expect(prisma.payment.updateMany).toHaveBeenNthCalledWith(2, {
        where: {
          id: mockPaymentId,
          status: 'POSTED',
          cashierSession: {
            tenantId: mockTenantId,
            branchId: mockBranchId,
          },
          archivedAt: null,
        },
        data: { status: 'VOIDED' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'PAYMENT_VOID_APPLIED',
          recordId: mockReversalId,
          newValues: expect.objectContaining({
            paymentStatus: 'VOIDED',
          }),
        }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should reject if reversal is not a void', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValueOnce({
        ...mockReversal,
        type: 'REFUND',
      });

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if reversal is not PENDING', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValueOnce({
        ...mockReversal,
        status: 'APPLIED',
      });

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject if approval request is not APPROVED', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValueOnce(mockReversal);
      prisma.approvalRequest.findFirst.mockResolvedValue({
        ...mockApproval,
        status: 'PENDING',
      });

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if applicant is the requester', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValueOnce(mockReversal);
      prisma.approvalRequest.findFirst.mockResolvedValue({
        ...mockApproval,
        requesterId: mockUserId,
      });

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if payment is not POSTED', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValueOnce(mockReversal);
      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: 'VOIDED',
      });

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate apply if conditional update fails', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValueOnce(mockReversal);
      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 0 }); // duplicate or race

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject if another void is already applied or pending', async () => {
      prisma.paymentReversal.findFirst
        .mockResolvedValueOnce(mockReversal) // 1. fetch reversal
        .mockResolvedValueOnce({
          id: 'other-void',
          type: 'PAYMENT_VOID',
          status: 'PENDING',
        }); // inside tx: otherVoid

      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject if any refund is already applied or pending', async () => {
      prisma.paymentReversal.findFirst
        .mockResolvedValueOnce(mockReversal) // 1. fetch reversal
        .mockResolvedValueOnce(null) // inside tx: otherVoid
        .mockResolvedValueOnce({
          id: 'refund',
          type: 'REFUND',
          status: 'APPLIED',
        }); // inside tx: refundReversal

      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject if voiding would cause negative invoice paidAmount', async () => {
      prisma.paymentReversal.findFirst
        .mockResolvedValueOnce(mockReversal)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      const lowPaidInvoice = {
        ...mockInvoice,
        paidAmount: new Prisma.Decimal(100), // void amount is 200
      };
      prisma.invoice.findFirst.mockResolvedValue(lowPaidInvoice);
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject applyVoid for QRPH payment with GATEWAY_PENDING', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValue(mockReversal);
      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        gatewayProvider: 'QRPH',
        gatewayStatus: 'GATEWAY_PENDING',
      });

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject applyVoid for QRPH payment with GATEWAY_FAILED', async () => {
      prisma.paymentReversal.findFirst.mockResolvedValue(mockReversal);
      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        gatewayProvider: 'QRPH',
        gatewayStatus: 'GATEWAY_FAILED',
      });

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow applyVoid for confirmed QRPH payment', async () => {
      prisma.paymentReversal.findFirst
        .mockResolvedValueOnce(mockReversal)
        .mockResolvedValueOnce(null);
      prisma.approvalRequest.findFirst.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        gatewayProvider: 'QRPH',
        gatewayStatus: 'GATEWAY_CONFIRMED',
      });
      prisma.invoice.findFirst
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce({
          ...mockInvoice,
          paidAmount: new Prisma.Decimal(0),
          status: 'PAID',
        });
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });
      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
      prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.paymentReversal.findMany.mockResolvedValue([]);
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.applyVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockReversalId,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('closeSession reporting reconciliation', () => {
    const sessionId = 'session-123';
    const mockSession = {
      id: sessionId,
      tenantId: mockTenantId,
      userId: mockUserId,
      branchId: mockBranchId,
      status: 'OPEN',
      openingBalance: new Prisma.Decimal(100),
      payments: [],
    };

    it('should exclude VOIDED payments from expectedCash calculation', async () => {
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.cashierSession.findFirst
        .mockResolvedValueOnce({
          ...mockSession,
          payments: [
            {
              amount: new Prisma.Decimal(50),
              paymentMethod: 'CASH',
              status: 'POSTED',
              reversals: [],
            },
            {
              amount: new Prisma.Decimal(200),
              paymentMethod: 'CASH',
              status: 'VOIDED',
              reversals: [],
            },
          ],
        })
        .mockResolvedValueOnce({
          ...mockSession,
          status: 'CLOSED',
          closingBalance: new Prisma.Decimal(150),
          closedAt: new Date(),
        });

      const dto = { actualClosingBalance: 150, remarks: '' };
      await service.closeSession(
        mockTenantId,
        mockUserId,
        mockBranchId,
        sessionId,
        dto,
      );

      expect(prisma.cashierSession.updateMany).toHaveBeenCalledWith({
        where: {
          id: sessionId,
          tenantId: mockTenantId,
          branchId: mockBranchId,
          userId: mockUserId,
          status: 'OPEN',
        },
        data: expect.objectContaining({
          closingBalance: 150,
          status: 'CLOSED',
        }),
      });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'SESSION_CLOSED',
          newValues: expect.objectContaining({
            expectedCash: 150,
            variance: 0,
          }),
        }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should subtract APPLIED REFUND reversals from expectedCash calculation', async () => {
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.cashierSession.findFirst
        .mockResolvedValueOnce({
          ...mockSession,
          payments: [
            {
              amount: new Prisma.Decimal(100),
              paymentMethod: 'CASH',
              status: 'POSTED',
              reversals: [{ amount: new Prisma.Decimal(30), type: 'REFUND' }],
            },
          ],
        })
        .mockResolvedValueOnce({
          ...mockSession,
          status: 'CLOSED',
          closingBalance: new Prisma.Decimal(170),
          closedAt: new Date(),
        });

      const dto = { actualClosingBalance: 170, remarks: '' };
      await service.closeSession(
        mockTenantId,
        mockUserId,
        mockBranchId,
        sessionId,
        dto,
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          newValues: expect.objectContaining({
            expectedCash: 170,
            variance: 0,
          }),
        }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should NOT subtract non-refund reversals from expectedCash', async () => {
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.cashierSession.findFirst
        .mockResolvedValueOnce({
          ...mockSession,
          payments: [
            {
              amount: new Prisma.Decimal(100),
              paymentMethod: 'CASH',
              status: 'POSTED',
              reversals: [
                { amount: new Prisma.Decimal(30), type: 'PAYMENT_VOID' },
              ],
            },
          ],
        })
        .mockResolvedValueOnce({
          ...mockSession,
          status: 'CLOSED',
          closingBalance: new Prisma.Decimal(200),
          closedAt: new Date(),
        });

      const dto = { actualClosingBalance: 200, remarks: '' };
      await service.closeSession(
        mockTenantId,
        mockUserId,
        mockBranchId,
        sessionId,
        dto,
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          newValues: expect.objectContaining({
            expectedCash: 200,
            variance: 0,
          }),
        }),
        expect.anything(),
        mockBranchId,
      );
    });
  });

  describe('openSession audit scoping', () => {
    it('writes SESSION_OPENED audit entries with branch context', async () => {
      prisma.cashierSession.findFirst.mockResolvedValue(null);
      prisma.cashierSession.create.mockResolvedValue({
        id: 'session-open',
        tenantId: mockTenantId,
        branchId: mockBranchId,
        userId: mockUserId,
        status: 'OPEN',
      });

      await service.openSession(mockTenantId, mockUserId, mockBranchId, {
        openingBalance: 100,
        branchId: mockBranchId,
      });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'SESSION_OPENED' }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('keeps a database guard for one OPEN session per tenant, user, and branch', () => {
      const migration = readFileSync(
        join(
          __dirname,
          '..',
          '..',
          'prisma',
          'migrations',
          '20260513193000_add_unique_open_cashier_session_guard',
          'migration.sql',
        ),
        'utf8',
      );

      expect(migration).toContain(
        'CREATE UNIQUE INDEX "cashier_sessions_one_open_per_user_branch_idx"',
      );
      expect(migration).toContain(
        'ON "cashier_sessions"("tenant_id", "user_id", "branch_id")',
      );
      expect(migration).toContain('WHERE "status" = \'OPEN\';');
      expect(migration).toContain('RAISE EXCEPTION');
      expect(migration).toContain(
        'Duplicate OPEN cashier sessions exist; resolve them before applying cashier_sessions_one_open_per_user_branch_idx.',
      );
      expect(migration).toContain(
        'GROUP BY "tenant_id", "user_id", "branch_id"',
      );
      expect(migration).toContain('HAVING COUNT(*) > 1');
      expect(migration).toContain(
        'Identify duplicates with: SELECT tenant_id, user_id, branch_id, COUNT(*) FROM cashier_sessions',
      );
    });
  });

  describe('postPayment scoped writes', () => {
    let service: BillingService;
    let prisma: any;
    let audit: { log: jest.Mock };

    const tenantId = 'tenant-a';
    const branchId = 'branch-a';
    const userId = 'user-a';
    const invoiceId = 'invoice-a';
    const sessionId = 'session-a';

    beforeEach(async () => {
      prisma = createPrismaMock();
      audit = { log: jest.fn().mockResolvedValue({}) };
      const numbering = {
        generateNumber: jest.fn().mockResolvedValue('RCP-000001'),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BillingService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: audit },
          {
            provide: ApprovalsService,
            useValue: { createRequest: jest.fn() },
          },
          { provide: NumberingService, useValue: numbering },
          {
            provide: LedgerService,
            useValue: { postEntry: jest.fn().mockResolvedValue(undefined) },
          },
        ],
      }).compile();

      service = module.get<BillingService>(BillingService);
    });

    it('rolls back scoped invoice update failure (no concurrent row)', async () => {
      const mockInv = {
        id: invoiceId,
        orderId: 'order-a',
        paidAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        status: 'UNPAID',
        order: {
          id: 'order-a',
          tenantId,
          branchId,
        },
      };
      prisma.invoice.findFirst.mockResolvedValue(mockInv);
      prisma.invoice.findUnique.mockResolvedValue(mockInv);
      prisma.cashierSession.findFirst.mockResolvedValue({
        id: sessionId,
        tenantId,
        branchId,
        userId,
        status: 'OPEN',
      });
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.payment.create.mockResolvedValue({ id: 'pay-a' });

      // First call (lock) succeeds, but we mock balance update call failure
      // (second invoice.updateMany call returns count: 0 to trigger the fail-closed path)
      prisma.invoice.updateMany
        .mockResolvedValueOnce({ count: 1 }) // lock succeeds
        .mockResolvedValueOnce({ count: 0 }); // balance update fails (e.g., archived)

      const dto = {
        invoiceId,
        cashierSessionId: sessionId,
        amount: 50,
        paymentMethod: 'CASH',
      };

      await expect(
        service.postPayment(tenantId, userId, branchId, dto, 'idem-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('scopes invoice and audit on successful partial payment', async () => {
      const mockInv = {
        id: invoiceId,
        orderId: 'order-a',
        paidAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        status: 'UNPAID',
        order: {
          id: 'order-a',
          tenantId,
          branchId,
        },
      };
      prisma.invoice.findFirst.mockResolvedValue(mockInv);
      prisma.invoice.findUnique.mockResolvedValue(mockInv);
      prisma.cashierSession.findFirst.mockResolvedValue({
        id: sessionId,
        tenantId,
        branchId,
        userId,
        status: 'OPEN',
      });
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.payment.create.mockResolvedValue({ id: 'pay-a' });
      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });

      const dto = {
        invoiceId,
        cashierSessionId: sessionId,
        amount: 50,
        paymentMethod: 'CASH',
      };

      await service.postPayment(tenantId, userId, branchId, dto, 'idem-2');

      expect(prisma.payment.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'PAYMENT_POSTED',
        }),
        expect.anything(),
        branchId,
      );
    });
  });

  describe('postPayment idempotency guard', () => {
    let service: BillingService;
    let prisma: any;
    let audit: { log: jest.Mock };
    let numbering: { generateNumber: jest.Mock };

    const tenantId = 'tenant-idem';
    const branchId = 'branch-idem';
    const userId = 'user-idem';
    const invoiceId = 'invoice-idem';
    const sessionId = 'session-idem';
    const idempotencyKey = 'idem-key-123';

    const validDto = {
      invoiceId,
      cashierSessionId: sessionId,
      amount: 50,
      paymentMethod: 'CASH',
    };

    beforeEach(async () => {
      prisma = createPrismaMock();
      audit = { log: jest.fn().mockResolvedValue({}) };
      numbering = { generateNumber: jest.fn().mockResolvedValue('RCP-000001') };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BillingService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: audit },
          {
            provide: ApprovalsService,
            useValue: { createRequest: jest.fn() },
          },
          { provide: NumberingService, useValue: numbering },
          {
            provide: LedgerService,
            useValue: { postEntry: jest.fn().mockResolvedValue(undefined) },
          },
        ],
      }).compile();

      service = module.get<BillingService>(BillingService);
    });

    it('should reject missing idempotency key header', async () => {
      const invalidHeader = undefined as unknown as string;

      await expect(
        service.postPayment(tenantId, userId, branchId, validDto, ''),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.postPayment(
          tenantId,
          userId,
          branchId,
          validDto,
          invalidHeader,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create payment successfully on first request', async () => {
      prisma.idempotencyRecord.findUnique.mockResolvedValue(null);
      prisma.idempotencyRecord.create.mockResolvedValue({
        id: 'rec-1',
        tenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: computePaymentFingerprint(
          tenantId,
          'BILLING_PAYMENT_POST',
          validDto,
        ),
        status: 'IN_PROGRESS',
      });

      const mockInv = {
        id: invoiceId,
        orderId: 'order-idem',
        paidAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        status: 'UNPAID',
        order: { id: 'order-idem', tenantId, branchId },
      };
      prisma.invoice.findFirst.mockResolvedValue(mockInv);
      prisma.invoice.findUnique.mockResolvedValue(mockInv);

      prisma.cashierSession.findFirst.mockResolvedValue({
        id: sessionId,
        tenantId,
        branchId,
        userId,
        status: 'OPEN',
      });
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.payment.create.mockResolvedValue({
        id: 'pay-idem-1',
        invoiceId,
        cashierSessionId: sessionId,
        receiptNumber: 'RCP-000001',
        amount: validDto.amount,
        paymentMethod: 'CASH',
        status: 'POSTED',
        idempotencyKey,
      });

      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.postPayment(
        tenantId,
        userId,
        branchId,
        validDto,
        idempotencyKey,
      );

      expect(result.payment).toEqual(
        expect.objectContaining({ id: 'pay-idem-1' }),
      );
      expect(result.invoice).toEqual(
        expect.objectContaining({ id: invoiceId }),
      );
      expect(prisma.idempotencyRecord.create).toHaveBeenCalled();
      expect(prisma.idempotencyRecord.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          paymentId: 'pay-idem-1',
        }),
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'PAYMENT_POSTED' }),
        expect.anything(),
        branchId,
      );
    });

    it('should return cached response on exact replay', async () => {
      const fingerprint = computePaymentFingerprint(
        tenantId,
        'BILLING_PAYMENT_POST',
        validDto,
      );

      prisma.idempotencyRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        tenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: fingerprint,
        status: 'COMPLETED',
        paymentId: 'pay-idem-1',
        responseData: {
          payment: { id: 'pay-idem-1' },
          invoice: { id: invoiceId, status: 'PARTIALLY_PAID' },
        },
      });

      const result = await service.postPayment(
        tenantId,
        userId,
        branchId,
        validDto,
        idempotencyKey,
      );

      expect((result as any)._replayed).toBe(true);
      expect(result.payment).toEqual({ id: 'pay-idem-1' });
      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(audit.log).not.toHaveBeenCalled(); // No duplicate audit
    });

    it('should reject same key with different amount (fingerprint mismatch)', async () => {
      const fingerprint = computePaymentFingerprint(
        tenantId,
        'BILLING_PAYMENT_POST',
        validDto,
      );

      prisma.idempotencyRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        tenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: fingerprint,
        status: 'COMPLETED',
        paymentId: 'pay-idem-1',
      });

      const dtoModified = { ...validDto, amount: 100 }; // Different amount

      await expect(
        service.postPayment(
          tenantId,
          userId,
          branchId,
          dtoModified,
          idempotencyKey,
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('should reject same key with different paymentMethod', async () => {
      const fingerprint = computePaymentFingerprint(
        tenantId,
        'BILLING_PAYMENT_POST',
        validDto,
      );

      prisma.idempotencyRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        tenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: fingerprint,
        status: 'COMPLETED',
        paymentId: 'pay-idem-1',
      });

      const dtoModified = { ...validDto, paymentMethod: 'CARD' };

      await expect(
        service.postPayment(
          tenantId,
          userId,
          branchId,
          dtoModified,
          idempotencyKey,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should isolate idempotency keys by tenant', async () => {
      const tenant2 = 'tenant-other';
      const fingerprint = computePaymentFingerprint(
        tenantId,
        'BILLING_PAYMENT_POST',
        validDto,
      );

      // First tenant has a completed record
      prisma.idempotencyRecord.findUnique.mockResolvedValue(null);
      prisma.idempotencyRecord.create.mockResolvedValue({
        id: 'rec-2',
        tenantId: tenant2,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: fingerprint,
        status: 'IN_PROGRESS',
      });

      const mockInv = {
        id: invoiceId,
        orderId: 'order-other',
        paidAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        status: 'UNPAID',
        order: { id: 'order-other', tenantId: tenant2, branchId },
      };
      prisma.invoice.findFirst.mockResolvedValue(mockInv);
      prisma.invoice.findUnique.mockResolvedValue(mockInv);

      prisma.cashierSession.findFirst.mockResolvedValue({
        id: sessionId,
        tenantId: tenant2,
        branchId,
        userId,
        status: 'OPEN',
      });
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.payment.create.mockResolvedValue({
        id: 'pay-other-1',
        invoiceId,
        amount: validDto.amount,
        idempotencyKey,
      });
      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });

      // Same key, different tenant should be independent
      const result = await service.postPayment(
        tenant2,
        userId,
        branchId,
        validDto,
        idempotencyKey,
      );

      expect(result.payment).toBeDefined();
      expect(prisma.idempotencyRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: tenant2,
            key: idempotencyKey,
          }),
        }),
      );
    });

    it('should not rely on a globally unique payments.idempotency_key', () => {
      const schema = readFileSync(
        join(__dirname, '..', '..', 'prisma', 'schema.prisma'),
        'utf8',
      );
      expect(schema).toContain('model Payment {');
      expect(schema).toContain(
        'idempotencyKey   String    @map("idempotency_key")',
      );
      expect(schema).not.toContain(
        'idempotencyKey   String   @unique @map("idempotency_key")',
      );

      const migration = readFileSync(
        join(
          __dirname,
          '..',
          '..',
          'prisma',
          'migrations',
          '20260513152000_drop_global_payment_idempotency_key_uniqueness',
          'migration.sql',
        ),
        'utf8',
      );

      expect(migration).toContain(
        'DROP INDEX IF EXISTS "payments_idempotency_key_key";',
      );
    });

    it('should update idempotency record to FAILED on payment creation error', async () => {
      prisma.idempotencyRecord.findUnique.mockResolvedValue(null);
      prisma.idempotencyRecord.create.mockResolvedValue({
        id: 'rec-1',
        status: 'IN_PROGRESS',
      });

      prisma.invoice.findFirst.mockResolvedValue(null); // Invoice not found

      await expect(
        service.postPayment(
          tenantId,
          userId,
          branchId,
          validDto,
          idempotencyKey,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.idempotencyRecord.updateMany).toHaveBeenCalledWith({
        where: { id: 'rec-1', status: 'IN_PROGRESS' },
        data: expect.objectContaining({
          status: 'FAILED',
          error: 'Payment request failed before completion',
        }),
      });
    });

    it('should reject concurrent request with same key during IN_PROGRESS', async () => {
      prisma.idempotencyRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        status: 'IN_PROGRESS',
      });

      await expect(
        service.postPayment(
          tenantId,
          userId,
          branchId,
          validDto,
          idempotencyKey,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should handle race condition where record created by another request', async () => {
      const fingerprint = computePaymentFingerprint(
        tenantId,
        'BILLING_PAYMENT_POST',
        validDto,
      );

      // First call returns null (no record yet)
      // Second call (after create fails) returns the record created by race
      prisma.idempotencyRecord.findUnique.mockResolvedValueOnce(null);
      prisma.idempotencyRecord.create.mockRejectedValueOnce({
        code: 'P2002',
        message: 'Unique constraint failed',
      });
      prisma.idempotencyRecord.findUnique.mockResolvedValueOnce({
        id: 'rec-race',
        tenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: fingerprint,
        status: 'COMPLETED',
        paymentId: 'pay-race-1',
        responseData: {
          payment: { id: 'pay-race-1' },
          invoice: { id: invoiceId },
        },
      });

      const result = await service.postPayment(
        tenantId,
        userId,
        branchId,
        validDto,
        idempotencyKey,
      );

      expect((result as any)._replayed).toBe(true);
      expect(result.payment).toEqual({ id: 'pay-race-1' });
    });

    it('should not create duplicate payment on exact replay', async () => {
      const fingerprint = computePaymentFingerprint(
        tenantId,
        'BILLING_PAYMENT_POST',
        validDto,
      );

      // Replay scenario
      prisma.idempotencyRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        tenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: fingerprint,
        status: 'COMPLETED',
        paymentId: 'pay-idem-1',
        responseData: {
          payment: { id: 'pay-idem-1' },
          invoice: { id: invoiceId },
        },
      });

      await service.postPayment(
        tenantId,
        userId,
        branchId,
        validDto,
        idempotencyKey,
      );

      // Should not call payment.create again
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('should not duplicate audit event on exact replay', async () => {
      const fingerprint = computePaymentFingerprint(
        tenantId,
        'BILLING_PAYMENT_POST',
        validDto,
      );

      prisma.idempotencyRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        tenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: fingerprint,
        status: 'COMPLETED',
        paymentId: 'pay-idem-1',
        responseData: {
          payment: { id: 'pay-idem-1' },
          invoice: { id: invoiceId },
        },
      });

      // Reset the mock to track this specific call
      audit.log.mockClear();

      await service.postPayment(
        tenantId,
        userId,
        branchId,
        validDto,
        idempotencyKey,
      );

      // Audit.log should not be called on replay
      expect(audit.log).not.toHaveBeenCalled();
    });

    it('should retry a failed record with the same fingerprint and complete', async () => {
      const fingerprint = computePaymentFingerprint(
        tenantId,
        'BILLING_PAYMENT_POST',
        validDto,
      );

      prisma.idempotencyRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        tenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: fingerprint,
        status: 'FAILED',
        error: 'Previous attempt failed',
      });

      prisma.idempotencyRecord.updateMany.mockResolvedValue({ count: 1 });

      const mockInv = {
        id: invoiceId,
        orderId: 'order-idem',
        paidAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        status: 'UNPAID',
        order: { id: 'order-idem', tenantId, branchId },
      };
      prisma.invoice.findFirst.mockResolvedValue(mockInv);
      prisma.invoice.findUnique.mockResolvedValue(mockInv);

      prisma.cashierSession.findFirst.mockResolvedValue({
        id: sessionId,
        tenantId,
        branchId,
        userId,
        status: 'OPEN',
      });
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.payment.create.mockResolvedValue({
        id: 'pay-idem-retry-1',
        invoiceId,
        cashierSessionId: sessionId,
        receiptNumber: 'RCP-000001',
        amount: validDto.amount,
        paymentMethod: 'CASH',
        status: 'POSTED',
        idempotencyKey,
      });

      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.postPayment(
        tenantId,
        userId,
        branchId,
        validDto,
        idempotencyKey,
      );

      expect(result.payment).toEqual(
        expect.objectContaining({ id: 'pay-idem-retry-1' }),
      );
      expect(prisma.idempotencyRecord.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rec-1', status: 'FAILED' },
          data: expect.objectContaining({
            status: 'IN_PROGRESS',
            paymentId: null,
            responseData: Prisma.DbNull,
            error: null,
          }),
        }),
      );
      expect(prisma.payment.create).toHaveBeenCalledTimes(1);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'PAYMENT_POSTED' }),
        expect.anything(),
        branchId,
      );
    });

    it('should reject failed record replay with a different fingerprint', async () => {
      const fingerprint = computePaymentFingerprint(
        tenantId,
        'BILLING_PAYMENT_POST',
        validDto,
      );

      prisma.idempotencyRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        tenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: fingerprint,
        status: 'FAILED',
        error: 'Previous attempt failed',
      });

      const dtoModified = { ...validDto, amount: 100 };

      await expect(
        service.postPayment(
          tenantId,
          userId,
          branchId,
          dtoModified,
          idempotencyKey,
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.idempotencyRecord.updateMany).not.toHaveBeenCalled();
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('should sanitize internal errors and not expose raw details', async () => {
      prisma.idempotencyRecord.findUnique.mockResolvedValue(null);
      prisma.idempotencyRecord.create.mockResolvedValue({
        id: 'rec-1',
        status: 'IN_PROGRESS',
      });

      const mockInv = {
        id: invoiceId,
        orderId: 'order-idem',
        paidAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        status: 'UNPAID',
        order: { id: 'order-idem', tenantId, branchId },
      };
      prisma.invoice.findFirst.mockResolvedValue(mockInv);
      prisma.invoice.findUnique.mockResolvedValue(mockInv);

      prisma.cashierSession.findFirst.mockResolvedValue({
        id: sessionId,
        tenantId,
        branchId,
        userId,
        status: 'OPEN',
      });
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.payment.create.mockRejectedValue(
        new Error('database password leaked'),
      );

      await expect(
        service.postPayment(
          tenantId,
          userId,
          branchId,
          validDto,
          idempotencyKey,
        ),
      ).rejects.toThrow('Payment request failed before completion');

      expect(prisma.idempotencyRecord.updateMany).toHaveBeenCalledWith({
        where: { id: 'rec-1', status: 'IN_PROGRESS' },
        data: expect.objectContaining({
          status: 'FAILED',
          error: 'Payment request failed before completion',
        }),
      });
    });

    it('should keep replay state safe by completing inside the payment transaction', async () => {
      prisma.idempotencyRecord.findUnique.mockResolvedValue(null);
      prisma.idempotencyRecord.create.mockResolvedValue({
        id: 'rec-1',
        tenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: computePaymentFingerprint(
          tenantId,
          'BILLING_PAYMENT_POST',
          validDto,
        ),
        status: 'IN_PROGRESS',
      });

      const mockInv = {
        id: invoiceId,
        orderId: 'order-idem',
        paidAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        status: 'UNPAID',
        order: { id: 'order-idem', tenantId, branchId },
      };
      prisma.invoice.findFirst.mockResolvedValue(mockInv);
      prisma.invoice.findUnique.mockResolvedValue(mockInv);

      prisma.cashierSession.findFirst.mockResolvedValue({
        id: sessionId,
        tenantId,
        branchId,
        userId,
        status: 'OPEN',
      });
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.payment.create.mockResolvedValue({
        id: 'pay-idem-1',
        invoiceId,
        cashierSessionId: sessionId,
        receiptNumber: 'RCP-000001',
        amount: validDto.amount,
        paymentMethod: 'CASH',
        status: 'POSTED',
        idempotencyKey,
      });
      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });

      await service.postPayment(
        tenantId,
        userId,
        branchId,
        validDto,
        idempotencyKey,
      );

      expect(prisma.idempotencyRecord.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          paymentId: 'pay-idem-1',
        }),
      });
    });

    it('should mark FAILED when completion update fails before the transaction commits', async () => {
      prisma.idempotencyRecord.findUnique.mockResolvedValue(null);
      prisma.idempotencyRecord.create.mockResolvedValue({
        id: 'rec-1',
        tenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: computePaymentFingerprint(
          tenantId,
          'BILLING_PAYMENT_POST',
          validDto,
        ),
        status: 'IN_PROGRESS',
      });

      const mockInv = {
        id: invoiceId,
        orderId: 'order-idem',
        paidAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        status: 'UNPAID',
        order: { id: 'order-idem', tenantId, branchId },
      };
      prisma.invoice.findFirst.mockResolvedValue(mockInv);
      prisma.invoice.findUnique.mockResolvedValue(mockInv);

      prisma.cashierSession.findFirst.mockResolvedValue({
        id: sessionId,
        tenantId,
        branchId,
        userId,
        status: 'OPEN',
      });
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.payment.create.mockResolvedValue({
        id: 'pay-idem-1',
        invoiceId,
        cashierSessionId: sessionId,
        receiptNumber: 'RCP-000001',
        amount: validDto.amount,
        paymentMethod: 'CASH',
        status: 'POSTED',
        idempotencyKey,
      });
      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.idempotencyRecord.update.mockRejectedValueOnce(
        new Error('completion write failed'),
      );

      await expect(
        service.postPayment(
          tenantId,
          userId,
          branchId,
          validDto,
          idempotencyKey,
        ),
      ).rejects.toThrow('Payment request failed before completion');

      expect(prisma.idempotencyRecord.updateMany).toHaveBeenCalledWith({
        where: { id: 'rec-1', status: 'IN_PROGRESS' },
        data: expect.objectContaining({
          status: 'FAILED',
          error: 'Payment request failed before completion',
        }),
      });
    });
  });

  describe('transaction boundary invariants', () => {
    const validDto = {
      invoiceId: mockInvoiceId,
      cashierSessionId: 'sess-123',
      amount: 50,
      paymentMethod: 'CASH',
    };
    const idempotencyKey = 'idem-123';

    it('rejects postPayment if session is closed concurrently inside transaction', async () => {
      prisma.idempotencyRecord.findUnique.mockResolvedValue(null);
      prisma.idempotencyRecord.create.mockResolvedValue({
        id: 'rec-1',
        tenantId: mockTenantId,
        operation: 'BILLING_PAYMENT_POST',
        key: idempotencyKey,
        requestFingerprint: computePaymentFingerprint(
          mockTenantId,
          'BILLING_PAYMENT_POST',
          validDto,
        ),
        status: 'IN_PROGRESS',
      });

      const mockInv = {
        id: mockInvoiceId,
        orderId: 'order-1',
        paidAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        status: 'UNPAID',
        order: {
          id: 'order-1',
          tenantId: mockTenantId,
          branchId: mockBranchId,
        },
      };
      prisma.invoice.findFirst.mockResolvedValue(mockInv);
      prisma.invoice.findUnique.mockResolvedValue(mockInv);

      prisma.cashierSession.findFirst.mockResolvedValue({
        id: 'sess-123',
        tenantId: mockTenantId,
        branchId: mockBranchId,
        userId: mockUserId,
        status: 'OPEN',
      });

      prisma.cashierSession.updateMany
        // Inside transaction returns count: 0 indicating it was closed concurrently
        .mockResolvedValueOnce({ count: 0 });

      await expect(
        service.postPayment(
          mockTenantId,
          mockUserId,
          mockBranchId,
          validDto,
          idempotencyKey,
        ),
      ).rejects.toThrow(ConflictException);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('rejects closeSession if session has variance but remarks are empty (restoring OPEN state)', async () => {
      prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
      prisma.cashierSession.findFirst.mockResolvedValue({
        id: 'sess-123',
        openingBalance: new Prisma.Decimal(100),
        payments: [],
      });

      await expect(
        service.closeSession(
          mockTenantId,
          mockUserId,
          mockBranchId,
          'sess-123',
          {
            actualClosingBalance: 150, // Variance = 50
            remarks: '', // Missing remarks
          },
        ),
      ).rejects.toThrow(BadRequestException);

      expect(audit.log).not.toHaveBeenCalled();
    });

    it('rejects overpayment', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: mockInvoiceId,
        totalAmount: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(0),
        status: 'UNPAID',
        order: { id: 'o1', tenantId: mockTenantId, branchId: mockBranchId },
      });
      prisma.invoice.findUnique.mockResolvedValue({
        id: mockInvoiceId,
        totalAmount: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(0),
        status: 'UNPAID',
        order: { id: 'o1', tenantId: mockTenantId, branchId: mockBranchId },
      });

      const dto = {
        invoiceId: mockInvoiceId,
        cashierSessionId: 'sess-123',
        amount: 150, // OVERPAYMENT
        paymentMethod: 'CASH',
      };

      await expect(
        service.postPayment(mockTenantId, mockUserId, mockBranchId, dto, 'k1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('serializes concurrent payments via row lock', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: mockInvoiceId,
        totalAmount: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(0),
        status: 'UNPAID',
        order: { id: 'o1', tenantId: mockTenantId, branchId: mockBranchId },
      });
      prisma.invoice.findUnique.mockResolvedValue({
        id: mockInvoiceId,
        totalAmount: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(0),
        status: 'UNPAID',
        order: { id: 'o1', tenantId: mockTenantId, branchId: mockBranchId },
      });

      const dto = {
        invoiceId: mockInvoiceId,
        cashierSessionId: 'sess-123',
        amount: 50,
        paymentMethod: 'CASH',
      };

      await service.postPayment(
        mockTenantId,
        mockUserId,
        mockBranchId,
        dto,
        'k2',
      );

      // Confirm row lock was acquired BEFORE reading and updating
      expect(prisma.invoice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: mockInvoiceId,
            status: { not: 'PAID' },
          }),
        }),
      );
    });
  });

  describe('gateway payment lifecycle', () => {
    let service: BillingService;
    let prisma: any;
    let audit: { log: jest.Mock };
    let ledgerService: { postEntry: jest.Mock };

    const tenantId = 'tenant-gw';
    const branchId = 'branch-gw';
    const userId = 'user-gw';
    const invoiceId = 'inv-gw';
    const sessionId = 'session-gw';
    const paymentId = 'pay-gw';

    const makePaymentMock = (overrides: Record<string, unknown> = {}) => ({
      id: paymentId,
      tenantId,
      invoiceId,
      cashierSessionId: sessionId,
      receiptNumber: 'RCP-GW-001',
      amount: new Prisma.Decimal(500),
      paymentMethod: 'QRPH',
      status: 'POSTED',
      gatewayReference: null,
      gatewayStatus: null,
      gatewayProvider: null,
      invoice: undefined as any,
      ...overrides,
    });

    const makeInvoiceMock = (overrides: Record<string, unknown> = {}) => ({
      id: invoiceId,
      invoiceNumber: 'INV-GW-001',
      orderId: 'order-gw',
      totalAmount: new Prisma.Decimal(1000),
      paidAmount: new Prisma.Decimal(0),
      status: 'UNPAID',
      order: { id: 'order-gw', tenantId, branchId },
      ...overrides,
    });

    beforeEach(async () => {
      prisma = createPrismaMock();
      audit = { log: jest.fn().mockResolvedValue({}) };
      ledgerService = { postEntry: jest.fn().mockResolvedValue(undefined) };
      approvals = {
        createRequest: jest.fn().mockResolvedValue({ id: 'req-uuid' }),
        processRequest: jest.fn(),
      };

      // Ensure $transaction passes the mock prisma as tx
      prisma.$transaction = jest
        .fn()
        .mockImplementation(
          async (cb: (tx: any) => unknown) => await cb(prisma),
        );

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BillingService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: audit },
          {
            provide: ApprovalsService,
            useValue: approvals,
          },
          {
            provide: NumberingService,
            useValue: {
              generateNumber: jest.fn().mockResolvedValue('RCP-GW-001'),
            },
          },
          { provide: LedgerService, useValue: ledgerService },
        ],
      }).compile();

      service = module.get<BillingService>(BillingService);
    });

    describe('QRPH postPayment does not settle financial truth', () => {
      it('should create QRPH payment without settling invoice or posting ledger', async () => {
        const invoice = makeInvoiceMock();
        prisma.invoice.findFirst.mockResolvedValue(invoice);
        prisma.invoice.findUnique.mockResolvedValue(invoice);
        prisma.cashierSession.findFirst.mockResolvedValue({
          id: sessionId,
          tenantId,
          branchId,
          userId,
          status: 'OPEN',
        });
        prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
        prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
        prisma.payment.create.mockResolvedValue(
          makePaymentMock({
            gatewayStatus: 'GATEWAY_PENDING',
            gatewayProvider: 'QRPH',
          }),
        );

        const dto = {
          invoiceId,
          cashierSessionId: sessionId,
          amount: 500,
          paymentMethod: 'QRPH',
        };
        await service.postPayment(
          tenantId,
          userId,
          branchId,
          dto,
          'idem-qrph-1',
        );

        // Payment record was created
        expect(prisma.payment.create).toHaveBeenCalled();
        // Ledger entries NOT posted for QRPH
        expect(prisma.cashierLedgerEntry.create).not.toHaveBeenCalled();
        expect(ledgerService.postEntry).not.toHaveBeenCalled();
        // Invoice financial state NOT mutated
        expect(prisma.invoice.update).not.toHaveBeenCalled();
        // Order status NOT updated
        expect(prisma.order.updateMany).not.toHaveBeenCalled();
        // Audit events: PAYMENT_POSTED and PAYMENT_GATEWAY_INITIATED
        expect(audit.log).toHaveBeenCalledWith(
          expect.objectContaining({ eventKey: 'PAYMENT_POSTED' }),
          expect.anything(),
          branchId,
        );
        expect(audit.log).toHaveBeenCalledWith(
          expect.objectContaining({ eventKey: 'PAYMENT_GATEWAY_INITIATED' }),
          expect.anything(),
          branchId,
        );
      });

      it('should still settle invoice for CASH payment (regression guard)', async () => {
        const invoice = makeInvoiceMock();
        prisma.invoice.findFirst.mockResolvedValue(invoice);
        prisma.invoice.findUnique.mockResolvedValue(invoice);
        prisma.cashierSession.findFirst.mockResolvedValue({
          id: sessionId,
          tenantId,
          branchId,
          userId,
          status: 'OPEN',
        });
        prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
        prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
        prisma.payment.create.mockResolvedValue(
          makePaymentMock({
            paymentMethod: 'CASH',
            gatewayProvider: null,
            gatewayStatus: null,
          }),
        );

        const dto = {
          invoiceId,
          cashierSessionId: sessionId,
          amount: 500,
          paymentMethod: 'CASH',
        };
        await service.postPayment(
          tenantId,
          userId,
          branchId,
          dto,
          'idem-cash-1',
        );

        // Ledger entries posted for CASH
        expect(prisma.cashierLedgerEntry.create).toHaveBeenCalled();
        expect(ledgerService.postEntry).toHaveBeenCalled();
        // Invoice updated
        expect(prisma.invoice.updateMany).toHaveBeenCalled();
      });
    });

    describe('confirmPayment', () => {
      it('should settle invoice and update gateway fields for GATEWAY_PENDING payment', async () => {
        const payment = makePaymentMock({
          gatewayStatus: 'GATEWAY_PENDING',
          gatewayProvider: 'QRPH',
        });
        const invoice = makeInvoiceMock();
        prisma.payment.findFirst.mockResolvedValue({ ...payment, invoice });
        prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
        prisma.invoice.findUnique.mockResolvedValue(invoice);
        prisma.payment.update.mockResolvedValue({
          ...payment,
          gatewayStatus: 'GATEWAY_CONFIRMED',
        });

        const dto = { gatewayReference: 'GW-REF-001', gatewayProvider: 'QRPH' };
        await service.confirmPayment(
          tenantId,
          userId,
          branchId,
          paymentId,
          dto,
        );

        // Settlement occurred
        expect(prisma.cashierLedgerEntry.create).toHaveBeenCalled();
        expect(ledgerService.postEntry).toHaveBeenCalled();
        expect(prisma.invoice.update).toHaveBeenCalled();
        // Gateway fields updated
        expect(prisma.payment.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: paymentId },
            data: expect.objectContaining({
              gatewayReference: 'GW-REF-001',
              gatewayStatus: 'GATEWAY_CONFIRMED',
              gatewayProvider: 'QRPH',
            }),
          }),
        );
        // Audit logged
        expect(audit.log).toHaveBeenCalledWith(
          expect.objectContaining({ eventKey: 'PAYMENT_GATEWAY_CONFIRMED' }),
          expect.anything(),
          branchId,
        );
      });

      it('should reject payments with gatewayStatus === null (non-gateway payments)', async () => {
        const payment = makePaymentMock({
          gatewayStatus: null,
          gatewayProvider: null,
        });
        payment.invoice = makeInvoiceMock();
        prisma.payment.findFirst.mockResolvedValue(payment);

        const dto = { gatewayReference: 'GW-REF-002' };
        await expect(
          service.confirmPayment(tenantId, userId, branchId, paymentId, dto),
        ).rejects.toThrow(BadRequestException);

        expect(prisma.payment.update).not.toHaveBeenCalled();
      });

      it('should reject already-confirmed payments (double confirmation guard)', async () => {
        const payment = makePaymentMock({
          gatewayStatus: 'GATEWAY_CONFIRMED',
          gatewayProvider: 'QRPH',
        });
        payment.invoice = makeInvoiceMock();
        prisma.payment.findFirst.mockResolvedValue(payment);

        const dto = { gatewayReference: 'GW-REF-003' };
        await expect(
          service.confirmPayment(tenantId, userId, branchId, paymentId, dto),
        ).rejects.toThrow(BadRequestException);

        expect(prisma.invoice.update).not.toHaveBeenCalled();
      });

      it('should reject VOIDED payments', async () => {
        const payment = makePaymentMock({
          status: 'VOIDED',
          gatewayStatus: 'GATEWAY_PENDING',
        });
        payment.invoice = makeInvoiceMock();
        prisma.payment.findFirst.mockResolvedValue(payment);

        const dto = { gatewayReference: 'GW-REF-004' };
        await expect(
          service.confirmPayment(tenantId, userId, branchId, paymentId, dto),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('failPayment', () => {
      it('should transition GATEWAY_PENDING to GATEWAY_FAILED', async () => {
        const payment = makePaymentMock({
          gatewayStatus: 'GATEWAY_PENDING',
          gatewayProvider: 'QRPH',
        });
        prisma.payment.findFirst.mockResolvedValue(payment);
        prisma.payment.update.mockResolvedValue({
          ...payment,
          gatewayStatus: 'GATEWAY_FAILED',
        });

        const dto = { reason: 'Gateway declined transaction' };
        await service.failPayment(tenantId, userId, branchId, paymentId, dto);

        expect(prisma.payment.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: paymentId },
            data: expect.objectContaining({ gatewayStatus: 'GATEWAY_FAILED' }),
          }),
        );
        expect(audit.log).toHaveBeenCalledWith(
          expect.objectContaining({ eventKey: 'PAYMENT_GATEWAY_FAILED' }),
          expect.anything(),
          expect.anything(),
        );
        // No financial settlement should occur
        expect(prisma.invoice.update).not.toHaveBeenCalled();
      });

      it('should reject non-pending gateway payments', async () => {
        const payment = makePaymentMock({ gatewayStatus: null });
        prisma.payment.findFirst.mockResolvedValue(payment);

        await expect(
          service.failPayment(tenantId, userId, branchId, paymentId, {
            reason: 'test',
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('expirePayment', () => {
      it('should transition GATEWAY_PENDING to GATEWAY_EXPIRED', async () => {
        const payment = makePaymentMock({
          gatewayStatus: 'GATEWAY_PENDING',
          gatewayProvider: 'QRPH',
        });
        prisma.payment.findFirst.mockResolvedValue(payment);
        prisma.payment.update.mockResolvedValue({
          ...payment,
          gatewayStatus: 'GATEWAY_EXPIRED',
        });

        const dto = { reason: 'Payment link expired' };
        await service.expirePayment(tenantId, userId, branchId, paymentId, dto);

        expect(prisma.payment.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: paymentId },
            data: expect.objectContaining({ gatewayStatus: 'GATEWAY_EXPIRED' }),
          }),
        );
        expect(audit.log).toHaveBeenCalledWith(
          expect.objectContaining({ eventKey: 'PAYMENT_GATEWAY_EXPIRED' }),
          expect.anything(),
          expect.anything(),
        );
        expect(prisma.invoice.update).not.toHaveBeenCalled();
      });

      it('should reject non-pending gateway payments', async () => {
        const payment = makePaymentMock({ gatewayStatus: 'GATEWAY_FAILED' });
        prisma.payment.findFirst.mockResolvedValue(payment);

        await expect(
          service.expirePayment(tenantId, userId, branchId, paymentId, {
            reason: 'test',
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('rejectVoid transaction atomicity', () => {
      it('should use tx.paymentReversal.update inside transaction', async () => {
        const reversal = {
          id: 'rev-1',
          type: 'VOID',
          paymentId: mockPaymentId,
          approvalRequestId: 'approval-1',
          reason: 'test',
          amount: new Prisma.Decimal(100),
        };
        prisma.paymentReversal.findFirst.mockResolvedValue(reversal);
        approvals.processRequest.mockResolvedValue({});
        prisma.paymentReversal.update.mockResolvedValue({
          ...reversal,
          status: 'REJECTED',
        });
        audit.log.mockResolvedValue({});

        await service.rejectVoid(
          mockTenantId,
          mockUserId,
          mockBranchId,
          'rev-1',
          { remarks: 'test' },
        );

        // Verify paymentReversal.update was called on tx (first arg of mock)
        expect(prisma.paymentReversal.update).toHaveBeenCalled();
        // Verify audit.log was called with tx
        expect(audit.log).toHaveBeenCalledWith(
          expect.objectContaining({ eventKey: 'PAYMENT_VOID_REJECTED' }),
          expect.anything(), // tx
          mockBranchId,
        );
      });
    });

    describe('rejectRefund transaction atomicity', () => {
      it('should use tx.paymentReversal.update inside transaction', async () => {
        const reversal = {
          id: 'rev-1',
          type: 'REFUND',
          paymentId: mockPaymentId,
          approvalRequestId: 'approval-1',
          reason: 'test',
          amount: new Prisma.Decimal(100),
        };
        prisma.paymentReversal.findFirst.mockResolvedValue(reversal);
        approvals.processRequest.mockResolvedValue({});
        prisma.paymentReversal.update.mockResolvedValue({
          ...reversal,
          status: 'REJECTED',
        });
        audit.log.mockResolvedValue({});

        await service.rejectRefund(
          mockTenantId,
          mockUserId,
          mockBranchId,
          'rev-1',
          { remarks: 'test' },
        );

        expect(prisma.paymentReversal.update).toHaveBeenCalled();
        expect(audit.log).toHaveBeenCalledWith(
          expect.objectContaining({ eventKey: 'REFUND_REJECTED' }),
          expect.anything(), // tx
          mockBranchId,
        );
      });
    });

    describe('failPayment transaction atomicity', () => {
      it('should wrap mutation and audit in single transaction', async () => {
        const payment = makePaymentMock({
          gatewayStatus: 'GATEWAY_PENDING',
        });
        prisma.payment.findFirst.mockResolvedValue(payment);
        prisma.payment.update.mockResolvedValue({
          ...payment,
          gatewayStatus: 'GATEWAY_FAILED',
        });
        audit.log.mockResolvedValue({});

        await service.failPayment(
          mockTenantId,
          mockUserId,
          mockBranchId,
          'pay-1',
          {
            reason: 'Gateway declined',
          },
        );

        // Verify transaction was used
        expect(prisma.$transaction).toHaveBeenCalled();
        expect(prisma.payment.update).toHaveBeenCalled();
        expect(audit.log).toHaveBeenCalledWith(
          expect.objectContaining({ eventKey: 'PAYMENT_GATEWAY_FAILED' }),
          expect.anything(), // tx
          mockBranchId,
        );
      });

      it('should rollback payment update when audit fails', async () => {
        const payment = makePaymentMock({
          gatewayStatus: 'GATEWAY_PENDING',
        });
        prisma.payment.findFirst.mockResolvedValue(payment);
        prisma.payment.update.mockResolvedValue({
          ...payment,
          gatewayStatus: 'GATEWAY_FAILED',
        });
        audit.log.mockRejectedValue(new Error('Audit failed'));

        await expect(
          service.failPayment(mockTenantId, mockUserId, mockBranchId, 'pay-1', {
            reason: 'Gateway declined',
          }),
        ).rejects.toThrow('Audit failed');

        // Transaction should have rolled back
        expect(prisma.$transaction).toHaveBeenCalled();
      });
    });

    describe('expirePayment transaction atomicity', () => {
      it('should wrap mutation and audit in single transaction', async () => {
        const payment = makePaymentMock({
          gatewayStatus: 'GATEWAY_PENDING',
        });
        prisma.payment.findFirst.mockResolvedValue(payment);
        prisma.payment.update.mockResolvedValue({
          ...payment,
          gatewayStatus: 'GATEWAY_EXPIRED',
        });
        audit.log.mockResolvedValue({});

        await service.expirePayment(
          mockTenantId,
          mockUserId,
          mockBranchId,
          'pay-1',
          {
            reason: 'Expired',
          },
        );

        expect(prisma.$transaction).toHaveBeenCalled();
        expect(prisma.payment.update).toHaveBeenCalled();
        expect(audit.log).toHaveBeenCalledWith(
          expect.objectContaining({ eventKey: 'PAYMENT_GATEWAY_EXPIRED' }),
          expect.anything(), // tx
          mockBranchId,
        );
      });

      it('should rollback payment update when audit fails', async () => {
        const payment = makePaymentMock({
          gatewayStatus: 'GATEWAY_PENDING',
        });
        prisma.payment.findFirst.mockResolvedValue(payment);
        prisma.payment.update.mockResolvedValue({
          ...payment,
          gatewayStatus: 'GATEWAY_EXPIRED',
        });
        audit.log.mockRejectedValue(new Error('Audit failed'));

        await expect(
          service.expirePayment(
            mockTenantId,
            mockUserId,
            mockBranchId,
            'pay-1',
            {
              reason: 'Expired',
            },
          ),
        ).rejects.toThrow('Audit failed');

        expect(prisma.$transaction).toHaveBeenCalled();
      });
    });

    describe('confirmPayment session lock', () => {
      it('should lock cashier session inside transaction', async () => {
        const payment = {
          id: 'pay-1',
          invoiceId: 'inv-1',
          cashierSessionId: 'sess-1',
          status: 'POSTED',
          gatewayStatus: 'GATEWAY_PENDING',
          amount: new Prisma.Decimal(100),
          invoice: {
            id: 'inv-1',
            totalAmount: new Prisma.Decimal(1000),
            paidAmount: new Prisma.Decimal(900),
            status: 'PARTIALLY_PAID',
            orderId: 'ord-1',
          },
        };
        prisma.payment.findFirst.mockResolvedValue(payment);
        prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
        prisma.cashierSession.updateMany.mockResolvedValue({ count: 1 });
        prisma.invoice.findUnique.mockResolvedValue(payment.invoice);
        prisma.cashierLedgerEntry.create.mockResolvedValue({});
        prisma.invoice.update.mockResolvedValue({});
        prisma.order.updateMany.mockResolvedValue({ count: 1 });
        prisma.payment.update.mockResolvedValue({});
        audit.log.mockResolvedValue({});

        await service.confirmPayment(
          mockTenantId,
          mockUserId,
          mockBranchId,
          'pay-1',
          { gatewayReference: 'gw-ref' },
        );

        // Verify session was locked
        expect(prisma.cashierSession.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              id: 'sess-1',
              tenantId: mockTenantId,
              branchId: mockBranchId,
              status: 'OPEN',
            }),
          }),
        );
      });

      it('should reject if session is closed', async () => {
        const payment = {
          id: 'pay-1',
          invoiceId: 'inv-1',
          cashierSessionId: 'sess-1',
          status: 'POSTED',
          gatewayStatus: 'GATEWAY_PENDING',
          amount: new Prisma.Decimal(100),
          invoice: {
            id: 'inv-1',
            totalAmount: new Prisma.Decimal(1000),
            paidAmount: new Prisma.Decimal(900),
            status: 'PARTIALLY_PAID',
            orderId: 'ord-1',
          },
        };
        prisma.payment.findFirst.mockResolvedValue(payment);
        prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
        prisma.cashierSession.updateMany.mockResolvedValue({ count: 0 }); // Session already closed

        await expect(
          service.confirmPayment(
            mockTenantId,
            mockUserId,
            mockBranchId,
            'pay-1',
            { gatewayReference: 'gw-ref' },
          ),
        ).rejects.toThrow(
          'Cashier session is closed or was modified concurrently',
        );
      });
    });

    describe('getPaymentHistory', () => {
      it('should return paginated, scoped payment records', async () => {
        prisma.payment.findMany = jest.fn().mockResolvedValue([
          {
            id: 'p1',
            amount: new Prisma.Decimal(100),
            invoice: { order: { patient: {} } },
          },
        ]);
        prisma.payment.count = jest.fn().mockResolvedValue(1);

        const result = await service.getPaymentHistory(
          tenantId,
          branchId,
          10,
          1,
        );

        expect(prisma.payment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              cashierSession: { tenantId, branchId },
              archivedAt: null,
            }),
            take: 10,
            skip: 0,
          }),
        );
        expect(result.payments).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
      });
    });
  });

  describe('getInvoices pagination', () => {
    beforeEach(() => {
      // Clear prisma service mocks for invoice
      jest.restoreAllMocks();
      // Re-stub invoice.findMany
      prisma.invoice.findMany = jest.fn().mockResolvedValue([]);
    });

    it('should apply default max page size when no pageSize provided', async () => {
      await service.getInvoices(mockTenantId, mockBranchId);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should clamp pageSize to max when over limit', async () => {
      await service.getInvoices(mockTenantId, mockBranchId, 500);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should preserve branchId filter', async () => {
      await service.getInvoices(mockTenantId, mockBranchId);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            order: { tenantId: mockTenantId, branchId: mockBranchId },
          }),
        }),
      );
    });

    it('should order by createdAt desc', async () => {
      await service.getInvoices(mockTenantId, mockBranchId);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('should include order and patient relations', async () => {
      await service.getInvoices(mockTenantId, mockBranchId);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { order: { include: { patient: true } } },
        }),
      );
    });
  });

  describe('logReceiptEvent', () => {
    const validDto = {
      paymentId: mockPaymentId,
      eventKey: 'RECEIPT_PRINTED',
      format: 'thermal',
      reason: 'Test print',
    };

    it('should log receipt event for same-branch payment', async () => {
      const mockPayment = {
        id: mockPaymentId,
        tenantId: mockTenantId,
        branchId: mockBranchId,
        invoiceId: mockInvoiceId,
        amount: new Prisma.Decimal(100),
        paymentMethod: 'CASH',
        receiptNumber: 'RCP-001',
      };
      prisma.payment.findFirst = jest.fn().mockResolvedValue(mockPayment);

      await service.logReceiptEvent(
        mockTenantId,
        mockUserId,
        mockBranchId,
        validDto,
      );

      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: mockPaymentId,
          tenantId: mockTenantId,
          branchId: mockBranchId,
          archivedAt: null,
        }),
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'RECEIPT_PRINTED',
          recordType: 'Receipt',
          recordId: mockPaymentId,
        }),
        undefined,
        mockBranchId,
      );
    });

    it('should throw NotFoundException for cross-branch payment', async () => {
      prisma.payment.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        service.logReceiptEvent(
          mockTenantId,
          mockUserId,
          'other-branch-uuid',
          validDto,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: mockPaymentId,
          tenantId: mockTenantId,
          branchId: 'other-branch-uuid',
          archivedAt: null,
        }),
      });
    });

    it('should throw NotFoundException for wrong-tenant payment', async () => {
      prisma.payment.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        service.logReceiptEvent(
          'wrong-tenant-uuid',
          mockUserId,
          mockBranchId,
          validDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject invalid event key', async () => {
      const mockPayment = {
        id: mockPaymentId,
        tenantId: mockTenantId,
        branchId: mockBranchId,
        invoiceId: mockInvoiceId,
        amount: new Prisma.Decimal(100),
        paymentMethod: 'CASH',
      };
      prisma.payment.findFirst = jest.fn().mockResolvedValue(mockPayment);

      await expect(
        service.logReceiptEvent(mockTenantId, mockUserId, mockBranchId, {
          ...validDto,
          eventKey: 'INVALID_KEY',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept RECEIPT_REPRINTED and RECEIPT_EXPORTED event keys', async () => {
      const mockPayment = {
        id: mockPaymentId,
        tenantId: mockTenantId,
        branchId: mockBranchId,
        invoiceId: mockInvoiceId,
        amount: new Prisma.Decimal(100),
        paymentMethod: 'CASH',
      };
      prisma.payment.findFirst = jest.fn().mockResolvedValue(mockPayment);

      await service.logReceiptEvent(mockTenantId, mockUserId, mockBranchId, {
        ...validDto,
        eventKey: 'RECEIPT_REPRINTED',
      });
      expect(audit.log).toHaveBeenCalled();

      await service.logReceiptEvent(mockTenantId, mockUserId, mockBranchId, {
        ...validDto,
        eventKey: 'RECEIPT_EXPORTED',
      });
      expect(audit.log).toHaveBeenCalledTimes(2);
    });
  });

  describe('archived-record operational filtering', () => {
    const mockArchivedPayment = {
      id: mockPaymentId,
      tenantId: mockTenantId,
      branchId: mockBranchId,
      status: 'POSTED',
      amount: new Prisma.Decimal(100),
      archivedAt: new Date('2026-01-01'),
      cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
    };

    it('getInvoices excludes archived invoices (where.archivedAt is null)', async () => {
      prisma.invoice.findMany = jest.fn().mockResolvedValue([]);

      await service.getInvoices(mockTenantId, mockBranchId);

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            order: { tenantId: mockTenantId, branchId: mockBranchId },
            archivedAt: null,
          }),
        }),
      );
    });

    it('getPaymentHistory excludes archived payments', async () => {
      prisma.payment.findMany = jest.fn().mockResolvedValue([]);
      prisma.payment.count = jest.fn().mockResolvedValue(0);

      await service.getPaymentHistory(mockTenantId, mockBranchId);

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
            archivedAt: null,
          }),
        }),
      );
      expect(prisma.payment.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cashierSession: { tenantId: mockTenantId, branchId: mockBranchId },
            archivedAt: null,
          }),
        }),
      );
    });

    it('requestRefund rejects archived payment (findFirst returns null)', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.requestRefund(mockTenantId, mockUserId, mockBranchId, {
          paymentId: mockPaymentId,
          amount: 50,
          reason: 'valid reason',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.payment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: mockPaymentId,
            cashierSession: {
              tenantId: mockTenantId,
              branchId: mockBranchId,
            },
            archivedAt: null,
          }),
        }),
      );
    });

    it('requestVoid rejects archived payment (findFirst returns null)', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.requestVoid(mockTenantId, mockUserId, mockBranchId, {
          paymentId: mockPaymentId,
          reason: 'valid reason',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.payment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: mockPaymentId,
            cashierSession: {
              tenantId: mockTenantId,
              branchId: mockBranchId,
            },
            archivedAt: null,
          }),
        }),
      );
    });

    it('confirmPayment rejects archived payment', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.confirmPayment(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockPaymentId,
          { gatewayProvider: 'QRPH' } as any,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.payment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: mockPaymentId,
            cashierSession: {
              tenantId: mockTenantId,
              branchId: mockBranchId,
            },
            archivedAt: null,
          }),
        }),
      );
    });

    it('failPayment rejects archived payment', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.failPayment(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockPaymentId,
          { failureReason: 'test' } as any,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.payment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: mockPaymentId,
            cashierSession: {
              tenantId: mockTenantId,
              branchId: mockBranchId,
            },
            archivedAt: null,
          }),
        }),
      );
    });

    it('expirePayment rejects archived payment', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.expirePayment(
          mockTenantId,
          mockUserId,
          mockBranchId,
          mockPaymentId,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.payment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: mockPaymentId,
            cashierSession: {
              tenantId: mockTenantId,
              branchId: mockBranchId,
            },
            archivedAt: null,
          }),
        }),
      );
    });
  });
});
