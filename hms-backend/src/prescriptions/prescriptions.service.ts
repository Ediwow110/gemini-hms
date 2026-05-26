import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    tenantId: string,
    branchId: string,
    userId: string,
    dto: CreatePrescriptionDto,
  ) {
    // Verify patient exists and belongs to tenant
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found in this tenant');
    }

    // Verify encounter exists and belongs to patient
    const encounter = await this.prisma.encounter.findFirst({
      where: { id: dto.encounterId, patientId: dto.patientId, tenantId },
    });
    if (!encounter) {
      throw new NotFoundException('Encounter not found for this patient');
    }

    return this.prisma.$transaction(async (tx) => {
      const prescription = await tx.prescription.create({
        data: {
          tenantId,
          branchId,
          encounterId: dto.encounterId,
          patientId: dto.patientId,
          prescribedById: userId,
          medicationName: dto.medicationName,
          dosage: dto.dosage,
          frequency: dto.frequency,
          duration: dto.duration,
          notes: dto.notes,
          status: 'ACTIVE',
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'PRESCRIPTION_CREATED',
          recordType: 'Prescription',
          recordId: prescription.id,
          newValues: {
            patientId: dto.patientId,
            medicationName: dto.medicationName,
            dosage: dto.dosage,
            frequency: dto.frequency,
            duration: dto.duration,
          },
        },
        tx,
        branchId,
      );

      return prescription;
    });
  }

  async findByPatient(
    tenantId: string,
    patientId: string,
  ) {
    return this.prisma.prescription.findMany({
      where: {
        tenantId,
        patientId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
