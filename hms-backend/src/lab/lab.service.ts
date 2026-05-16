import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EncodeLabResultDto,
  ApproveLabResultDto,
  AmendLabResultDto,
} from './dto/lab.dto';
import { ApprovalsService } from '../approvals/approvals.service';
import { AuditService } from '../audit/audit.service';
import { LabResultStatus } from '@prisma/client';

@Injectable()
export class LabService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private approvals: ApprovalsService,
  ) {}

  async findOne(tenantId: string, branchId: string, id: string) {
    const result = await this.prisma.labResult.findFirst({
      where: { id, tenantId, branchId },
      include: {
        specimen: true,
        items: true,
      },
    });

    if (!result) {
      throw new NotFoundException('Lab result not found');
    }

    return result;
  }

  async encodeResult(
    tenantId: string,
    userId: string,
    branchId: string,
    id: string,
    dto: EncodeLabResultDto,
  ) {
    const result = await this.findOne(tenantId, branchId, id);

    if (result.status === LabResultStatus.RELEASED) {
      throw new ConflictException(
        'released_result_immutable: Cannot edit a result that has already been released',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.labResultItem.deleteMany({
        where: { labResultId: id },
      });

      const items = dto.items.map((item) => ({
        tenantId,
        labResultId: id,
        testName: item.testName,
        value: item.value,
        unit: item.unit,
        referenceRange: item.referenceRange,
        flag: item.flag,
      }));

      const updated = await tx.labResult.update({
        where: { id },
        data: {
          status: LabResultStatus.ENCODED,
          remarks: dto.remarks,
          encodedById: userId,
          encodedAt: new Date(),
          items: { create: items },
        },
        include: { items: true },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RESULT_ENCODED',
          recordType: 'LabResult',
          recordId: id,
          newValues: { items: dto.items, remarks: dto.remarks },
        },
        tx,
        branchId,
      );

      return updated;
    });
  }

  async validateResult(
    tenantId: string,
    userId: string,
    branchId: string,
    id: string,
  ) {
    const result = await this.findOne(tenantId, branchId, id);

    if (result.status !== LabResultStatus.ENCODED) {
      throw new BadRequestException('Only encoded results can be validated');
    }

    if (result.encodedById === userId) {
      throw new ConflictException(
        'self_validation_blocked: Encoder cannot validate their own result',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.labResult.update({
        where: { id },
        data: {
          status: LabResultStatus.VALIDATED,
          validatedById: userId,
          validatedAt: new Date(),
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RESULT_VALIDATED',
          recordType: 'LabResult',
          recordId: id,
          newValues: { validatedBy: userId },
        },
        tx,
        branchId,
      );

      return updated;
    });
  }

  async approveResult(
    tenantId: string,
    userId: string,
    branchId: string,
    id: string,
    dto: ApproveLabResultDto,
  ) {
    const result = await this.findOne(tenantId, branchId, id);

    if (
      result.status !== LabResultStatus.ENCODED &&
      result.status !== LabResultStatus.VALIDATED
    ) {
      throw new BadRequestException(
        'Only encoded or validated results can be approved',
      );
    }

    if (result.encodedById === userId) {
      throw new ConflictException(
        'self_approval_blocked: Encoder cannot approve their own result',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.labResult.update({
        where: { id },
        data: {
          status: LabResultStatus.APPROVED,
          approvedById: userId,
          approvedAt: new Date(),
          remarks: dto.remarks ?? result.remarks,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RESULT_APPROVED',
          recordType: 'LabResult',
          recordId: id,
          newValues: { approvedBy: userId, remarks: dto.remarks },
        },
        tx,
        branchId,
      );

      return updated;
    });
  }

  async requestAmendment(
    tenantId: string,
    userId: string,
    branchId: string,
    id: string,
    dto: AmendLabResultDto,
  ) {
    const result = await this.findOne(tenantId, branchId, id);

    if (result.status !== LabResultStatus.RELEASED) {
      throw new BadRequestException('Only released results can be amended');
    }

    return this.approvals.createRequest(tenantId, userId, {
      type: 'RESULT_AMENDMENT',
      riskLevel: 'CRITICAL',
      recordId: id,
      reason: dto.reason,
    });
  }

  async applyAmendment(
    tenantId: string,
    userId: string,
    branchId: string,
    id: string,
    reason: string,
  ) {
    const result = await this.findOne(tenantId, branchId, id);

    if (result.status !== LabResultStatus.RELEASED) {
      throw new BadRequestException(
        'Result must be released to apply an amendment',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const currentItems = await tx.labResultItem.findMany({
        where: { labResultId: id },
      });

      const versionCount = await tx.labResultVersion.count({
        where: { labResultId: id },
      });

      await tx.labResultVersion.create({
        data: {
          tenantId,
          labResultId: id,
          version: versionCount + 1,
          previousData: {
            items: currentItems,
            remarks: result.remarks,
            approvedById: result.approvedById,
            approvedAt: result.approvedAt,
          },
          reasonForAmendment: reason,
          amendedById: userId,
        },
      });

      const updated = await tx.labResult.update({
        where: { id },
        data: {
          status: LabResultStatus.AMENDED,
          approvedById: null,
          approvedAt: null,
          validatedById: null,
          validatedAt: null,
        },
        include: { items: true },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RESULT_AMENDMENT_APPLIED',
          recordType: 'LabResult',
          recordId: id,
          newValues: { status: 'AMENDED', reason },
        },
        tx,
        branchId,
      );

      return updated;
    });
  }

  async releaseResult(
    tenantId: string,
    userId: string,
    branchId: string,
    id: string,
  ) {
    const result = await this.findOne(tenantId, branchId, id);

    if (result.status !== LabResultStatus.APPROVED) {
      throw new BadRequestException('Only approved results can be released');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.labResult.update({
        where: { id },
        data: {
          status: LabResultStatus.RELEASED,
          releasedById: userId,
          releasedAt: new Date(),
        },
      });

      if (!updated.releasedAt) {
        throw new NotFoundException('Lab result not found');
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RESULT_RELEASED',
          recordType: 'LabResult',
          recordId: id,
          newValues: { releasedAt: updated.releasedAt },
        },
        tx,
        branchId,
      );

      return updated;
    });
  }

  async getPendingWorklist(tenantId: string, branchId: string) {
    return this.prisma.labResult.findMany({
      where: {
        tenantId,
        branchId,
        status: {
          in: [
            LabResultStatus.ENCODED,
            LabResultStatus.VALIDATED,
            LabResultStatus.APPROVED,
          ],
        },
      },
      include: {
        specimen: true,
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
