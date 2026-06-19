import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JoinQueueDto, UpdateQueueStatusDto } from './dto/queue.dto';
import {
  WorklistEntryDto,
  WorklistPatientDto,
} from './dto/worklist-entry.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';

const OPEN_ENCOUNTER_STATUSES = [
  'OPEN',
  'PLANNED',
  'ARRIVED',
  'IN_PROGRESS',
] as const;

/** Legacy frontend alias — canonical queue service type is DOCTOR */
function normalizeServiceType(serviceType: string): string {
  if (!serviceType || serviceType === 'CLINICAL') {
    return 'DOCTOR';
  }
  return serviceType;
}

function splitWalkInName(patientName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const trimmed = (patientName ?? '').trim();
  if (!trimmed) {
    return { firstName: 'Walk-in', lastName: 'Patient' };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '—' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

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

  async getWorklist(
    tenantId: string,
    branchId: string,
    serviceType: string,
  ): Promise<WorklistEntryDto[]> {
    const normalizedType = normalizeServiceType(serviceType);
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const entries = await this.prisma.queueEntry.findMany({
      where: {
        tenantId,
        branchId,
        serviceType: normalizedType,
        status: { in: ['WAITING', 'CALLING', 'SERVING'] },
        createdAt: { gte: dayStart },
      },
      orderBy: [{ category: 'desc' }, { createdAt: 'asc' }],
    });

    if (entries.length === 0) {
      return [];
    }

    const patientIds = entries
      .map((e) => e.patientId)
      .filter((id): id is string => Boolean(id));

    const patients =
      patientIds.length > 0
        ? await this.prisma.patient.findMany({
            where: { tenantId, id: { in: patientIds } },
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true,
              dob: true,
            },
          })
        : [];

    const patientById = new Map(patients.map((p) => [p.id, p]));

    const openEncounters =
      patientIds.length > 0
        ? await this.prisma.encounter.findMany({
            where: {
              tenantId,
              branchId,
              patientId: { in: patientIds },
              status: { in: [...OPEN_ENCOUNTER_STATUSES] },
              archivedAt: null,
              createdAt: { gte: dayStart },
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, patientId: true },
          })
        : [];

    const encounterByPatient = new Map<string, string>();
    for (const enc of openEncounters) {
      if (!encounterByPatient.has(enc.patientId)) {
        encounterByPatient.set(enc.patientId, enc.id);
      }
    }

    return entries.map((entry) => {
      const linked = entry.patientId
        ? patientById.get(entry.patientId)
        : undefined;

      let patient: WorklistPatientDto | null = null;
      if (linked) {
        patient = {
          id: linked.id,
          patientNumber: linked.patientNumber,
          firstName: linked.firstName,
          lastName: linked.lastName,
          dob: linked.dob.toISOString().slice(0, 10),
        };
      } else if (entry.patientId) {
        const { firstName, lastName } = splitWalkInName(entry.patientName);
        patient = {
          id: entry.patientId,
          patientNumber: entry.queueNumber,
          firstName,
          lastName,
          dob: '',
        };
      } else if (entry.patientName) {
        const { firstName, lastName } = splitWalkInName(entry.patientName);
        patient = {
          id: entry.id,
          patientNumber: entry.queueNumber,
          firstName,
          lastName,
          dob: '',
        };
      }

      return {
        id: entry.id,
        queueNumber: entry.queueNumber,
        status: entry.status,
        serviceType: entry.serviceType,
        patientId: entry.patientId,
        encounterId: entry.patientId
          ? (encounterByPatient.get(entry.patientId) ?? null)
          : null,
        patient,
      };
    });
  }
}
