import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEncounterDto, UpdateEncounterDto } from './dto/encounter.dto';
import { EncounterStatus } from '@prisma/client';
import { MAX_PAGE_SIZE, clampTake } from '../common/utils/pagination';

@Injectable()
export class EncountersService {
  private readonly logger = new Logger(EncountersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: CreateEncounterDto,
  ) {
    try {
      // Validate patient exists and belongs to tenant
      const patient = await this.prisma.patient.findFirst({
        where: { id: dto.patientId, tenantId },
      });

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      if (patient.status !== 'ACTIVE') {
        throw new BadRequestException(
          'Cannot create encounter for inactive patient',
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        const encounter = await tx.encounter.create({
          data: {
            tenantId,
            branchId,
            patientId: dto.patientId,
            status: dto.status || EncounterStatus.IN_PROGRESS,
            type: dto.type,
            reason: dto.reason,
            notes: dto.notes,
            startedAt: new Date(),
            createdBy: userId,
            updatedBy: userId,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'ENCOUNTER_CREATED',
            recordType: 'Encounter',
            recordId: encounter.id,
            newValues: {
              patientId: encounter.patientId,
              status: encounter.status,
              type: encounter.type,
            },
          },
          tx,
          branchId,
        );

        return encounter;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error creating encounter: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findAll(
    tenantId: string,
    branchId?: string,
    patientId?: string,
    pageSize?: number,
  ) {
    const take = clampTake(pageSize, MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    return this.prisma.encounter.findMany({
      where: {
        tenantId,
        branchId,
        patientId,
      },
      orderBy: { startedAt: 'desc' },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientNumber: true,
          },
        },
      },
      take,
    });
  }

  async findOne(tenantId: string, id: string, branchId?: string) {
    const encounter = await this.prisma.encounter.findFirst({
      where: {
        id,
        tenantId,
        branchId,
      },
      include: {
        patient: true,
        branch: true,
      },
    });

    if (!encounter) {
      throw new NotFoundException('Encounter not found');
    }

    return encounter;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateEncounterDto,
    branchId?: string,
  ) {
    try {
      const existing = await this.findOne(tenantId, id, branchId);

      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.encounter.update({
          where: { id },
          data: {
            ...dto,
            updatedBy: userId,
            endedAt:
              dto.status === EncounterStatus.FINISHED ? new Date() : undefined,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'ENCOUNTER_UPDATED',
            recordType: 'Encounter',
            recordId: id,
            oldValues: { status: existing.status },
            newValues: { status: updated.status },
          },
          tx,
          existing.branchId,
        );

        return updated;
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error updating encounter: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
