import {
  Injectable,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OpenSessionDto, CloseSessionDto } from './dto/session.dto';

@Injectable()
export class CashierService {
  private readonly logger = new Logger(CashierService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async openSession(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: OpenSessionDto,
  ) {
    const existing = await this.prisma.cashierSession.findFirst({
      where: { tenantId, userId, branchId, status: 'OPEN' },
    });

    if (existing) {
      throw new ConflictException(
        'You already have an open cashier session in this branch',
      );
    }

    try {
      return this.prisma.$transaction(
        async (tx) => {
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
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
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

      return { session, variance, expectedCash };
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
