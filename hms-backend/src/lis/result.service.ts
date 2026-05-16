import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EncodeResultDto, AmendResultDto } from './dto/result.dto';
import { LabResultStatus } from '@prisma/client';

@Injectable()
export class ResultService {
  private readonly logger = new Logger(ResultService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private assertValidTransition(
    current: LabResultStatus,
    next: LabResultStatus,
  ) {
    const validTransitions: Record<LabResultStatus, LabResultStatus[]> = {
      ENCODED: ['VALIDATED', 'CANCELLED'],
      VALIDATED: ['APPROVED', 'CANCELLED'],
      APPROVED: ['RELEASED', 'CANCELLED'],
      RELEASED: ['AMENDED'],
      AMENDED: ['VALIDATED'],
      CANCELLED: [],
    };

    if (!validTransitions[current]?.includes(next)) {
      throw new ConflictException('invalid_workflow_transition');
    }
  }

  async encodeResult(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: EncodeResultDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const specimen = await tx.specimen.findFirst({
        where: { id: dto.specimenId, tenantId },
      });
      if (!specimen) {
        throw new NotFoundException('Specimen not found');
      }

      if (specimen.status !== 'RECEIVED') {
        throw new ConflictException(
          'Specimen must be RECEIVED before encoding results',
        );
      }

      const result = await tx.labResult.create({
        data: {
          tenantId,
          branchId,
          specimenId: dto.specimenId,
          status: LabResultStatus.ENCODED,
          remarks: dto.remarks,
          encodedById: userId,
          items: {
            create: dto.items.map((item) => ({
              tenantId,
              testName: item.testName,
              value: item.value,
              unit: item.unit,
              referenceRange: item.referenceRange,
              flag: item.flag || 'NORMAL',
            })),
          },
        },
        include: { items: true },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RESULT_ENCODED',
          recordType: 'LabResult',
          recordId: result.id,
          newValues: { specimenId: result.specimenId, status: result.status },
        },
        tx,
        branchId,
      );

      return result;
    });
  }

  async transitionStatus(
    tenantId: string,
    userId: string,
    branchId: string,
    resultId: string,
    nextStatus: LabResultStatus,
    eventKey: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.labResult.findFirst({
        where: { id: resultId, tenantId },
        include: { items: true },
      });
      if (!result) {
        throw new NotFoundException('Lab result not found');
      }

      this.assertValidTransition(result.status, nextStatus);

      if (
        nextStatus === LabResultStatus.APPROVED &&
        result.encodedById === userId
      ) {
        throw new ForbiddenException('self_approval_blocked');
      }

      const updateData: any = { status: nextStatus };
      if (nextStatus === LabResultStatus.VALIDATED) {
        updateData.validatedById = userId;
        updateData.validatedAt = new Date();
      } else if (nextStatus === LabResultStatus.APPROVED) {
        updateData.approvedById = userId;
        updateData.approvedAt = new Date();
      } else if (nextStatus === LabResultStatus.RELEASED) {
        updateData.releasedById = userId;
        updateData.releasedAt = new Date();
      }

      const updated = await tx.labResult.update({
        where: { id: resultId },
        data: updateData,
        include: { items: true },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey,
          recordType: 'LabResult',
          recordId: resultId,
          oldValues: { status: result.status },
          newValues: { status: updated.status },
        },
        tx,
        branchId,
      );

      return updated;
    });
  }

  async amendResult(
    tenantId: string,
    userId: string,
    branchId: string,
    resultId: string,
    dto: AmendResultDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.labResult.findFirst({
        where: { id: resultId, tenantId },
        include: { items: true },
      });
      if (!result) {
        throw new NotFoundException('Lab result not found');
      }

      if (result.status !== LabResultStatus.RELEASED) {
        throw new ConflictException('released_result_immutable');
      }

      const versionCount = await tx.labResultVersion.count({
        where: { labResultId: resultId },
      });

      await tx.labResultVersion.create({
        data: {
          tenantId,
          labResultId: resultId,
          version: versionCount + 1,
          previousData: {
            status: result.status,
            remarks: result.remarks,
            items: result.items,
            approvedById: result.approvedById,
            releasedById: result.releasedById,
          },
          reasonForAmendment: dto.reasonForAmendment,
          amendedById: userId,
        },
      });

      await tx.labResultItem.deleteMany({
        where: { labResultId: resultId },
      });

      const updated = await tx.labResult.update({
        where: { id: resultId },
        data: {
          status: LabResultStatus.AMENDED,
          remarks: dto.remarks,
          approvedById: null,
          approvedAt: null,
          releasedById: null,
          releasedAt: null,
          items: {
            create: dto.items.map((item) => ({
              tenantId,
              testName: item.testName,
              value: item.value,
              unit: item.unit,
              referenceRange: item.referenceRange,
              flag: item.flag || 'NORMAL',
            })),
          },
        },
        include: { items: true },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RESULT_AMENDED',
          recordType: 'LabResult',
          recordId: resultId,
          oldValues: { status: result.status },
          newValues: { status: updated.status, version: versionCount + 1 },
        },
        tx,
        branchId,
      );

      return updated;
    });
  }
}
