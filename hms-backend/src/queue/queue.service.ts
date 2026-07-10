import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';

const CALL_NEXT_RETRY_LIMIT = 5;

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
  ) {}

  async listActiveQueue(tenantId: string, branchId: string) {
    return this.prisma.queueEntry.findMany({
      where: {
        tenantId,
        branchId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async joinQueue(
    tenantId: string,
    branchId: string,
    data: {
      patientId: string;
      serviceType: string;
      category?: string;
    },
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.assertBranchExists(tx, tenantId, branchId);

      const patient = await tx.patient.findFirst({
        where: { id: data.patientId, tenantId },
      });
      if (!patient) {
        throw new NotFoundException('Patient not found.');
      }

      const queueNumber = await this.numbering.generateNumber(
        tenantId,
        'QUEUE',
        branchId,
        tx,
      );

      const entry = await tx.queueEntry.create({
        data: {
          tenantId,
          branchId,
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`.trim(),
          queueNumber,
          category: data.category ?? 'REGULAR',
          serviceType: data.serviceType,
          status: 'WAITING',
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'QUEUE_ENTRY_CREATED',
          recordType: 'QueueEntry',
          recordId: entry.id,
          newValues: entry,
        },
        tx,
        branchId,
      );

      return entry;
    });
  }

  async callNext(
    tenantId: string,
    branchId: string,
    serviceType: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.assertBranchExists(tx, tenantId, branchId);

      for (let attempt = 0; attempt < CALL_NEXT_RETRY_LIMIT; attempt += 1) {
        const nextEntry = await tx.queueEntry.findFirst({
          where: {
            tenantId,
            branchId,
            serviceType,
            status: 'WAITING',
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        });

        if (!nextEntry) {
          throw new BadRequestException(
            `No patients currently waiting for ${serviceType}.`,
          );
        }

        const claimed = await tx.queueEntry.updateMany({
          where: {
            id: nextEntry.id,
            tenantId,
            branchId,
            status: 'WAITING',
          },
          data: { status: 'CALLING' },
        });

        if (claimed.count !== 1) {
          continue;
        }

        const updated = await tx.queueEntry.findFirst({
          where: { id: nextEntry.id, tenantId, branchId },
        });
        if (!updated) {
          throw new ConflictException('Queue entry changed during assignment.');
        }

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'QUEUE_ENTRY_CALLED',
            recordType: 'QueueEntry',
            recordId: updated.id,
            oldValues: { status: nextEntry.status },
            newValues: { status: updated.status },
          },
          tx,
          branchId,
        );

        return updated;
      }

      throw new ConflictException(
        'The queue changed concurrently. Retry the operation.',
      );
    });
  }

  async completeEntry(
    tenantId: string,
    branchId: string,
    entryId: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.queueEntry.findFirst({
        where: { id: entryId, tenantId, branchId },
      });
      if (!existing) {
        throw new NotFoundException('Queue entry not found.');
      }
      if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
        throw new BadRequestException(
          `Queue entry is already ${existing.status.toLowerCase()}.`,
        );
      }

      const completed = await tx.queueEntry.updateMany({
        where: {
          id: entryId,
          tenantId,
          branchId,
          status: existing.status,
        },
        data: { status: 'COMPLETED' },
      });
      if (completed.count !== 1) {
        throw new ConflictException(
          'Queue entry changed concurrently. Retry the operation.',
        );
      }

      const updated = await tx.queueEntry.findFirst({
        where: { id: entryId, tenantId, branchId },
      });
      if (!updated) {
        throw new ConflictException('Queue entry changed during completion.');
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'QUEUE_ENTRY_COMPLETED',
          recordType: 'QueueEntry',
          recordId: updated.id,
          oldValues: { status: existing.status },
          newValues: { status: updated.status },
        },
        tx,
        branchId,
      );

      return updated;
    });
  }

  async getQueueStats(tenantId: string, branchId: string) {
    const rows = await this.prisma.queueEntry.groupBy({
      by: ['status'],
      where: { tenantId, branchId },
      _count: { _all: true },
    });

    const counts = new Map(
      rows.map((row) => [row.status, row._count._all] as const),
    );

    return {
      waiting: counts.get('WAITING') ?? 0,
      calling: counts.get('CALLING') ?? 0,
      served: counts.get('COMPLETED') ?? 0,
      skipped: counts.get('CANCELLED') ?? 0,
    };
  }

  private async assertBranchExists(
    tx: Prisma.TransactionClient,
    tenantId: string,
    branchId: string,
  ): Promise<void> {
    const branch = await tx.branch.findFirst({
      where: { id: branchId, tenantId },
      select: { id: true },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }
  }
}
