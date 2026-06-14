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
  ConfirmPaymentDto,
  FailPaymentDto,
  ExpirePaymentDto,
} from './dto/payment.dto';
import { RefundRequestDto, VoidRequestDto } from './dto/reversal.dto';
import { ApprovalsService } from '../approvals/approvals.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { computePaymentFingerprint } from './utils/idempotency';
import { LedgerService } from '../ledger/ledger.service';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  clampTake,
} from '../common/utils/pagination';

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

/**
 * Billing Transaction Lock Order:
 * To prevent deadlocks, all billing transactions MUST acquire row-level locks in this specific order:
 * 1. Invoice (updateMany — status guard / row lock)
 * 2. CashierSession (updateMany — session guard / row lock)
 * 3. Payment (create)
 * 4. CashierLedgerEntry (create)
 * 5. Ledger (postEntry — double-entry accounting)
 * 6. Invoice (update — new paid amount / status)
 * 7. Order (updateMany — status change to PAID)
 * 8. AuditLog (create — PAYMENT_POSTED event)
 * 9. IdempotencyRecord (update — status to COMPLETED)
 */
@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private numbering: NumberingService,
    private approvals: ApprovalsService,
    private ledgerService: LedgerService,
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
        // 8.1 Acquire Row-Level Lock on Invoice
        // This ensures concurrent payments for the same invoice are serialized
        const invoiceLock = await tx.invoice.updateMany({
          where: {
            id: dto.invoiceId,
            order: { tenantId, branchId },
            status: { not: 'PAID' },
          },
          data: {
            updatedAt: new Date(), // touch to acquire lock
          },
        });

        if (invoiceLock.count === 0) {
          throw new ConflictException(
            'Invoice not found, already paid, or access denied',
          );
        }

        // 8.2 Fetch current state from within transaction (consistent read after lock)
        const invoice = await tx.invoice.findUnique({
          where: { id: dto.invoiceId },
        });

        if (!invoice) {
          throw new ConflictException('Invoice could not be re-loaded');
        }

        // 8.3 Acquire Row-Level Lock on Cashier Session
        const activeSessionLock = await tx.cashierSession.updateMany({
          where: {
            id: dto.cashierSessionId,
            tenantId,
            branchId,
            userId,
            status: 'OPEN',
          },
          data: {
            status: 'OPEN', // No-op update to acquire lock
          },
        });

        if (activeSessionLock.count === 0) {
          throw new ConflictException(
            'Cashier session was closed concurrently or unauthorized',
          );
        }

        // 9. Generate Receipt Number
        const receiptNumber = await this.numbering.generateNumber(
          tenantId,
          'RECEIPT',
          branchId,
          tx,
        );

        // 10. Create Payment record
        try {
          const gatewayProvider = dto.paymentMethod === 'QRPH' ? 'QRPH' : null;
          const gatewayStatus =
            dto.paymentMethod === 'QRPH' ? 'GATEWAY_PENDING' : null;

          const payment = await tx.payment.create({
            data: {
              tenantId,
              invoiceId: dto.invoiceId,
              cashierSessionId: dto.cashierSessionId,
              receiptNumber,
              amount: dto.amount,
              paymentMethod: dto.paymentMethod,
              idempotencyKey,
              status: 'POSTED',
              gatewayProvider,
              gatewayStatus,
            },
          });

          // 11. Financial settlement — only for non-gateway payments
          // QRPH/gateway-pending payments settle on gateway confirmation, not on post
          let newStatus: string | undefined;
          let updatedInvoice: unknown;

          if (dto.paymentMethod !== 'QRPH') {
            await tx.cashierLedgerEntry.create({
              data: {
                cashierSessionId: dto.cashierSessionId,
                type: 'PAYMENT',
                amount: dto.amount,
                referenceId: payment.id,
              },
            });

            // Post double-entry ledger entry: postPayment (DEBIT CASH / CREDIT REVENUE)
            await this.ledgerService.postEntry(
              {
                tenantId,
                branchId,
                debitAccount: 'CASH',
                creditAccount: 'REVENUE',
                amount: payment.amount,
                referenceType: 'PAYMENT',
                referenceId: payment.id,
                description: `Payment posted for Invoice #${invoice.invoiceNumber || invoice.id}`,
              },
              tx,
            );

            // Update Invoice Balance using Decimal Math
            const currentPaid = new Prisma.Decimal(invoice.paidAmount);
            const currentTotal = new Prisma.Decimal(invoice.totalAmount);
            const paymentAmount = new Prisma.Decimal(dto.amount);
            const newPaidAmount = currentPaid.add(paymentAmount);

            // Explicit Overpayment Check
            if (newPaidAmount.gt(currentTotal)) {
              throw new BadRequestException(
                `Payment amount ${paymentAmount.toFixed(2)} would overpay the invoice (Remaining: ${currentTotal.sub(currentPaid).toFixed(2)})`,
              );
            }

            newStatus = newPaidAmount.equals(currentTotal)
              ? 'PAID'
              : 'PARTIALLY_PAID';

            await tx.invoice.update({
              where: { id: dto.invoiceId },
              data: {
                paidAmount: newPaidAmount,
                status: newStatus,
              },
            });

            updatedInvoice = await tx.invoice.findUnique({
              where: { id: dto.invoiceId },
            });

            // Update Order Status (Revenue Cycle Logic)
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
          }

          // 12. Log Audit Event (PAYMENT_POSTED)
          await this.audit.log(
            {
              tenantId,
              userId,
              eventKey: 'PAYMENT_POSTED',
              recordType: 'Payment',
              recordId: payment.id,
              newValues: {
                payment,
                invoiceStatus: newStatus ?? 'PENDING_GATEWAY',
              },
            },
            tx,
            branchId,
          );

          // 12.1 If QRPH gateway payment, log PAYMENT_GATEWAY_INITIATED
          if (dto.paymentMethod === 'QRPH') {
            await this.audit.log(
              {
                tenantId,
                userId,
                eventKey: 'PAYMENT_GATEWAY_INITIATED',
                recordType: 'Payment',
                recordId: payment.id,
                newValues: {
                  gatewayProvider: 'QRPH',
                  gatewayStatus: 'GATEWAY_PENDING',
                  paymentMethod: dto.paymentMethod,
                  amount: dto.amount.toString(),
                  branchId,
                },
              },
              tx,
              branchId,
            );
          }

          // Every payment created must own a COMPLETED idempotency record.
          // The idempotencyRecord must be defined here by the code flow above.
          if (!idempotencyRecord?.id) {
            throw new InternalServerErrorException(
              'Payment created without idempotency tracking record',
            );
          }
          await tx.idempotencyRecord.update({
            where: { id: idempotencyRecord.id },
            data: {
              status: 'COMPLETED',
              paymentId: payment.id,
              responseData: {
                payment,
                invoice: updatedInvoice,
              } as Prisma.InputJsonValue,
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
      if (idempotencyRecord?.id) {
        await this.prisma.idempotencyRecord.updateMany({
          where: { id: idempotencyRecord.id, status: 'IN_PROGRESS' },
          data: {
            status: 'FAILED',
            error: 'Payment request failed before completion',
            updatedAt: new Date(),
          },
        });
      }

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

  async getMyReversals(tenantId: string, userId: string, branchId: string) {
    const reversals = await this.prisma.paymentReversal.findMany({
      where: {
        tenantId,
        branchId,
        requestedBy: userId,
      },
      include: {
        payment: {
          select: {
            receiptNumber: true,
          },
        },
        invoice: {
          select: {
            invoiceNumber: true,
            order: {
              select: {
                patient: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return reversals.map((r) => ({
      id: r.id,
      type: r.type,
      amount: Number(r.amount),
      status: r.status,
      reason: r.reason,
      requestedAt: r.requestedAt,
      approvedAt: r.approvedAt,
      paymentId: r.paymentId,
      receiptNumber: r.payment?.receiptNumber ?? null,
      invoiceNumber: r.invoice?.invoiceNumber ?? null,
      patientName: r.invoice?.order?.patient
        ? `${r.invoice.order.patient.firstName} ${r.invoice.order.patient.lastName}`
        : null,
    }));
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

    if (
      payment.gatewayProvider &&
      payment.gatewayStatus !== 'GATEWAY_CONFIRMED'
    ) {
      throw new BadRequestException(
        `Gateway-backed payment (${payment.gatewayProvider}) must be confirmed before refund. Current gateway status: ${payment.gatewayStatus || 'none'}`,
      );
    }

    const request = await this.prisma.$transaction(async (tx) => {
      // Calculate current reversible amount (inside transaction for atomicity)
      const reversals = await tx.paymentReversal.findMany({
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
      const pending = await tx.approvalRequest.findFirst({
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

      const approvalReq = await this.approvals.createRequest(
        tenantId,
        userId,
        {
          type: REVERSAL_TYPE.REFUND,
          riskLevel: dto.amount > 1000 ? 'HIGH' : 'MEDIUM',
          recordId: payment.id,
          reason: dto.reason,
          branchId,
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

      const reversal = await tx.paymentReversal.create({
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

      // Store reversalId in approval request details for frontend routing
      await tx.approvalRequest.update({
        where: { id: approvalReq.id },
        data: {
          details: {
            ...(approvalReq.details as Record<string, unknown>),
            reversalId: reversal.id,
          },
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

    if (
      payment.gatewayProvider &&
      payment.gatewayStatus !== 'GATEWAY_CONFIRMED'
    ) {
      throw new BadRequestException(
        `Gateway-backed payment (${payment.gatewayProvider}) must be confirmed before void. Current gateway status: ${payment.gatewayStatus || 'none'}`,
      );
    }

    const request = await this.prisma.$transaction(async (tx) => {
      // Block void if any pending or applied reversal exists (inside transaction for atomicity)
      const existingReversal = await tx.paymentReversal.findFirst({
        where: {
          paymentId: payment.id,
          tenantId,
          branchId,
          status: { in: [REVERSAL_STATUS.PENDING, REVERSAL_STATUS.APPLIED] },
        },
      });

      if (existingReversal) {
        throw new ConflictException(
          'Payment cannot be voided because a refund or void request is already pending or applied',
        );
      }

      const approvalReq = await this.approvals.createRequest(
        tenantId,
        userId,
        {
          type: REVERSAL_TYPE.VOID,
          riskLevel: 'HIGH',
          recordId: payment.id,
          reason: dto.reason,
          branchId,
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

      const reversal = await tx.paymentReversal.create({
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

      // Store reversalId in approval request details for frontend routing
      await tx.approvalRequest.update({
        where: { id: approvalReq.id },
        data: {
          details: {
            ...(approvalReq.details as Record<string, unknown>),
            reversalId: reversal.id,
          },
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

  async getInvoices(tenantId: string, branchId: string, pageSize?: number) {
    const take = clampTake(pageSize, MAX_PAGE_SIZE, MAX_PAGE_SIZE);
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
      take,
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
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.prisma;
    // 1. Fetch the reversal and verify basic eligibility
    const reversal = await db.paymentReversal.findFirst({
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
    const approvalRequest = await db.approvalRequest.findFirst({
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
    const payment = await db.payment.findFirst({
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

    if (
      payment.gatewayProvider &&
      payment.gatewayStatus !== 'GATEWAY_CONFIRMED'
    ) {
      throw new BadRequestException(
        `Gateway-backed payment (${payment.gatewayProvider}) must be confirmed before void. Current gateway status: ${payment.gatewayStatus || 'none'}`,
      );
    }

    const invoice = await db.invoice.findFirst({
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
    const applyMutation = async (activeTx: Prisma.TransactionClient) => {
      // 4.1 Lock parent Payment row to serialize concurrent operations on this payment
      const lockResult = await activeTx.payment.updateMany({
        where: { id: payment.id, status: 'POSTED' },
        data: { updatedAt: new Date() },
      });

      if (lockResult.count === 0) {
        throw new ConflictException(
          'Payment status changed concurrently; cannot process void',
        );
      }

      // 4.2 Re-read Invoice inside the transaction (fresh paidAmount after any concurrent modifications)
      const currentInvoice = await activeTx.invoice.findFirst({
        where: { id: invoice.id, order: { tenantId, branchId } },
      });
      if (!currentInvoice) {
        throw new ConflictException(
          'Invoice not found or was deleted concurrently',
        );
      }

      // 4.3 Atomically claim the reversal (status guard prevents double-processing)
      const updateResult = await activeTx.paymentReversal.updateMany({
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
      const otherVoid = await activeTx.paymentReversal.findFirst({
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
      const refundReversal = await activeTx.paymentReversal.findFirst({
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
      const beforePaidAmount = currentInvoice.paidAmount;
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
      } else if (afterPaidAmount.gte(currentInvoice.totalAmount)) {
        newStatus = 'PAID';
      }

      const beforeInvoiceStatus = currentInvoice.status;

      // Update Invoice
      const invoiceUpdate = await activeTx.invoice.updateMany({
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

      const updatedInvoice = await activeTx.invoice.findFirst({
        where: { id: invoice.id, order: { tenantId, branchId } },
      });

      if (!updatedInvoice) {
        throw new ConflictException(
          'Invoice not found in this branch or was modified concurrently',
        );
      }

      // Mark payment as VOIDED
      const paymentVoided = await activeTx.payment.updateMany({
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

      await activeTx.paymentVoid.create({
        data: {
          paymentId: payment.id,
          approvalId: approvalRequest.id,
          voidedBy: userId,
          reason: reversal.reason,
        },
      });

      await activeTx.cashierLedgerEntry.create({
        data: {
          cashierSessionId: payment.cashierSessionId,
          type: 'VOID',
          amount: payment.amount,
          referenceId: payment.id,
        },
      });

      // Post double-entry ledger entry: applyVoid (DEBIT REVENUE / CREDIT CASH)
      await this.ledgerService.postEntry(
        {
          tenantId,
          branchId,
          debitAccount: 'REVENUE',
          creditAccount: 'CASH',
          amount: payment.amount,
          referenceType: 'VOID',
          referenceId: reversal.id,
          description: `Void applied for Payment #${payment.receiptNumber} (Invoice #${invoice.invoiceNumber})`,
        },
        activeTx,
      );

      // Mark approval request as APPLIED (post-approval execution)
      const appliedApproval = await activeTx.approvalRequest.updateMany({
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
        activeTx,
        branchId,
      );

      return {
        reversal: { ...reversal, status: REVERSAL_STATUS.APPLIED },
        invoice: updatedInvoice,
      };
    };

    if (tx) {
      return applyMutation(tx);
    }

    return this.prisma.$transaction(applyMutation);
  }

  async applyRefund(
    tenantId: string,
    userId: string,
    branchId: string,
    reversalId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.prisma;
    // 1. Fetch the reversal and verify basic eligibility
    const reversal = await db.paymentReversal.findFirst({
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
    const approvalRequest = await db.approvalRequest.findFirst({
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
    const payment = await db.payment.findFirst({
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

    if (
      payment.gatewayProvider &&
      payment.gatewayStatus !== 'GATEWAY_CONFIRMED'
    ) {
      throw new BadRequestException(
        `Gateway-backed payment (${payment.gatewayProvider}) must be confirmed before refund. Current gateway status: ${payment.gatewayStatus || 'none'}`,
      );
    }

    const invoice = await db.invoice.findFirst({
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
    const applyMutation = async (activeTx: Prisma.TransactionClient) => {
      // 4.1 Lock parent Payment row to serialize concurrent refunds on the same payment
      // Using activeTx.payment.updateMany so that Prisma routes through the transaction connection
      // and PostgreSQL acquires a row-level lock that blocks concurrent transactions.
      const lockResult = await activeTx.payment.updateMany({
        where: { id: payment.id, status: 'POSTED' },
        data: { updatedAt: new Date() },
      });

      if (lockResult.count === 0) {
        throw new ConflictException(
          'Payment status changed concurrently; cannot process refund',
        );
      }

      // 4.2 Re-read Invoice inside the transaction (fresh paidAmount after any concurrent modifications)
      const currentInvoice = await activeTx.invoice.findFirst({
        where: { id: invoice.id, order: { tenantId, branchId } },
      });
      if (!currentInvoice) {
        throw new ConflictException(
          'Invoice not found or was deleted concurrently',
        );
      }

      // 4.3 Atomically claim the reversal (status guard prevents double-processing)
      const updateResult = await activeTx.paymentReversal.updateMany({
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
      const voidReversal = await activeTx.paymentReversal.findFirst({
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
      const appliedRefunds = await activeTx.paymentReversal.findMany({
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
      // totalApplied already includes this reversal (set to APPLIED above).
      // The correct check is: total applied refunds > payment amount.
      // The remaining refundable balance BEFORE this reversal is:
      //   payment.amount - (totalApplied - refundAmount)
      if (totalApplied.gt(payment.amount)) {
        const refundableBefore = payment.amount.sub(
          totalApplied.sub(refundAmount),
        );
        throw new BadRequestException(
          `Refund amount ₱${refundAmount.toString()} exceeds remaining refundable balance ₱${refundableBefore.toString()}`,
        );
      }

      const beforePaidAmount = currentInvoice.paidAmount;
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
      } else if (afterPaidAmount.gte(currentInvoice.totalAmount)) {
        newStatus = 'PAID';
      }

      const beforeInvoiceStatus = currentInvoice.status;

      // Update Invoice
      const invoiceUpdate = await activeTx.invoice.updateMany({
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

      const updatedInvoice = await activeTx.invoice.findFirst({
        where: { id: invoice.id, order: { tenantId, branchId } },
      });

      if (!updatedInvoice) {
        throw new ConflictException(
          'Invoice not found in this branch or was modified concurrently',
        );
      }

      const refundRecord = await activeTx.refund.create({
        data: {
          invoiceId: invoice.id,
          paymentId: payment.id,
          amount: refundAmount,
          approvedBy: userId,
          method: payment.paymentMethod,
          reason: reversal.reason,
        },
      });

      await activeTx.cashierLedgerEntry.create({
        data: {
          cashierSessionId: payment.cashierSessionId,
          type: 'REFUND',
          amount: refundAmount,
          referenceId: refundRecord.id,
        },
      });

      // Post double-entry ledger entry: applyRefund (DEBIT REVENUE / CREDIT CASH)
      await this.ledgerService.postEntry(
        {
          tenantId,
          branchId,
          debitAccount: 'REVENUE',
          creditAccount: 'CASH',
          amount: refundAmount,
          referenceType: 'REFUND',
          referenceId: reversal.id,
          description: `Refund applied for Payment #${payment.receiptNumber} (Invoice #${invoice.invoiceNumber})`,
        },
        activeTx,
      );

      const appliedApproval = await activeTx.approvalRequest.updateMany({
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
        activeTx,
        branchId,
      );

      return {
        reversal: { ...reversal, status: REVERSAL_STATUS.APPLIED },
        invoice: updatedInvoice,
      };
    };

    if (tx) {
      return applyMutation(tx);
    }

    return this.prisma.$transaction(applyMutation);
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
    try {
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
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'You already have an open cashier session in this branch',
        );
      }

      throw error;
    }
  }

  async closeSession(
    tenantId: string,
    userId: string,
    branchId: string,
    sessionId: string,
    dto: CloseSessionDto,
  ) {
    // We do all reads and updates inside a transaction to prevent race conditions
    // where payments are added while calculating the closing balance.
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the session by attempting to close it
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

      // 2. Fetch the session with payments (which now represents the EXACT snapshot of the closed session)
      const session = await tx.cashierSession.findFirst({
        where: { id: sessionId },
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
        throw new BadRequestException('Cashier session could not be loaded');
      }

      // 3. Calculate Expected Balance based on locked snapshot
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
        // This throw rolls back the transaction, restoring status to OPEN
        throw new BadRequestException(
          'Remarks are required when there is a cash variance',
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

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RECONCILIATION_PERFORMED',
          recordType: 'CashierSession',
          recordId: sessionId,
          newValues: {
            expectedCash,
            actualCash: dto.actualClosingBalance,
            variance,
            sessionId,
          },
        },
        tx,
        branchId,
      );

      const voids = await tx.paymentVoid.findMany({
        where: {
          payment: { cashierSessionId: sessionId },
        },
        include: { payment: true },
      });

      const refunds = await tx.refund.findMany({
        where: {
          payment: { cashierSessionId: sessionId },
        },
        include: { payment: true },
      });

      const ledgerEntries = await tx.cashierLedgerEntry.findMany({
        where: { cashierSessionId: sessionId },
        orderBy: { createdAt: 'asc' },
      });

      return { session, variance, expectedCash, voids, refunds, ledgerEntries };
    });
  }

  async getActiveSession(tenantId: string, userId: string, branchId: string) {
    return this.prisma.cashierSession.findFirst({
      where: { tenantId, userId, branchId, status: 'OPEN' },
      include: {
        payments: {
          include: {
            reversals: {
              where: { status: 'APPLIED' },
              select: { id: true, amount: true, type: true },
            },
            invoice: { include: { order: { include: { patient: true } } } },
          },
        },
      },
    });
  }

  async approveVoid(
    tenantId: string,
    userId: string,
    branchId: string,
    reversalId: string,
    dto: { remarks?: string },
  ) {
    const reversal = await this.prisma.paymentReversal.findFirst({
      where: { id: reversalId, tenantId, branchId, type: REVERSAL_TYPE.VOID },
    });
    if (!reversal) {
      throw new NotFoundException('Payment reversal request not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.approvals.processRequest(
        tenantId,
        userId,
        reversal.approvalRequestId,
        'APPROVED',
        { remarks: dto.remarks },
        branchId,
        tx,
      );
      return this.applyVoid(tenantId, userId, branchId, reversalId, tx);
    });
  }

  async rejectVoid(
    tenantId: string,
    userId: string,
    branchId: string,
    reversalId: string,
    dto: { remarks?: string },
  ) {
    const reversal = await this.prisma.paymentReversal.findFirst({
      where: { id: reversalId, tenantId, branchId, type: REVERSAL_TYPE.VOID },
    });
    if (!reversal) {
      throw new NotFoundException('Payment reversal request not found');
    }
    return this.prisma.$transaction(async (tx) => {
      await this.approvals.processRequest(
        tenantId,
        userId,
        reversal.approvalRequestId,
        'REJECTED',
        { remarks: dto.remarks },
        branchId,
        tx,
      );
      const updated = await this.prisma.paymentReversal.update({
        where: { id: reversalId },
        data: { status: REVERSAL_STATUS.REJECTED },
      });
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'PAYMENT_VOID_REJECTED',
          recordType: 'PaymentReversal',
          recordId: reversalId,
          newValues: {
            paymentId: reversal.paymentId,
            reason: reversal.reason,
            remarks: dto.remarks,
          },
        },
        tx,
        branchId,
      );
      return updated;
    });
  }

  async approveRefund(
    tenantId: string,
    userId: string,
    branchId: string,
    reversalId: string,
    dto: { remarks?: string },
  ) {
    const reversal = await this.prisma.paymentReversal.findFirst({
      where: { id: reversalId, tenantId, branchId, type: REVERSAL_TYPE.REFUND },
    });
    if (!reversal) {
      throw new NotFoundException('Payment reversal request not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.approvals.processRequest(
        tenantId,
        userId,
        reversal.approvalRequestId,
        'APPROVED',
        { remarks: dto.remarks },
        branchId,
        tx,
      );
      return this.applyRefund(tenantId, userId, branchId, reversalId, tx);
    });
  }

  async rejectRefund(
    tenantId: string,
    userId: string,
    branchId: string,
    reversalId: string,
    dto: { remarks?: string },
  ) {
    const reversal = await this.prisma.paymentReversal.findFirst({
      where: { id: reversalId, tenantId, branchId, type: REVERSAL_TYPE.REFUND },
    });
    if (!reversal) {
      throw new NotFoundException('Payment reversal request not found');
    }
    return this.prisma.$transaction(async (tx) => {
      await this.approvals.processRequest(
        tenantId,
        userId,
        reversal.approvalRequestId,
        'REJECTED',
        { remarks: dto.remarks },
        branchId,
        tx,
      );
      const updated = await this.prisma.paymentReversal.update({
        where: { id: reversalId },
        data: { status: REVERSAL_STATUS.REJECTED },
      });
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'REFUND_REJECTED',
          recordType: 'PaymentReversal',
          recordId: reversalId,
          newValues: {
            paymentId: reversal.paymentId,
            amount: reversal.amount.toString(),
            reason: reversal.reason,
            remarks: dto.remarks,
          },
        },
        tx,
        branchId,
      );
      return updated;
    });
  }

  async logReceiptEvent(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: {
      paymentId: string;
      eventKey: string;
      receiptNumber?: string;
      format?: string;
      reason?: string;
    },
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: dto.paymentId, tenantId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const validKeys = [
      'RECEIPT_PRINTED',
      'RECEIPT_REPRINTED',
      'RECEIPT_EXPORTED',
    ];
    if (!validKeys.includes(dto.eventKey)) {
      throw new BadRequestException(
        `Invalid receipt event key: ${dto.eventKey}`,
      );
    }

    await this.audit.log({
      tenantId,
      userId,
      eventKey: dto.eventKey,
      recordType: 'Receipt',
      recordId: dto.paymentId,
      newValues: {
        paymentId: dto.paymentId,
        invoiceId: payment.invoiceId,
        receiptNumber: dto.receiptNumber || payment.receiptNumber,
        amount: payment.amount.toString(),
        paymentMethod: payment.paymentMethod,
        format: dto.format || 'thermal',
        reason: dto.reason,
        branchId,
      },
    });
  }

  async getPaymentHistory(
    tenantId: string,
    branchId: string,
    pageSize?: number,
    page?: number,
  ) {
    const take = clampTake(pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const skip = page && page > 0 ? (page - 1) * take : 0;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          cashierSession: { tenantId, branchId },
        },
        include: {
          invoice: {
            include: {
              order: {
                include: { patient: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.payment.count({
        where: {
          cashierSession: { tenantId, branchId },
        },
      }),
    ]);

    return { payments, total, page: page || 1, pageSize: take };
  }

  async confirmPayment(
    tenantId: string,
    userId: string,
    branchId: string,
    paymentId: string,
    dto: ConfirmPaymentDto,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        cashierSession: { tenantId, branchId },
      },
      include: { invoice: { include: { order: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found or access denied');
    }

    if (payment.status !== 'POSTED') {
      throw new BadRequestException(
        `Payment must be POSTED before gateway confirmation (current: ${payment.status})`,
      );
    }

    // Only explicitly gateway-pending payments may be confirmed
    if (payment.gatewayStatus !== 'GATEWAY_PENDING') {
      throw new BadRequestException(
        `Payment gateway status must be GATEWAY_PENDING to confirm (current: ${payment.gatewayStatus ?? 'unset'})`,
      );
    }

    const gatewayProvider = dto.gatewayProvider || 'QRPH';

    // Perform financial settlement in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Lock the invoice row
      const invoiceLock = await tx.invoice.updateMany({
        where: { id: payment.invoiceId },
        data: { updatedAt: new Date() },
      });

      if (invoiceLock.count === 0) {
        throw new ConflictException(
          'Invoice was modified concurrently or not found',
        );
      }

      const invoice = await tx.invoice.findUnique({
        where: { id: payment.invoiceId },
      });

      if (!invoice) {
        throw new ConflictException('Invoice not found');
      }

      // Post cashier ledger entry
      await tx.cashierLedgerEntry.create({
        data: {
          cashierSessionId: payment.cashierSessionId,
          type: 'PAYMENT',
          amount: payment.amount,
          referenceId: payment.id,
        },
      });

      // Post double-entry ledger entry
      await this.ledgerService.postEntry(
        {
          tenantId,
          branchId,
          debitAccount: 'CASH',
          creditAccount: 'REVENUE',
          amount: payment.amount,
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          description: `Gateway payment confirmed for Invoice #${invoice.invoiceNumber || invoice.id}`,
        },
        tx,
      );

      // Update invoice balance
      const currentPaid = new Prisma.Decimal(invoice.paidAmount);
      const currentTotal = new Prisma.Decimal(invoice.totalAmount);
      const paymentAmount = new Prisma.Decimal(payment.amount);
      const newPaidAmount = currentPaid.add(paymentAmount);

      if (newPaidAmount.gt(currentTotal)) {
        throw new BadRequestException(
          `Confirmation would overpay the invoice (Remaining: ${currentTotal.sub(currentPaid).toFixed(2)})`,
        );
      }

      const newStatus = newPaidAmount.equals(currentTotal)
        ? 'PAID'
        : 'PARTIALLY_PAID';

      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });

      // Update order status if fully paid
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

      // Update payment gateway fields
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          gatewayReference: dto.gatewayReference,
          gatewayStatus: 'GATEWAY_CONFIRMED',
          gatewayProvider,
        },
      });

      // Audit event
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'PAYMENT_GATEWAY_CONFIRMED',
          recordType: 'Payment',
          recordId: paymentId,
          newValues: {
            gatewayReference: dto.gatewayReference,
            gatewayProvider,
            previousGatewayStatus: payment.gatewayStatus,
            invoiceStatus: newStatus,
            branchId,
          },
        },
        tx,
        branchId,
      );

      return updated;
    });

    return result;
  }

  async failPayment(
    tenantId: string,
    userId: string,
    branchId: string,
    paymentId: string,
    dto: FailPaymentDto,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        cashierSession: { tenantId, branchId },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found or access denied');
    }

    if (payment.gatewayStatus !== 'GATEWAY_PENDING') {
      throw new BadRequestException(
        `Payment gateway status must be GATEWAY_PENDING to fail (current: ${payment.gatewayStatus})`,
      );
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        gatewayStatus: 'GATEWAY_FAILED',
        ...(dto.gatewayReference
          ? { gatewayReference: dto.gatewayReference }
          : {}),
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'PAYMENT_GATEWAY_FAILED',
      recordType: 'Payment',
      recordId: paymentId,
      newValues: {
        reason: dto.reason,
        gatewayReference: dto.gatewayReference || null,
        previousGatewayStatus: payment.gatewayStatus,
        branchId,
      },
    });

    return updated;
  }

  async expirePayment(
    tenantId: string,
    userId: string,
    branchId: string,
    paymentId: string,
    dto: ExpirePaymentDto,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        cashierSession: { tenantId, branchId },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found or access denied');
    }

    if (payment.gatewayStatus !== 'GATEWAY_PENDING') {
      throw new BadRequestException(
        `Payment gateway status must be GATEWAY_PENDING to expire (current: ${payment.gatewayStatus})`,
      );
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        gatewayStatus: 'GATEWAY_EXPIRED',
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'PAYMENT_GATEWAY_EXPIRED',
      recordType: 'Payment',
      recordId: paymentId,
      newValues: {
        reason: dto.reason,
        previousGatewayStatus: payment.gatewayStatus,
        branchId,
      },
    });

    return updated;
  }
}
