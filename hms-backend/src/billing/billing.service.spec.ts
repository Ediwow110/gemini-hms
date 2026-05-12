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
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      invoice: {
        updateMany: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      order: {
        updateMany: jest.fn(),
      },
      approvalRequest: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
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
      cashierSession: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
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
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce({
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
        .mockResolvedValueOnce(lowPaidInvoice)
        .mockResolvedValueOnce({
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
        .mockResolvedValue(mockResult);
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
        .mockResolvedValue(mockResult);
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
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce({
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
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockPaymentId,
          status: 'POSTED',
          cashierSession: {
            tenantId: mockTenantId,
            branchId: mockBranchId,
          },
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
      });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'SESSION_OPENED' }),
        expect.anything(),
        mockBranchId,
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
      audit = { log: jest.fn() };

      prisma = {
        invoice: {
          findFirst: jest.fn(),
          updateMany: jest.fn(),
        },
        cashierSession: {
          findFirst: jest.fn(),
        },
        payment: {
          create: jest.fn(),
        },
        order: {
          updateMany: jest.fn(),
        },
        $transaction: jest.fn().mockImplementation((cb: any) => cb(prisma)),
      };

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
        ],
      }).compile();

      service = module.get<BillingService>(BillingService);
    });

    it('rolls back scoped invoice update failure (no concurrent row)', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
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
      });
      prisma.cashierSession.findFirst.mockResolvedValue({ id: sessionId });
      prisma.payment.create.mockResolvedValue({ id: 'pay-a' });
      prisma.invoice.updateMany.mockResolvedValue({ count: 0 });

      const dto = {
        invoiceId,
        cashierSessionId: sessionId,
        amount: 50,
        paymentMethod: 'CASH',
        idempotencyKey: 'idem-1',
      };

      await expect(
        service.postPayment(tenantId, userId, branchId, dto),
      ).rejects.toThrow(ConflictException);

      expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
        where: {
          id: invoiceId,
          order: { tenantId, branchId },
        },
        data: expect.objectContaining({
          paidAmount: 50,
          status: 'PARTIALLY_PAID',
        }),
      });
    });

    it('scopes invoice and audit on successful partial payment', async () => {
      prisma.invoice.findFirst
        .mockResolvedValueOnce({
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
        })
        .mockResolvedValueOnce({
          id: invoiceId,
          orderId: 'order-a',
          paidAmount: new Prisma.Decimal(50),
          totalAmount: new Prisma.Decimal(100),
          status: 'PARTIALLY_PAID',
        });
      prisma.cashierSession.findFirst.mockResolvedValue({ id: sessionId });
      prisma.payment.create.mockResolvedValue({ id: 'pay-a' });
      prisma.invoice.updateMany.mockResolvedValue({ count: 1 });

      const dto = {
        invoiceId,
        cashierSessionId: sessionId,
        amount: 50,
        paymentMethod: 'CASH',
        idempotencyKey: 'idem-2',
      };

      await service.postPayment(tenantId, userId, branchId, dto);

      expect(prisma.payment.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'PAYMENT_POSTED',
        }),
        expect.anything(),
        branchId,
      );
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });
  });
});
