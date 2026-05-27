import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateEncounterDto,
  CreateVitalsDto,
  CreateDiagnosisDto,
  CreateClinicalNoteDto,
} from './dto/encounter.dto';
import { EncounterStatus } from '@prisma/client';

@Injectable()
export class EncounterService {
  private readonly logger = new Logger(EncounterService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: CreateEncounterDto,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // Validate patient exists and belongs to tenant
          const patient = await tx.patient.findFirst({
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

          const encounter = await tx.encounter.create({
            data: {
              tenantId,
              branchId,
              patientId: dto.patientId,
              attendingId: dto.attendingId,
              status: dto.status || EncounterStatus.IN_PROGRESS,
              type: dto.type,
              reason: dto.reason,
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
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
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

  async findOne(tenantId: string, id: string, branchId?: string) {
    const encounter = await this.prisma.encounter.findFirst({
      where: {
        id,
        tenantId,
        branchId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientNumber: true,
          },
        },
        vitals: true,
        diagnoses: true,
        clinicalNotes: true,
      },
    });

    if (!encounter) {
      throw new NotFoundException('Encounter not found');
    }

    return encounter;
  }

  private async getEncounterLocked(
    tx: any,
    tenantId: string,
    id: string,
    branchId?: string,
  ) {
    const encounter = await tx.encounter.findFirst({
      where: {
        id,
        tenantId,
        branchId,
      },
    });

    if (!encounter) {
      throw new NotFoundException('Encounter not found');
    }

    return encounter;
  }

  private assertMutable(encounter: any) {
    if (
      encounter.status === EncounterStatus.FINISHED ||
      encounter.status === EncounterStatus.CANCELLED ||
      encounter.status === EncounterStatus.ENTERED_IN_ERROR
    ) {
      throw new ConflictException('Record locked. Use the amendment workflow.');
    }
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    id: string,
    status: EncounterStatus,
    branchId?: string,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const encounter = await this.getEncounterLocked(
          tx,
          tenantId,
          id,
          branchId,
        );

        const updated = await tx.encounter.update({
          where: { id },
          data: {
            status,
            endedAt:
              status === EncounterStatus.FINISHED ||
              status === EncounterStatus.CANCELLED
                ? new Date()
                : undefined,
            updatedBy: userId,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'ENCOUNTER_STATUS_UPDATED',
            recordType: 'Encounter',
            recordId: id,
            oldValues: { status: encounter.status },
            newValues: { status: updated.status },
          },
          tx,
          encounter.branchId as string,
        );

        return updated;
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error updating encounter status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async addVitals(
    tenantId: string,
    userId: string,
    branchId: string,
    encounterId: string,
    dto: CreateVitalsDto,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const encounter = await this.getEncounterLocked(
          tx,
          tenantId,
          encounterId,
          branchId,
        );
        this.assertMutable(encounter);

        const vitals = await tx.vitals.create({
          data: {
            tenantId,
            encounterId,
            temperature: dto.temperature
              ? new Prisma.Decimal(dto.temperature)
              : undefined,
            systolicBp: dto.systolicBp,
            diastolicBp: dto.diastolicBp,
            heartRate: dto.heartRate,
            respiratory: dto.respiratory,
            weightKg: dto.weightKg
              ? new Prisma.Decimal(dto.weightKg)
              : undefined,
            createdBy: userId,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'VITALS_ADDED',
            recordType: 'Vitals',
            recordId: vitals.id,
            newValues: {
              encounterId,
              temperature: vitals.temperature?.toNumber(),
              systolicBp: vitals.systolicBp,
              heartRate: vitals.heartRate,
            },
          },
          tx,
          branchId,
        );

        return vitals;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Error adding vitals: ${error.message}`, error.stack);
      throw error;
    }
  }

  async addDiagnosis(
    tenantId: string,
    userId: string,
    branchId: string,
    encounterId: string,
    dto: CreateDiagnosisDto,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const encounter = await this.getEncounterLocked(
          tx,
          tenantId,
          encounterId,
          branchId,
        );
        this.assertMutable(encounter);

        const diagnosis = await tx.diagnosis.create({
          data: {
            tenantId,
            encounterId,
            icd10Code: dto.icd10Code,
            description: dto.description,
            isPrimary: dto.isPrimary || false,
            createdBy: userId,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'DIAGNOSIS_ADDED',
            recordType: 'Diagnosis',
            recordId: diagnosis.id,
            newValues: {
              encounterId,
              icd10Code: diagnosis.icd10Code,
              isPrimary: diagnosis.isPrimary,
            },
          },
          tx,
          branchId,
        );

        return diagnosis;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Error adding diagnosis: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async addClinicalNote(
    tenantId: string,
    userId: string,
    branchId: string,
    encounterId: string,
    dto: CreateClinicalNoteDto,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const encounter = await this.getEncounterLocked(
          tx,
          tenantId,
          encounterId,
          branchId,
        );
        this.assertMutable(encounter);

        const note = await tx.clinicalNote.create({
          data: {
            tenantId,
            encounterId,
            noteType: dto.noteType,
            content: dto.content,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'CLINICAL_NOTE_ADDED',
            recordType: 'ClinicalNote',
            recordId: note.id,
            newValues: {
              encounterId,
              noteType: note.noteType,
            },
          },
          tx,
          branchId,
        );

        return note;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Error adding clinical note: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
