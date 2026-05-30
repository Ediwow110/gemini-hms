import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private numbering: NumberingService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreatePatientDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Generate unique patient number using Numbering Engine
      const patientNumber = await this.numbering.generateNumber(
        tenantId,
        'PATIENT',
        undefined,
        tx,
      );

      // 2. Compute normalized duplicate key
      const normalizedNameDobKey = `${dto.firstName.trim().toLowerCase()}-${dto.lastName.trim().toLowerCase()}-${new Date(dto.dob).toISOString().split('T')[0]}`;

      const existing = await tx.patient.findFirst({
        where: {
          tenantId,
          normalizedNameDobKey,
        },
      });

      if (existing) {
        throw new ConflictException(
          'A patient with this name and birthdate already exists',
        );
      }

      // 3. Create Patient
      const patient = await tx.patient.create({
        data: {
          tenantId,
          patientNumber,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dob: new Date(dto.dob),
          normalizedNameDobKey,
          status: 'ACTIVE',
        },
      });

      // 4. Log Audit Event (PATIENT_CREATED)
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'PATIENT_CREATED',
          recordType: 'Patient',
          recordId: patient.id,
          newValues: patient,
        },
        tx,
      );

      return patient;
    });
  }

  async findAll(tenantId: string, search?: string) {
    const where: Prisma.PatientWhereInput = { tenantId };

    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { firstName: { contains: searchLower, mode: 'insensitive' } },
        { lastName: { contains: searchLower, mode: 'insensitive' } },
        { patientNumber: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    return this.prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(tenantId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdatePatientDto,
  ) {
    const existing = await this.findOne(tenantId, id);

    const firstName = dto.firstName ?? existing.firstName;
    const lastName = dto.lastName ?? existing.lastName;
    const dob = dto.dob ? new Date(dto.dob) : existing.dob;
    const normalizedNameDobKey = `${firstName.trim().toLowerCase()}-${lastName.trim().toLowerCase()}-${dob.toISOString().split('T')[0]}`;

    return this.prisma.$transaction(async (tx) => {
      try {
        const updateResult = await tx.patient.updateMany({
          where: { id, tenantId },
          data: {
            ...dto,
            dob: dto.dob ? new Date(dto.dob) : undefined,
            normalizedNameDobKey,
          },
        });

        if (updateResult.count === 0) {
          throw new NotFoundException('Patient not found');
        }
      } catch (e: any) {
        if (e.code === 'P2002') {
          throw new ConflictException(
            'A patient with this name and birthdate already exists',
          );
        }
        throw e;
      }

      const updated = await tx.patient.findFirst({
        where: { id, tenantId },
      });

      if (!updated) {
        throw new NotFoundException('Patient not found');
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'PATIENT_UPDATED',
          recordType: 'Patient',
          recordId: id,
          oldValues: existing,
          newValues: updated,
        },
        tx,
      );

      return updated;
    });
  }
}
