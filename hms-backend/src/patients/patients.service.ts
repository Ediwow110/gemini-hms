import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { REDIS_CLIENT } from '../common/redis/redis.provider';
import Redis from 'ioredis';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private numbering: NumberingService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
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
    const where: Prisma.PatientWhereInput = { tenantId, archivedAt: null };

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
    const cacheKey = `patient:${tenantId}:${id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId, archivedAt: null },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Cache for 1 hour (3600 seconds)
    await this.redis.set(cacheKey, JSON.stringify(patient), 'EX', 3600);

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

    const updated = await this.prisma.$transaction(async (tx) => {
      try {
        const updateResult = await tx.patient.updateMany({
          where: { id, tenantId, archivedAt: null },
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

      const updatedRow = await tx.patient.findFirst({
        where: { id, tenantId, archivedAt: null },
      });

      if (!updatedRow) {
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
          newValues: updatedRow,
        },
        tx,
      );

      return updatedRow;
    });

    const cacheKey = `patient:${tenantId}:${id}`;
    await this.redis.del(cacheKey);

    return updated;
  }
}
