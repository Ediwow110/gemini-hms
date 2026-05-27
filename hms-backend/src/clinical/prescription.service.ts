import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePrescriptionDto } from './dto/clinical.dto';
import { EncounterStatus, PrescriptionStatus } from '@prisma/client';

@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createPrescription(
    tenantId: string,
    userId: string,
    branchId: string,
    encounterId: string,
    dto: CreatePrescriptionDto,
  ) {
    try {
      const encounter = await this.prisma.encounter.findFirst({
        where: { id: encounterId, tenantId, branchId },
      });

      if (!encounter) {
        throw new NotFoundException('Encounter not found');
      }

      if (encounter.status !== EncounterStatus.OPEN) {
        throw new ConflictException(
          'clinical_encounter_not_open: Cannot create prescriptions on a closed or cancelled encounter',
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        const prescription = await tx.prescription.create({
          data: {
            tenantId,
            branchId,
            encounterId,
            prescribedById: userId,
            patientId: encounter.patientId,
            medicationName: dto.medicationName,
            dosage: dto.dosage,
            frequency: dto.frequency,
            duration: dto.duration,
            notes: dto.notes,
            status: PrescriptionStatus.ACTIVE,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'CLINICAL_PRESCRIPTION_CREATED',
            recordType: 'Prescription',
            recordId: prescription.id,
            newValues: {
              encounterId,
              patientId: encounter.patientId,
              medicationName: dto.medicationName,
            },
          },
          tx,
          branchId,
        );

        return prescription;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Error in createPrescription: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getPrescription(tenantId: string, id: string, branchId?: string) {
    const prescription = await this.prisma.prescription.findFirst({
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
        prescribedBy: {
          select: {
            id: true,
            email: true,
          },
        },
        encounter: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return prescription;
  }

  async cancelPrescription(
    tenantId: string,
    userId: string,
    id: string,
    branchId?: string,
  ) {
    try {
      const prescription = await this.prisma.prescription.findFirst({
        where: {
          id,
          tenantId,
          branchId,
        },
      });

      if (!prescription) {
        throw new NotFoundException('Prescription not found');
      }

      if (prescription.status === PrescriptionStatus.CANCELLED) {
        return prescription;
      }

      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.prescription.update({
          where: { id },
          data: {
            status: PrescriptionStatus.CANCELLED,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'CLINICAL_PRESCRIPTION_CANCELLED',
            recordType: 'Prescription',
            recordId: id,
            oldValues: { status: prescription.status },
            newValues: { status: updated.status },
          },
          tx,
          prescription.branchId,
        );

        return updated;
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error in cancelPrescription: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
