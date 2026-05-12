import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { NumberingService } from '../numbering/numbering.service';
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

  beforeEach(async () => {
    prisma = {
      payment: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      invoice: {
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      approvalRequest: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      paymentReversal: {
        create: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest
        .fn()
        .mockImplementation(async (cb) => await cb(prisma)),
    };

    audit = {
      log: jest.fn(),
    };

    approvals = {
      createRequest: jest.fn().mockResolvedValue({ id: 'req-uuid' }),
    };

    const numbering = {
      generateNumber: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: ApprovalsService, useValue: approvals },
        { provide: NumberingService, useValue: numbering },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
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

      prisma.paymentReversal.findUnique.mockResolvedValue(mockReversal);
      prisma.approvalRequest.findUnique.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.paymentReversal.findMany.mockResolvedValue([]);
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });
      prisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        paidAmount: 100,
        status: 'PARTIALLY_PAID',
      });

      const result = await service.applyRefund(
        mockTenantId,
        mockUserId,
        mockBranchId,
        mockReversalId,
      );

      expect(result.reversal.status).toBe('APPLIED');
      expect(result.invoice.paidAmount).toBe(100);
      expect(prisma.paymentReversal.updateMany).toHaveBeenCalled();
      expect(prisma.invoice.update).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'REFUND_APPLIED',
          recordId: mockReversalId,
        }),
        expect.anything(),
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
      prisma.paymentReversal.findUnique.mockResolvedValue(mockReversal);
      prisma.approvalRequest.findUnique.mockResolvedValue({
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
      prisma.paymentReversal.findUnique.mockResolvedValue(mockReversal);
      prisma.approvalRequest.findUnique.mockResolvedValue({
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
      prisma.paymentReversal.findUnique.mockResolvedValue(mockReversal);
      prisma.approvalRequest.findUnique.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.paymentReversal.findMany.mockResolvedValue([
        { amount: new Prisma.Decimal(150), status: 'APPLIED' },
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
      prisma.paymentReversal.findUnique.mockResolvedValue(mockReversal);
      prisma.approvalRequest.findUnique.mockResolvedValue(mockApproval);
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
      prisma.paymentReversal.findUnique.mockResolvedValue(mockReversal);

      const lowPaidInvoice = {
        ...mockInvoice,
        paidAmount: new Prisma.Decimal(100),
      };
      prisma.approvalRequest.findUnique.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst.mockResolvedValue(lowPaidInvoice);
      prisma.paymentReversal.findMany.mockResolvedValue([]);
      prisma.invoice.update.mockResolvedValue({
        ...lowPaidInvoice,
        paidAmount: new Prisma.Decimal(0),
        status: 'UNPAID',
      });
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.applyRefund(
        mockTenantId,
        mockUserId,
        mockBranchId,
        mockReversalId,
      );

      expect(result.invoice.status).toBe('UNPAID');
    });
  });

  describe('applyReversal', () => {
    it('should dispatch to applyRefund if type is REFUND', async () => {
      const spy = jest
        .spyOn(service, 'applyRefund')
        .mockResolvedValue(null as never);
      prisma.paymentReversal.findFirst.mockResolvedValue({
        type: 'REFUND',
      });
      await service.applyReversal('tenant', 'user', 'branch', 'rev-id');
      expect(spy).toHaveBeenCalledWith('tenant', 'user', 'branch', 'rev-id');
      spy.mockRestore();
    });

    it('should dispatch to applyVoid if type is PAYMENT_VOID', async () => {
      const spy = jest
        .spyOn(service, 'applyVoid')
        .mockResolvedValue(null as never);
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

      prisma.approvalRequest.findUnique.mockResolvedValue(mockApproval);
      prisma.payment.findFirst.mockResolvedValue(mockPayment);
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      prisma.paymentReversal.updateMany.mockResolvedValue({ count: 1 });

      prisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        paidAmount: new Prisma.Decimal(0),
        status: 'UNPAID',
      });
      prisma.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'VOIDED',
      });

      const result = await service.applyVoid(
        mockTenantId,
        mockUserId,
        mockBranchId,
        mockReversalId,
      );

      expect(result.reversal.status).toBe('APPLIED');
      expect(result.invoice.paidAmount).toEqual(new Prisma.Decimal(0));
      expect(result.invoice.status).toBe('UNPAID');
      expect(prisma.paymentReversal.updateMany).toHaveBeenCalled();
      expect(prisma.invoice.update).toHaveBeenCalled();
      expect(prisma.payment.update).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'PAYMENT_VOID_APPLIED',
          recordId: mockReversalId,
          newValues: expect.objectContaining({
            paymentStatus: 'VOIDED',
          }),
        }),
        expect.anything(),
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
      prisma.approvalRequest.findUnique.mockResolvedValue({
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
      prisma.approvalRequest.findUnique.mockResolvedValue({
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
      prisma.approvalRequest.findUnique.mockResolvedValue(mockApproval);
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
      prisma.approvalRequest.findUnique.mockResolvedValue(mockApproval);
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

      prisma.approvalRequest.findUnique.mockResolvedValue(mockApproval);
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

      prisma.approvalRequest.findUnique.mockResolvedValue(mockApproval);
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

      prisma.approvalRequest.findUnique.mockResolvedValue(mockApproval);
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
  });
});
