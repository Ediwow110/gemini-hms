import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePaymentDto,
  OpenSessionDto,
  CloseSessionDto,
} from './dto/payment.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private numbering: NumberingService,
  ) {}

  async postPayment(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: CreatePaymentDto,
  ) {
    // 1. Verify invoice belongs to tenant AND branch
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

    // 2. Verify cashier session belongs to tenant AND branch AND user
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

    // 3. START TRANSACTION (Section 13 Boundary: Post Payment)
    return this.prisma.$transaction(async (tx) => {
      // 4. Generate Receipt Number
      const receiptNumber = await this.numbering.generateNumber(
        tenantId,
        'RECEIPT',
        branchId,
      );

      // 5. Create Payment record (Idempotency check handled by DB unique constraint)
      try {
        const payment = await tx.payment.create({
          data: {
            invoiceId: dto.invoiceId,
            cashierSessionId: dto.cashierSessionId,
            receiptNumber,
            amount: dto.amount,
            paymentMethod: dto.paymentMethod,
            idempotencyKey: dto.idempotencyKey,
            status: 'POSTED',
          },
        });

        // 6. Update Invoice
        const newPaidAmount = Number(invoice.paidAmount) + dto.amount;
        const newStatus =
          newPaidAmount >= Number(invoice.totalAmount)
            ? 'PAID'
            : 'PARTIALLY_PAID';

        const updatedInvoice = await tx.invoice.update({
          where: { id: dto.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });

        // 7. Update Order Status (Revenue Cycle Logic)
        if (newStatus === 'PAID') {
          await tx.order.update({
            where: { id: invoice.orderId },
            data: { status: 'PAID' },
          });
        }

        // 8. Log Audit Event (PAYMENT_POSTED)
        await this.audit.log({
          tenantId,
          userId,
          eventKey: 'PAYMENT_POSTED',
          recordType: 'Payment',
          recordId: payment.id,
          newValues: { payment, invoiceStatus: newStatus },
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

    // 2. Create the session
    const session = await this.prisma.cashierSession.create({
      data: {
        tenantId,
        branchId,
        userId,
        openingBalance: dto.openingBalance,
        status: 'OPEN',
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'SESSION_OPENED',
      recordType: 'CashierSession',
      recordId: session.id,
      newValues: { openingBalance: dto.openingBalance, branchId },
    });

    return session;
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
      include: { payments: true },
    });

    if (!session) {
      throw new BadRequestException(
        'Active session not found or already closed in this branch',
      );
    }

    // 1. Calculate Expected Balance
    // Sum all cash payments (assuming we only track cash in the drawer variance)
    const cashPayments = session.payments
      .filter((p) => p.paymentMethod === 'CASH')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const expectedCash = Number(session.openingBalance) + cashPayments;
    const variance = dto.actualClosingBalance - expectedCash;

    if (variance !== 0 && !dto.remarks) {
      throw new BadRequestException(
        'Remarks are required when there is a cash variance',
      );
    }

    // 2. Close the session in a transaction
    return this.prisma.$transaction(async (tx) => {
      const closed = await tx.cashierSession.update({
        where: { id: sessionId },
        data: {
          status: 'CLOSED',
          closingBalance: dto.actualClosingBalance,
          closedAt: new Date(),
        },
      });

      await this.audit.log({
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
      });

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
