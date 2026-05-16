import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateLabOrderDto,
  CreateSpecimenDto,
  UpdateSpecimenStatusDto,
} from './dto/lis.dto';
import { SpecimenStatus } from '@prisma/client';

@Injectable()
export class LisService {
  private readonly logger = new Logger(LisService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createLabOrder(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: CreateLabOrderDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        // Validate patient exists and belongs to tenant
        const patient = await tx.patient.findFirst({
          where: { id: dto.patientId, tenantId },
        });
        if (!patient) {
          throw new NotFoundException('Patient not found');
        }

        const order = await tx.labOrder.create({
          data: {
            tenantId,
            branchId,
            patientId: dto.patientId,
            encounterId: dto.encounterId,
            orderingPhysicianId: dto.orderingPhysicianId,
            priority: dto.priority || 'ROUTINE',
            notes: dto.notes,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'LAB_ORDER_CREATED',
            recordType: 'LabOrder',
            recordId: order.id,
            newValues: { patientId: order.patientId, priority: order.priority },
          },
          tx,
          branchId,
        );

        return order;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async addSpecimen(
    tenantId: string,
    userId: string,
    branchId: string,
    labOrderId: string,
    dto: CreateSpecimenDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.labOrder.findFirst({
        where: { id: labOrderId, tenantId },
      });
      if (!order) {
        throw new NotFoundException('Lab order not found');
      }

      const specimen = await tx.specimen.create({
        data: {
          tenantId,
          labOrderId,
          barcode: dto.barcode,
          specimenType: dto.specimenType,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'SPECIMEN_ADDED',
          recordType: 'Specimen',
          recordId: specimen.id,
          newValues: { barcode: specimen.barcode, type: specimen.specimenType },
        },
        tx,
        branchId,
      );

      return specimen;
    });
  }

  private assertValidTransition(current: SpecimenStatus, next: SpecimenStatus) {
    const validTransitions: Record<SpecimenStatus, SpecimenStatus[]> = {
      PENDING_COLLECTION: ['COLLECTED', 'REJECTED'],
      COLLECTED: ['RECEIVED', 'REJECTED'],
      RECEIVED: [],
      REJECTED: [],
    };

    if (!validTransitions[current]?.includes(next)) {
      throw new ConflictException('invalid_workflow_transition');
    }
  }

  async updateSpecimenStatus(
    tenantId: string,
    userId: string,
    branchId: string,
    specimenId: string,
    dto: UpdateSpecimenStatusDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const specimen = await tx.specimen.findFirst({
        where: { id: specimenId, tenantId },
      });
      if (!specimen) {
        throw new NotFoundException('Specimen not found');
      }

      this.assertValidTransition(specimen.status, dto.status);

      const updateData: any = {
        status: dto.status,
        updatedBy: userId,
      };

      if (dto.status === 'COLLECTED') {
        updateData.collectedAt = new Date();
      } else if (dto.status === 'RECEIVED') {
        updateData.receivedAt = new Date();
      } else if (dto.status === 'REJECTED') {
        updateData.rejectionReason = dto.rejectionReason;
      }

      const updated = await tx.specimen.update({
        where: { id: specimenId },
        data: updateData,
      });

      const eventKey =
        dto.status === 'COLLECTED'
          ? 'SPECIMEN_COLLECTED'
          : dto.status === 'RECEIVED'
            ? 'SPECIMEN_RECEIVED'
            : dto.status === 'REJECTED'
              ? 'SPECIMEN_REJECTED'
              : 'SPECIMEN_STATUS_UPDATED';

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey,
          recordType: 'Specimen',
          recordId: specimenId,
          oldValues: { status: specimen.status },
          newValues: { status: updated.status },
        },
        tx,
        branchId,
      );

      return updated;
    });
  }
}
