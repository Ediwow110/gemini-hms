import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NumberingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates a sequential unique number for a given entity type.
   * Atomic increments prevent race conditions.
   */
  async generateNumber(
    tenantId: string,
    entityType: string,
    branchId?: string,
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

    // Use a transaction to ensure we can create or increment safely
    return this.prisma.$transaction(async (tx) => {
      // Find the existing sequence
      let sequence = await tx.numberingSequence.findFirst({
        where: {
          tenantId,
          branchId: safeBranchId,
          entityType,
        },
      });

      if (sequence) {
        // Atomically increment
        sequence = await tx.numberingSequence.update({
          where: { id: sequence.id },
          data: { currentVal: { increment: 1 } },
        });
      } else {
        // Create new
        sequence = await tx.numberingSequence.create({
          data: {
            tenantId,
            branchId: safeBranchId,
            entityType,
            prefix: config.prefix,
            currentVal: 1,
            padding: config.padding,
          },
        });
      }

      const paddedValue = String(sequence.currentVal).padStart(
        sequence.padding,
        '0',
      );
      return `${sequence.prefix}${paddedValue}`;
    });
  }
}
