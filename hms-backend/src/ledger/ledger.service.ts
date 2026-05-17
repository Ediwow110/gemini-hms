import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, LedgerEntry } from '@prisma/client';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async postEntry(
    data: {
      tenantId: string;
      branchId: string;
      debitAccount: string;
      creditAccount: string;
      amount: number | Prisma.Decimal;
      referenceType: 'PAYMENT' | 'VOID' | 'REFUND' | 'CLAIM_SETTLEMENT';
      referenceId: string;
      description: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<LedgerEntry> {
    const client = tx || this.prisma;
    return client.ledgerEntry.create({
      data: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        debitAccount: data.debitAccount,
        creditAccount: data.creditAccount,
        amount: data.amount,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        description: data.description,
      },
    });
  }

  async getEntriesByReference(
    tenantId: string,
    referenceType: string,
    referenceId: string,
  ): Promise<LedgerEntry[]> {
    return this.prisma.ledgerEntry.findMany({
      where: {
        tenantId,
        referenceType,
        referenceId,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAccountBalance(
    tenantId: string,
    accountName: string,
    from?: Date,
    to?: Date,
  ): Promise<number> {
    const where: Prisma.LedgerEntryWhereInput = {
      tenantId,
      OR: [
        { debitAccount: accountName },
        { creditAccount: accountName },
      ],
    };

    if (from || to) {
      where.entryDate = {};
      if (from) {
        where.entryDate.gte = from;
      }
      if (to) {
        where.entryDate.lte = to;
      }
    }

    const entries = await this.prisma.ledgerEntry.findMany({ where });

    let balance = 0;
    for (const entry of entries) {
      const amt = Number(entry.amount);
      if (entry.debitAccount === accountName) {
        balance += amt;
      }
      if (entry.creditAccount === accountName) {
        balance -= amt;
      }
    }

    return balance;
  }
}
