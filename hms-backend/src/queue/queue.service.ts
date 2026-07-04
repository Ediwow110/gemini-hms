import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { QueueEntry } from '@prisma/client';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Returns the current active queue for a specific branch.
   * Only returns entries that are NOT yet COMPLETED or CANCELLED.
   */
  async listActiveQueue(tenantId: string, branchId: string) {
    return this.prisma.queueEntry.findMany({
      where: {
        tenantId,
        branchId,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Adds a patient to the queue.
   */
  async joinQueue(
    tenantId: string,
    branchId: string,
    data: {
      patientId: string;
      serviceType: string;
      category?: string;
    },
    userId?: string,
  ) {
    // Verify patient exists and belongs to the tenant
    const patient = await this.prisma.patient.findFirst({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    if (patient.tenantId !== tenantId) {
      throw new BadRequestException('Patient belongs to a different tenant.');
    }

    // Generate a queue number (simple sequential for the day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const countToday = await this.prisma.queueEntry.count({
      where: {
        tenantId,
        branchId,
        createdAt: {
          gte: today,
        },
      },
    });

    const queueNumber = `Q-${(countToday + 1).toString().padStart(3, '0')}`;

    const entry = await this.prisma.queueEntry.create({
      data: {
        tenantId,
        branchId,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        queueNumber,
        category: data.category || 'REGULAR',
        serviceType: data.serviceType,
        status: 'WAITING',
      },
    });

    await this.audit.log(
      {
        tenantId,
        userId: userId || patient.id,
        eventKey: 'QUEUE_ENTRY_CREATED',
        recordType: 'QueueEntry',
        recordId: entry.id,
        newValues: entry,
      },
      undefined,
      branchId,
    );

    return entry;
  }

  /**
   * Marks the oldest WAITING entry for a specific service as CALLING.
   * Uses a transaction to prevent race conditions in multi-counter environments.
   */
  async callNext(tenantId: string, branchId: string, serviceType: string) {
    return this.prisma.$transaction(async (tx) => {
      const nextEntry = await tx.queueEntry.findFirst({
        where: {
          tenantId,
          branchId,
          serviceType,
          status: 'WAITING',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (!nextEntry) {
        throw new BadRequestException(
          `No patients currently waiting for ${serviceType}.`,
        );
      }

      return tx.queueEntry.update({
        where: { id: nextEntry.id },
        data: { status: 'CALLING' },
      });
    });
  }

  /**
   * Marks a queue entry as COMPLETED.
   */
  async completeEntry(tenantId: string, entryId: string) {
    const entry = await this.prisma.queueEntry.findFirst({
      where: {
        id: entryId,
        tenantId,
      },
    });

    if (!entry) {
      throw new NotFoundException('Queue entry not found.');
    }

    return this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'COMPLETED' },
    });
  }

  /**
   * Simple stats for the dashboard.
   */
  async getQueueStats(tenantId: string, branchId: string) {
    const active = await this.prisma.queueEntry.count({
      where: { tenantId, branchId, status: 'WAITING' },
    });
    const calling = await this.prisma.queueEntry.count({
      where: { tenantId, branchId, status: 'CALLING' },
    });
    const served = await this.prisma.queueEntry.count({
      where: { tenantId, branchId, status: 'COMPLETED' },
    });
    const skipped = await this.prisma.queueEntry.count({
      where: { tenantId, branchId, status: 'CANCELLED' },
    });

    return {
      waiting: active,
      calling,
      served,
      skipped,
    };
  }
}
