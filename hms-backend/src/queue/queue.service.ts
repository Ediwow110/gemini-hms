import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JoinQueueDto, UpdateQueueStatusDto } from './dto/queue.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';

@Injectable()
export class QueueService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private numbering: NumberingService,
  ) {}

  async joinQueue(
    tenantId: string,
    branchId: string,
    userId: string,
    dto: JoinQueueDto,
  ) {
    // 1. If a patientId is supplied, verify it exists and belongs to this
    // tenant. A user with queue.manage in tenant A must not be able to
    // attach a patientId from tenant B to a queue entry in tenant A.
    if (dto.patientId) {
      const patient = await this.prisma.patient.findFirst({
        where: { id: dto.patientId, tenantId },
      });
      if (!patient) {
        throw new BadRequestException('Patient not found in this tenant');
      }
    }

    // 2. Generate Queue Number atomically
    const todayStr = new Date().toISOString().split('T')[0];
    const sequenceType = `QUEUE_${dto.serviceType}_${todayStr}`;
    const rawNumber = await this.numbering.generateNumber(
      tenantId,
      sequenceType,
      branchId,
    );

    // Remove the generic prefix added by NumberingService and apply our custom queue format
    const numberPart = rawNumber.split('-').pop();
    const prefix = dto.serviceType.charAt(0).toUpperCase();
    const queueNumber = `${prefix}-${numberPart!.padStart(3, '0')}`;

    // 3. Create Entry
    const entry = await this.prisma.queueEntry.create({
      data: {
        tenantId,
        branchId,
        patientId: dto.patientId,
        patientName: dto.patientName,
        queueNumber,
        serviceType: dto.serviceType,
        category: dto.category || 'REGULAR',
        status: 'WAITING',
      },
    });

    // 4. Audit log emission. Consistent with updateStatus which audits
    // CALLING/COMPLETED transitions. The payload intentionally omits
    // patientName / patientId to keep audit events metadata-only.
    await this.audit.log(
      {
        tenantId,
        userId,
        eventKey: 'QUEUE_ENTRY_CREATED',
        recordType: 'QueueEntry',
        recordId: entry.id,
        newValues: {
          id: entry.id,
          queueNumber: entry.queueNumber,
          serviceType: entry.serviceType,
          category: entry.category,
          status: entry.status,
        },
      },
      undefined,
      branchId,
    );

    return entry;
  }

  async getActiveDisplay(tenantId: string, branchId: string) {
    // For TV Display (Section 10)
    return this.prisma.queueEntry.findMany({
      where: {
        tenantId,
        branchId,
        status: { in: ['CALLING', 'SERVING'] },
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    branchId: string,
    id: string,
    dto: UpdateQueueStatusDto,
  ) {
    const entry = await this.prisma.queueEntry.findFirst({
      where: { id, tenantId, branchId },
    });

    if (!entry) {
      throw new NotFoundException('Queue entry not found');
    }

    const updateResult = await this.prisma.queueEntry.updateMany({
      where: { id, tenantId, branchId },
      data: {
        status: dto.status,
        counterNumber: dto.counterNumber,
      },
    });

    if (updateResult.count === 0) {
      throw new NotFoundException('Queue entry not found');
    }

    const updated = await this.prisma.queueEntry.findFirst({
      where: { id, tenantId, branchId },
    });

    if (!updated) {
      throw new NotFoundException('Queue entry not found');
    }

    // Optional: Log calling/completion in audit
    if (dto.status === 'CALLING' || dto.status === 'COMPLETED') {
      await this.audit.log({
        tenantId,
        userId,
        eventKey: `QUEUE_${dto.status}`,
        recordType: 'QueueEntry',
        recordId: id,
        newValues: updated,
      });
    }

    return updated;
  }

  async getWorklist(tenantId: string, branchId: string, serviceType: string) {
    return this.prisma.queueEntry.findMany({
      where: {
        tenantId,
        branchId,
        serviceType,
        status: { in: ['WAITING', 'CALLING', 'SERVING'] },
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      orderBy: [
        { category: 'desc' }, // PRIORITY first
        { createdAt: 'asc' },
      ],
    });
  }
}
