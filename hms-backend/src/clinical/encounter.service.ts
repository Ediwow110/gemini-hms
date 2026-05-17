import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEncounterDto } from './dto/clinical.dto';
import { EncounterStatus } from '@prisma/client';

@Injectable()
export class EncounterService {
  private readonly logger = new Logger(EncounterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createEncounter(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: CreateEncounterDto,
  ) {
    try {
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

      // Enforce that doctorId is optional but must exist as active User in tenant if provided
      if (dto.doctorId) {
        const doctor = await this.prisma.user.findFirst({
          where: { id: dto.doctorId, tenantId, status: 'ACTIVE' },
        });
        if (!doctor) {
          throw new NotFoundException('Doctor not found');
        }
      }

      return await this.prisma.$transaction(async (tx) => {
        const encounter = await tx.encounter.create({
          data: {
            tenantId,
            branchId,
            patientId: dto.patientId,
            doctorId: dto.doctorId || userId,
            chiefComplaint: dto.chiefComplaint,
            status: EncounterStatus.OPEN,
            createdBy: userId,
            updatedBy: userId,
            startedAt: new Date(),
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'CLINICAL_ENCOUNTER_CREATED',
            recordType: 'Encounter',
            recordId: encounter.id,
            newValues: {
              patientId: encounter.patientId,
              doctorId: encounter.doctorId,
              status: encounter.status,
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
        `Error in createEncounter: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getEncounter(tenantId: string, id: string) {
    const encounter = await this.prisma.encounter.findFirst({
      where: { id, tenantId },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            email: true,
          },
        },
        clinicalNotes: {
          orderBy: { createdAt: 'asc' },
        },
        encounterDiagnoses: {
          include: {
            icd10Code: true,
          },
        },
      },
    });

    if (!encounter) {
      throw new NotFoundException('Encounter not found');
    }

    return encounter;
  }

  async closeEncounter(tenantId: string, userId: string, id: string) {
    try {
      const encounter = await this.prisma.encounter.findFirst({
        where: { id, tenantId },
      });

      if (!encounter) {
        throw new NotFoundException('Encounter not found');
      }

      if (encounter.status === EncounterStatus.CLOSED) {
        throw new ConflictException('Encounter is already closed');
      }

      return await this.prisma.$transaction(async (tx) => {
        const now = new Date();

        // 1. Close the encounter
        const updated = await tx.encounter.update({
          where: { id },
          data: {
            status: EncounterStatus.CLOSED,
            endedAt: now,
            updatedBy: userId,
          },
        });

        // 2. Lock all clinical notes belonging to this encounter
        await tx.clinicalNote.updateMany({
          where: {
            encounterId: id,
            lockedAt: null,
          },
          data: {
            lockedAt: now,
            lockedBy: userId,
            updatedBy: userId,
          },
        });

        // 3. Log audit event
        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'CLINICAL_ENCOUNTER_CLOSED',
            recordType: 'Encounter',
            recordId: id,
            oldValues: { status: encounter.status },
            newValues: { status: updated.status },
          },
          tx,
          encounter.branchId,
        );

        return updated;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Error in closeEncounter: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
