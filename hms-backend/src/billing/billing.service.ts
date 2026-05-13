import {
  Injectable,
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreatePaymentDto,
  OpenSessionDto,
  CloseSessionDto,
} from './dto/payment.dto';
import { RefundRequestDto, VoidRequestDto } from './dto/reversal.dto';
import { ApprovalsService } from '../approvals/approvals.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { computePaymentFingerprint } from './utils/idempotency';

export const REVERSAL_TYPE = {
  REFUND: 'REFUND',
  VOID: 'PAYMENT_VOID',
} as const;

export const REVERSAL_STATUS = {
  PENDING: 'PENDING',
  APPLIED: 'APPLIED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private numbering: NumberingService,
    private approvals: ApprovalsService,
  ) {}

  async postPayment(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: CreatePaymentDto,
    idempotencyKey: string,
  ) {
    // 1. Validate Idempotency-Key is present
    if (!idempotencyKey || !idempotencyKey.trim()) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const OPERATION = 'BILLING_PAYMENT_POST';

    // 2. Compute request fingerprint
    const fingerprint = computePaymentFingerprint(tenantId, OPERATION, dto);

    // 3. Look up existing IdempotencyRecord
    let idempotencyRecord = await this.prisma.idempotencyRecord.findUnique({
      where: {
        tenantId_operation_key: {
          tenantId,
          operation: OPERATION,
          key: idempotencyKey,
        },
      },
    });

    let shouldCreateIdempotencyRecord = true;

    // 4. Handle existing idempotency record
    if (idempotencyRecord) {
      if (idempotencyRecord.status === 'COMPLETED') {
        // Verify fingerprint matches
        if (idempotencyRecord.requestFingerprint !== fingerprint) {
          // Same key but different request = fraud/race condition
          throw new ConflictException(
            'Idempotency key already used with different request parameters',
          );
        }
        // Return cached response for identical replay
        const cached = idempotencyRecord.responseData as {
          payment: unknown;
          invoice: unknown;
        } | null;
        return {
          payment: cached?.payment,
          invoice: cached?.invoice,
          _replayed: true,
        };
      } else if (idempotencyRecord.status === 'IN_PROGRESS') {
        // Another request is processing with this key
        throw new ConflictException(
          'Payment creation with this idempotency key is already in progress',
        );
      } else if (idempotencyRecord.status === 'FAILED') {
        if (idempotencyRecord.requestFingerprint !== fingerprint) {
          throw new ConflictException(
            'Idempotency key already used with different request parameters',
          );
        }

        const retryClaim = await this.prisma.idempotencyRecord.updateMany({
          where: {
            id: idempotencyRecord.id,
            status: 'FAILED',
          },
          data: {
            status: 'IN_PROGRESS',
            paymentId: null,
            responseData: Prisma.DbNull,
            error: null,
            updatedAt: new Date(),
          },
        });

        if (retryClaim.count === 0) {
          const currentRecord = await this.prisma.idempotencyRecord.findUnique({
            where: {
              tenantId_operation_key: {
                tenantId,
                operation: OPERATION,
                key: idempotencyKey,
              },
            },
          });

          if (currentRecord?.status === 'COMPLETED') {
            if (currentRecord.requestFingerprint === fingerprint) {
              const cached = currentRecord.responseData as {
                payment: unknown;
                invoice: unknown;
              } | null;
              return {
                payment: cached?.payment,
                invoice: cached?.invoice,
                _replayed: true,
              };
            }

            throw new ConflictException(
              'Idempotency key already used with different request parameters',
            );
          }

          throw new ConflictException(
            'Payment creation with this idempotency key is already in progress',
          );
        }

        shouldCreateIdempotencyRecord = false;
      }
    }

    // 5. Create new IdempotencyRecord with IN_PROGRESS status
    if (shouldCreateIdempotencyRecord) {
      try {
        idempotencyRecord = await this.prisma.idempotencyRecord.create({
          data: {
            tenantId,
            operation: OPERATION,
            key: idempotencyKey,
            requestFingerprint: fingerprint,
            status: 'IN_PROGRESS',
          },
        });
      } catch (error) {
        // Race condition: another request created the record
        if (error.code === 'P2002') {
          // Fetch the record that was just created by another request
          const raceRecord = await this.prisma.idempotencyRecord.findUnique({
            where: {
              tenantId_operation_key: {
                tenantId,
                operation: OPERATION,
                key: idempotencyKey,
              },
            },
          });

          if (raceRecord) {
            if (raceRecord.status === 'COMPLETED') {
              if (raceRecord.requestFingerprint === fingerprint) {
                const cached = raceRecord.responseData as {
                  payment: unknown;
                  invoice: unknown;
                } | null;
                return {
                  payment: cached?.payment,
                  invoice: cached?.invoice,
                  _replayed: true,
                };
              } else {
                throw new ConflictException(
                  'Idempotency key already used with different request parameters',
                );
              }
            } else if (raceRecord.status === 'IN_PROGRESS') {
              throw new ConflictException(
                'Payment creation with this idempotency key is already in progress',
              );
            }
          }
        }
        throw error;
      }
    }

    try {
      // 6. Verify invoice belongs to tenant AND branch
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          id: dto.invoiceId,
          order: { tenantId, branchId },
        },
        include: { order: true },
      });

      if (!invoice) {
        throw new BadRequestException('Invoice not found or access denied');
      }

      if (invoice.status === 'PAID') {
        throw new ConflictException('Invoice is already fully paid');
      }

      // 7. Verify cashier session belongs to tenant AND branch AND user
      const session = await this.prisma.cashierSession.findFirst({
        where: {
          id: dto.cashierSessionId,
          tenantId,
          branchId,
          userId,
          status: 'OPEN',
        },
      });

      if (!session) {
        throw new BadRequestException(
          'Active cashier session not found or unauthorized',
        );
      }

      // 8. START TRANSACTION (Section 13 Boundary: Post Payment)
      const result = await this.prisma.$transaction(async (tx) => {
        // 9. Generate Receipt Number
        const receiptNumber = await this.numbering.generateNumber(
          tenantId,
          'RECEIPT',
          branchId,
        );

        // 10. Create Payment record
        try {
          const payment = await tx.payment.create({
            data: {
              invoiceId: dto.invoiceId,
              cashierSessionId: dto.cashierSessionId,
              receiptNumber,
              amount: dto.amount,
              paymentMethod: dto.paymentMethod,
              idempotencyKey,
              status: 'POSTED',
            },
          });

          // 11. Update Invoice
          const newPaidAmount = Number(invoice.paidAmount) + dto.amount;
          const newStatus =
            newPaidAmount >= Number(invoice.totalAmount)
              ? 'PAID'
              : 'PARTIALLY_PAID';

          const invoiceUpdate = await tx.invoice.updateMany({
            where: {
              id: dto.invoiceId,
              order: { tenantId, branchId },
            },
            data: {
              paidAmount: newPaidAmount,
              status: newStatus,
            },
          });

          if (invoiceUpdate.count === 0) {
            throw new ConflictException(
              'Invoice not found in this branch or was modified concurrently',
            );
          }

          const updatedInvoice = await tx.invoice.findFirst({
            where: { id: dto.invoiceId, order: { tenantId, branchId } },
          });

          if (!updatedInvoice) {
            throw new ConflictException(
              'Invoice not found in this branch or was modified concurrently',
            );
          }

          // 12. Update Order Status (Revenue Cycle Logic)
          if (newStatus === 'PAID') {
            const orderUpdate = await tx.order.updateMany({
              where: { id: invoice.orderId, tenantId, branchId },
              data: { status: 'PAID' },
            });

            if (orderUpdate.count === 0) {
              throw new ConflictException(
                'Order not found in this branch or was modified concurrently',
              );
            }
          }

          // 13. Log Audit Event (PAYMENT_POSTED) - First request only (via idempotency record)
          await this.audit.log(
            {
              tenantId,
              userId,
              eventKey: 'PAYMENT_POSTED',
              recordType: 'Payment',
              recordId: payment.id,
              newValues: { payment, invoiceStatus: newStatus },
            },
            tx,
            branchId,
          );

          await tx.idempotencyRecord.update({
            where: { id: idempotencyRecord!.id },
            data: {
              status: 'COMPLETED',
              paymentId: payment.id,
              responseData: {
                payment,
                invoice: updatedInvoice,
              },
            },
          });

          return { payment, invoice: updatedInvoice };
        } catch (error) {
          if (error.code === 'P2002') {
            throw new ConflictException(
              'Duplicate payment detected (Idempotency Key violation)',
            );
          }
          throw error;
        }
      });

      return result;
    } catch (error) {
      const clientError = this.normalizePostPaymentError(error);

      // The FAILED state is only valid while this request still owns IN_PROGRESS.
      await this.prisma.idempotencyRecord.updateMany({
        where: { id: idempotencyRecord!.id, status: 'IN_PROGRESS' },
        data: {
          status: 'FAILED',
          error: 'Payment request failed before completion',
          updatedAt: new Date(),
        },
      });

      throw clientError;
    }
  }

  private normalizePostPaymentError(error: unknown) {
    if (error instanceof HttpException) {
      return error;
    }

    return new InternalServerErrorException(
      'Payment request failed before completion',
    );
  }

  async requestRefund(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: RefundRequestDto,
  ) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException('A reason is required for refund requests');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Refund amount must be positive');
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        id: dto.paymentId,
        cashierSession: {
          tenantId,
          branchId,
        },
      },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found or access denied');
    }

    if (payment.status !== 'POSTED') {
      throw new BadRequestException(
        `Payment status must be POSTED to be refunded (current: ${payment.status})`,
      );
    }

    // Calculate current reversible amount
    const reversals = await this.prisma.paymentReversal.findMany({
      where: {
        paymentId: payment.id,
        tenantId,
        branchId,
        status: { in: [REVERSAL_STATUS.PENDING, REVERSAL_STATUS.APPLIED] },
      },
    });

    const currentReversedAmount = reversals.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );

    if (dto.amount + currentReversedAmount > Number(payment.amount)) {
      throw new BadRequestException(
        `Refund amount ₱${dto.amount} exceeds remaining reversible amount ₱${
          Number(payment.amount) - currentReversedAmount
        }`,
      );
    }

    // Block duplicate pending refund requests for this payment
    const pending = await this.prisma.approvalRequest.findFirst({
      where: {
        tenantId,
        recordId: payment.id,
        type: REVERSAL_TYPE.REFUND,
        status: 'PENDING',
      },
    });

    if (pending) {
      throw new ConflictException(
        'A refund request for this payment is already pending approval',
      );
    }

    const request = await this.prisma.$transaction(async (tx) => {
      const approvalReq = await this.approvals.createRequest(
        tenantId,
        userId,
        {
          type: REVERSAL_TYPE.REFUND,
          riskLevel: dto.amount > 1000 ? 'HIGH' : 'MEDIUM',
          recordId: payment.id,
          reason: dto.reason,
          details: {
            action: REVERSAL_TYPE.REFUND,
            paymentId: payment.id,
            invoiceId: payment.invoice?.id ?? payment.invoiceId,
            amount: dto.amount,
            tenantId,
            branchId,
            requesterId: userId,
          },
        },
        tx,
      );

      await tx.paymentReversal.create({
        data: {
          tenantId,
          branchId,
          paymentId: payment.id,
          invoiceId: payment.invoiceId,
          approvalRequestId: approvalReq.id,
          amount: dto.amount,
          type: REVERSAL_TYPE.REFUND,
          status: REVERSAL_STATUS.PENDING,
          reason: dto.reason,
          requestedBy: userId,
        },
      });

      // Domain-specific audit event
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'REFUND_REQUESTED',
          recordType: 'Payment',
          recordId: payment.id,
          newValues: {
            approvalRequestId: approvalReq.id,
            amount: dto.amount,
            reason: dto.reason,
          },
        },
        tx,
        branchId,
      );

      return approvalReq;
    });

    return request;
  }

  async requestVoid(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: VoidRequestDto,
  ) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException(
        'A reason is required for payment void requests',
      );
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        id: dto.paymentId,
        cashierSession: {
          tenantId,
          branchId,
        },
      },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found or access denied');
    }

    if (payment.status !== 'POSTED') {
      throw new BadRequestException(
        `Payment status must be POSTED to be voided (current: ${payment.status})`,
      );
    }

    // Block void if any pending or applied reversal exists
    const existingReversal = await this.prisma.paymentReversal.findFirst({
      where: {
        paymentId: payment.id,
        status: { in: [REVERSAL_STATUS.PENDING, REVERSAL_STATUS.APPLIED] },
      },
    });

    if (existingReversal) {
      throw new ConflictException(
        'Payment cannot be voided because a refund or void request is already pending or applied',
      );
    }

    const request = await this.prisma.$transaction(async (tx) => {
      const approvalReq = await this.approvals.createRequest(
        tenantId,
        userId,
        {
          type: REVERSAL_TYPE.VOID,
          riskLevel: 'HIGH',
          recordId: payment.id,
          reason: dto.reason,
          details: {
            action: REVERSAL_TYPE.VOID,
            paymentId: payment.id,
            invoiceId: payment.invoice?.id ?? payment.invoiceId,
            tenantId,
            branchId,
            requesterId: userId,
          },
        },
        tx,
      );

      await tx.paymentReversal.create({
        data: {
          tenantId,
          branchId,
          paymentId: payment.id,
          invoiceId: payment.invoiceId,
          approvalRequestId: approvalReq.id,
          amount: Number(payment.amount),
          type: REVERSAL_TYPE.VOID,
          status: REVERSAL_STATUS.PENDING,
          reason: dto.reason,
          requestedBy: userId,
        },
      });

      // Domain-specific audit event
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'PAYMENT_VOID_REQUESTED',
          recordType: 'Payment',
          recordId: payment.id,
          newValues: {
            approvalRequestId: approvalReq.id,
            reason: dto.reason,
          },
        },
        tx,
        branchId,
      );

      return approvalReq;
    });

    return request;
  }

  async getInvoices(tenantId: string, branchId: string) {
    return this.prisma.invoice.findMany({
      where: {
        order: { tenantId, branchId },
      },
      include: {
        order: {
          include: { patient: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async applyReversal(
    tenantId: string,
    userId: string,
    branchId: string,
    reversalId: string,
  ) {
    const reversal = await this.prisma.paymentReversal.findFirst({
      where: {
        id: reversalId,
        tenantId,
        branchId,
      },
    });

    if (!reversal) {
      throw new NotFoundException(
        'Payment reversal not found or access denied',
      );
    }

    if (reversal.type === REVERSAL_TYPE.REFUND) {
      return this.applyRefund(tenantId, userId, branchId, reversalId);
    } else if (reversal.type === REVERSAL_TYPE.VOID) {
      return this.applyVoid(tenantId, userId, branchId, reversalId);
    } else {
      throw new BadRequestException(
        'Unsupported reversal type for application',
      );
    }
  }

  async applyVoid(
    tenantId: string,
    userId: string,
    branchId: string,
    reversalId: string,
  ) {
    // 1. Fetch the reversal and verify basic eligibility
    const reversal = await this.prisma.paymentReversal.findFirst({
      where: {
        id: reversalId,
        tenantId,
        branchId,
      },
    });

    if (!reversal) {
      throw new NotFoundException(
        'Payment reversal not found or access denied',
      );
    }

    if (reversal.type !== REVERSAL_TYPE.VOID) {
      throw new BadRequestException(
        'This endpoint only supports applying voids',
      );
    }

    if (reversal.status !== REVERSAL_STATUS.PENDING) {
      throw new ConflictException(
        `Reversal is already ${reversal.status} and cannot be applied`,
      );
    }

    // 2. Verify Approval status
    const approvalRequest = await this.prisma.approvalRequest.findFirst({
      where: { id: reversal.approvalRequestId, tenantId },
    });

    if (!approvalRequest) {
      throw new NotFoundException('Associated approval request not found');
    }

    if (approvalRequest.status !== 'APPROVED') {
      throw new BadRequestException(
        `Approval request must be APPROVED to apply reversal (current: ${approvalRequest.status})`,
      );
    }

    if (approvalRequest.requesterId === userId) {
      throw new BadRequestException(
        'You cannot apply a reversal you requested',
      );
    }

    // 3. Fetch and verify Payment & Invoice
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: reversal.paymentId,
        cashierSession: { tenantId, branchId },
      },
    });

    if (!payment) {
      throw new NotFoundException(
        'Underlying payment not found or access denied',
      );
    }

    if (payment.status !== 'POSTED') {
      throw new BadRequestException(
        `Payment must be POSTED to be voided (current: ${payment.status})`,
      );
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: reversal.invoiceId,
        order: { tenantId, branchId },
      },
    });

    if (!invoice) {
      throw new NotFoundException(
        'Underlying invoice not found or access denied',
      );
    }

    // 4. Transactional Mutation
    return this.prisma.$transaction(async (tx) => {
      // Lock reversal and verify status again (Race condition protection)
      const updateResult = await tx.paymentReversal.updateMany({
        where: {
          id: reversalId,
          tenantId,
          branchId,
          status: REVERSAL_STATUS.PENDING,
        },
        data: {
          status: REVERSAL_STATUS.APPLIED,
          appliedBy: userId,
          appliedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Reversal has already been processed or was modified',
        );
      }

      // Check if any other VOID is APPLIED or PENDING for this payment
      const otherVoid = await tx.paymentReversal.findFirst({
        where: {
          paymentId: payment.id,
          type: REVERSAL_TYPE.VOID,
          status: { in: [REVERSAL_STATUS.APPLIED, REVERSAL_STATUS.PENDING] },
          id: { not: reversalId }, // Exclude current
        },
      });

      if (otherVoid) {
        throw new ConflictException(
          'Payment cannot be voided because another void reversal is pending or applied',
        );
      }

      // Check if any REFUND is APPLIED or PENDING for this payment
      const refundReversal = await tx.paymentReversal.findFirst({
        where: {
          paymentId: payment.id,
          type: REVERSAL_TYPE.REFUND,
          status: { in: [REVERSAL_STATUS.APPLIED, REVERSAL_STATUS.PENDING] },
        },
      });

      if (refundReversal) {
        throw new ConflictException(
          'Payment cannot be voided because a refund reversal is pending or applied',
        );
      }

      const voidAmount = reversal.amount;
      const beforePaidAmount = invoice.paidAmount;
      const afterPaidAmount = beforePaidAmount.sub(voidAmount);

      if (afterPaidAmount.lt(0)) {
        throw new BadRequestException(
          'Void would result in negative paid amount',
        );
      }

      // Recalculate Invoice Status
      let newStatus = 'PARTIALLY_PAID';
      if (afterPaidAmount.lte(0)) {
        newStatus = 'UNPAID';
      } else if (afterPaidAmount.gte(invoice.totalAmount)) {
        newStatus = 'PAID';
      }

      const beforeInvoiceStatus = invoice.status;

      // Update Invoice
      const invoiceUpdate = await tx.invoice.updateMany({
        where: { id: invoice.id, order: { tenantId, branchId } },
        data: {
          paidAmount: afterPaidAmount,
          status: newStatus,
        },
      });

      if (invoiceUpdate.count === 0) {
        throw new ConflictException(
          'Invoice not found in this branch or was modified concurrently',
        );
      }

      const updatedInvoice = await tx.invoice.findFirst({
        where: { id: invoice.id, order: { tenantId, branchId } },
      });

      if (!updatedInvoice) {
        throw new ConflictException(
          'Invoice not found in this branch or was modified concurrently',
        );
      }

      // Mark payment as VOIDED
      const paymentVoided = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: 'POSTED',
          cashierSession: { tenantId, branchId },
        },
        data: { status: 'VOIDED' },
      });

      if (paymentVoided.count === 0) {
        throw new ConflictException(
          'Payment not found in this branch, not POSTED, or was modified concurrently',
        );
      }

      // Mark approval request as APPLIED (post-approval execution)
      const appliedApproval = await tx.approvalRequest.updateMany({
        where: {
          id: approvalRequest.id,
          tenantId,
          status: 'APPROVED',
        },
        data: { status: 'APPLIED' },
      });

      if (appliedApproval.count === 0) {
        throw new ConflictException(
          'Approval request not found, not APPROVED, or was modified concurrently',
        );
      }

      // Log Audit Event (PAYMENT_VOID_APPLIED)
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'PAYMENT_VOID_APPLIED',
          recordType: 'PaymentReversal',
          recordId: reversalId,
          oldValues: {
            reversalStatus: REVERSAL_STATUS.PENDING,
            invoicePaidAmount: beforePaidAmount.toString(),
            invoiceStatus: beforeInvoiceStatus,
            paymentStatus: payment.status,
          },
          newValues: {
            branchId,
            paymentId: payment.id,
            invoiceId: invoice.id,
            paymentReversalId: reversalId,
            approvalRequestId: approvalRequest.id,
            reason: reversal.reason,
            reversalStatus: REVERSAL_STATUS.APPLIED,
            invoicePaidAmount: afterPaidAmount.toString(),
            invoiceStatus: newStatus,
            appliedBy: userId,
            voidAmount: voidAmount.toString(),
            paymentStatus: 'VOIDED',
          },
        },
        tx,
        branchId,
      );

      return {
        reversal: { ...reversal, status: REVERSAL_STATUS.APPLIED },
        invoice: updatedInvoice,
      };
    });
  }

  async applyRefund(
    tenantId: string,
    userId: string,
    branchId: string,
    reversalId: string,
  ) {
    // 1. Fetch the reversal and verify basic eligibility
    const reversal = await this.prisma.paymentReversal.findFirst({
      where: {
        id: reversalId,
        tenantId,
        branchId,
      },
    });

    if (!reversal) {
      throw new NotFoundException(
        'Payment reversal not found or access denied',
      );
    }

    if (reversal.type !== REVERSAL_TYPE.REFUND) {
      throw new BadRequestException(
        'This endpoint only supports applying refunds',
      );
    }

    if (reversal.status !== REVERSAL_STATUS.PENDING) {
      throw new ConflictException(
        `Reversal is already ${reversal.status} and cannot be applied`,
      );
    }

    // 2. Verify Approval status
    const approvalRequest = await this.prisma.approvalRequest.findFirst({
      where: { id: reversal.approvalRequestId, tenantId },
    });

    if (!approvalRequest) {
      throw new NotFoundException('Associated approval request not found');
    }

    if (approvalRequest.status !== 'APPROVED') {
      throw new BadRequestException(
        `Approval request must be APPROVED to apply reversal (current: ${approvalRequest.status})`,
      );
    }

    if (approvalRequest.requesterId === userId) {
      throw new BadRequestException(
        'You cannot apply a reversal you requested',
      );
    }

    // 3. Fetch and verify Payment & Invoice
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: reversal.paymentId,
        cashierSession: { tenantId, branchId },
      },
    });

    if (!payment) {
      throw new NotFoundException(
        'Underlying payment not found or access denied',
      );
    }

    if (payment.status !== 'POSTED') {
      throw new BadRequestException(
        `Payment must be POSTED to be refunded (current: ${payment.status})`,
      );
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: reversal.invoiceId,
        order: { tenantId, branchId },
      },
    });

    if (!invoice) {
      throw new NotFoundException(
        'Underlying invoice not found or access denied',
      );
    }

    // 4. Transactional Mutation
    return this.prisma.$transaction(async (tx) => {
      // Lock reversal and verify status again (Race condition protection)
      // Use updateMany for atomic status check and update (Conditional Update)
      const updateResult = await tx.paymentReversal.updateMany({
        where: {
          id: reversalId,
          tenantId,
          branchId,
          status: REVERSAL_STATUS.PENDING,
        },
        data: {
          status: REVERSAL_STATUS.APPLIED,
          appliedBy: userId,
          appliedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Reversal has already been processed or was modified',
        );
      }

      // Check if any VOID has already been applied or is pending for this payment
      const voidReversal = await tx.paymentReversal.findFirst({
        where: {
          paymentId: payment.id,
          type: REVERSAL_TYPE.VOID,
          status: { in: [REVERSAL_STATUS.APPLIED, REVERSAL_STATUS.PENDING] },
        },
      });

      if (voidReversal) {
        throw new ConflictException(
          'Payment cannot be refunded because a void is pending or applied',
        );
      }

      // Recalculate currently applied refunds to verify remaining balance
      const appliedRefunds = await tx.paymentReversal.findMany({
        where: {
          paymentId: payment.id,
          type: REVERSAL_TYPE.REFUND,
          status: REVERSAL_STATUS.APPLIED,
        },
      });

      const totalApplied = appliedRefunds.reduce(
        (sum, r) => sum.add(r.amount),
        new Prisma.Decimal(0),
      );

      const refundAmount = reversal.amount;
      if (totalApplied.add(refundAmount).gt(payment.amount)) {
        const remaining = payment.amount.sub(totalApplied).toString();
        throw new BadRequestException(
          `Refund amount ₱${refundAmount.toString()} exceeds remaining refundable balance ₱${remaining}`,
        );
      }

      const beforePaidAmount = invoice.paidAmount;
      const afterPaidAmount = beforePaidAmount.sub(refundAmount);

      if (afterPaidAmount.lt(0)) {
        throw new BadRequestException(
          'Refund would result in negative paid amount',
        );
      }

      // Recalculate Invoice Status
      let newStatus = 'PARTIALLY_PAID';
      if (afterPaidAmount.lte(0)) {
        newStatus = 'UNPAID';
      } else if (afterPaidAmount.gte(invoice.totalAmount)) {
        newStatus = 'PAID';
      }

      const beforeInvoiceStatus = invoice.status;

      // Update Invoice
      const invoiceUpdate = await tx.invoice.updateMany({
        where: { id: invoice.id, order: { tenantId, branchId } },
        data: {
          paidAmount: afterPaidAmount,
          status: newStatus,
        },
      });

      if (invoiceUpdate.count === 0) {
        throw new ConflictException(
          'Invoice not found in this branch or was modified concurrently',
        );
      }

      const updatedInvoice = await tx.invoice.findFirst({
        where: { id: invoice.id, order: { tenantId, branchId } },
      });

      if (!updatedInvoice) {
        throw new ConflictException(
          'Invoice not found in this branch or was modified concurrently',
        );
      }

      const appliedApproval = await tx.approvalRequest.updateMany({
        where: {
          id: approvalRequest.id,
          tenantId,
          status: 'APPROVED',
        },
        data: { status: 'APPLIED' },
      });

      if (appliedApproval.count === 0) {
        throw new ConflictException(
          'Approval request not found, not APPROVED, or was modified concurrently',
        );
      }

      // Log Audit Event (REFUND_APPLIED)
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'REFUND_APPLIED',
          recordType: 'PaymentReversal',
          recordId: reversalId,
          oldValues: {
            reversalStatus: REVERSAL_STATUS.PENDING,
            invoicePaidAmount: beforePaidAmount.toString(),
            invoiceStatus: beforeInvoiceStatus,
          },
          newValues: {
            reversalStatus: REVERSAL_STATUS.APPLIED,
            invoicePaidAmount: afterPaidAmount.toString(),
            invoiceStatus: newStatus,
            appliedBy: userId,
            refundAmount: refundAmount.toString(),
          },
        },
        tx,
        branchId,
      );

      return {
        reversal: { ...reversal, status: REVERSAL_STATUS.APPLIED },
        invoice: updatedInvoice,
      };
    });
  }

  // --- Cashier Session Management ---

  async openSession(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: OpenSessionDto,
  ) {
    // 1. Check if user already has an open session IN THIS BRANCH
    const existing = await this.prisma.cashierSession.findFirst({
      where: { tenantId, userId, branchId, status: 'OPEN' },
    });

    if (existing) {
      throw new ConflictException(
        'You already have an open cashier session in this branch',
      );
    }

    // 2. Create the session and audit atomically
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.cashierSession.create({
        data: {
          tenantId,
          branchId,
          userId,
          openingBalance: dto.openingBalance,
          status: 'OPEN',
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'SESSION_OPENED',
          recordType: 'CashierSession',
          recordId: session.id,
          newValues: { openingBalance: dto.openingBalance, branchId },
        },
        tx,
        branchId,
      );

      return session;
    });
  }

  async closeSession(
    tenantId: string,
    userId: string,
    branchId: string,
    sessionId: string,
    dto: CloseSessionDto,
  ) {
    const session = await this.prisma.cashierSession.findFirst({
      where: { id: sessionId, tenantId, userId, branchId, status: 'OPEN' },
      include: {
        payments: {
          include: {
            reversals: {
              where: { status: 'APPLIED' },
            },
          },
        },
      },
    });

    if (!session) {
      throw new BadRequestException(
        'Active session not found or already closed in this branch',
      );
    }

    // 1. Calculate Expected Balance
    // Sum all cash payments (assuming we only track cash in the drawer variance)
    // Exclude VOIDED payments and subtract APPLIED refunds to reconcile net revenue
    const cashPayments = session.payments
      .filter((p) => p.paymentMethod === 'CASH' && p.status === 'POSTED')
      .reduce((sum, p) => {
        const paymentAmount = Number(p.amount);
        const refunds = p.reversals
          .filter((r) => r.type === 'REFUND')
          .reduce((rSum, r) => rSum + Number(r.amount), 0);
        return sum + (paymentAmount - refunds);
      }, 0);

    const expectedCash = Number(session.openingBalance) + cashPayments;
    const variance = dto.actualClosingBalance - expectedCash;

    if (variance !== 0 && !dto.remarks) {
      throw new BadRequestException(
        'Remarks are required when there is a cash variance',
      );
    }

    // 2. Close the session in a transaction
    return this.prisma.$transaction(async (tx) => {
      const closeSessionResult = await tx.cashierSession.updateMany({
        where: {
          id: sessionId,
          tenantId,
          branchId,
          userId,
          status: 'OPEN',
        },
        data: {
          status: 'CLOSED',
          closingBalance: dto.actualClosingBalance,
          closedAt: new Date(),
        },
      });

      if (closeSessionResult.count === 0) {
        throw new BadRequestException(
          'Active session not found or already closed in this branch',
        );
      }

      const closed = await tx.cashierSession.findFirst({
        where: {
          id: sessionId,
          tenantId,
          branchId,
          userId,
          status: 'CLOSED',
        },
      });

      if (!closed) {
        throw new BadRequestException(
          'Cashier session was not closed or could not be loaded',
        );
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'SESSION_CLOSED',
          recordType: 'CashierSession',
          recordId: sessionId,
          newValues: {
            expectedCash,
            actualCash: dto.actualClosingBalance,
            variance,
            remarks: dto.remarks,
          },
        },
        tx,
        branchId,
      );

      return { session: closed, variance, expectedCash };
    });
  }

  async getActiveSession(tenantId: string, userId: string, branchId: string) {
    return this.prisma.cashierSession.findFirst({
      where: { tenantId, userId, branchId, status: 'OPEN' },
      include: {
        payments: {
          include: {
            invoice: { include: { order: { include: { patient: true } } } },
          },
        },
      },
    });
  }
}
