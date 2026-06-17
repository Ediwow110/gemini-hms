import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NumberingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates a sequential unique number for a given entity type.
   *
   * Atomic increments prevent race conditions.
   * Supports optional transaction client to maintain transaction atomicity with caller.
   *
   * The unique constraint (tenantId, branchId, entityType) permits a NULL branchId
   * at the database level (PostgreSQL treats NULLs as distinct in unique indexes),
   * but Prisma's generated compound-unique input type requires all fields to be
   * non-null. We therefore use a findFirst + create/update pattern instead of
   * upsert, with a P2002 retry to handle the concurrent-create race window.
   */
  async generateNumber(
    tenantId: string,
    entityType: string,
    branchId?: string,
    tx?: any,
  ): Promise<string> {
    const defaults: Record<string, { prefix: string; padding: number }> = {
      PATIENT: { prefix: 'PT-', padding: 6 },
      ORDER: { prefix: 'ORD-', padding: 6 },
      INVOICE: { prefix: 'INV-', padding: 6 },
      RECEIPT: { prefix: 'RCP-', padding: 6 },
      LAB_RESULT: { prefix: 'LAB-', padding: 6 },
      CLAIM: { prefix: 'CLM-', padding: 6 },
    };

    const config = defaults[entityType] || {
      prefix: `${entityType}-`,
      padding: 6,
    };
    const safeBranchId = branchId || null;

    const formatNumber = (currentVal: number): string => {
      const paddedValue = String(currentVal).padStart(config.padding, '0');
      return `${config.prefix}${paddedValue}`;
    };

    const logic = async (db: any): Promise<string> => {
      const existing = await db.numberingSequence.findFirst({
        where: {
          tenantId,
          branchId: safeBranchId,
          entityType,
        },
        select: { id: true, currentVal: true },
      });

      if (existing) {
        const updated = await db.numberingSequence.update({
          where: { id: existing.id },
          data: { currentVal: { increment: 1 } },
          select: { currentVal: true },
        });
        return formatNumber(updated.currentVal);
      }

      try {
        const created = await db.numberingSequence.create({
          data: {
            tenantId,
            branchId: safeBranchId,
            entityType,
            prefix: config.prefix,
            currentVal: 1,
            padding: config.padding,
          },
          select: { currentVal: true },
        });
        return formatNumber(created.currentVal);
      } catch (e: any) {
        if (e?.code !== 'P2002') throw e;

        const concurrent = await db.numberingSequence.findFirst({
          where: {
            tenantId,
            branchId: safeBranchId,
            entityType,
          },
          select: { id: true },
        });
        if (!concurrent) throw e;

        const updated = await db.numberingSequence.update({
          where: { id: concurrent.id },
          data: { currentVal: { increment: 1 } },
          select: { currentVal: true },
        });
        return formatNumber(updated.currentVal);
      }
    };

    if (tx) {
      return logic(tx);
    }

    return this.prisma.$transaction(async (newTx) => {
      return logic(newTx);
    });
  }
}
