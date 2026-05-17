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
import { Prisma } from '@prisma/client';

@Injectable()
export class LabService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private approvals: ApprovalsService,
  ) {}

  async findOne(tenantId: string, branchId: string, id: string) {
    const result = await this.prisma.labResult.findFirst({
      where: { id, order: { tenantId, branchId }, deletedAt: null },
      include: { order: { include: { patient: true } } },
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

    // Guardrail (Section 15): Cannot edit released results
    if (result.status === 'RELEASED') {
      throw new ConflictException(
        'released_result_immutable: Cannot edit a result that has already been released',
      );
    }

    const updateResult = await this.prisma.labResult.updateMany({
      where: { id, order: { tenantId, branchId } },
      data: { status: 'ENCODED', results: dto.results, remarks: dto.remarks },
    });

    if (updateResult.count === 0) {
      throw new NotFoundException('Lab result not found');
    }

    const updated = await this.prisma.labResult.findFirst({
      where: { id, order: { tenantId, branchId } },
    });

    if (!updated) {
      throw new NotFoundException('Lab result not found');
    }

    await this.audit.log(
      {
        tenantId,
        userId,
        eventKey: 'RESULT_ENCODED',
        recordType: 'LabResult',
        recordId: id,
        newValues: { results: dto.results, remarks: dto.remarks },
      },
      undefined,
      branchId,
    );

    return updated;
  }

  async approveResult(
    tenantId: string,
    userId: string,
    branchId: string,
    id: string,
    dto: ApproveLabResultDto,
  ) {
    const result = await this.findOne(tenantId, branchId, id);

    if (result.status === 'RELEASED') {
      throw new ConflictException(
        'Cannot approve a result that is already released',
      );
    }

    const updateResult = await this.prisma.labResult.updateMany({
      where: { id, order: { tenantId, branchId } },
      data: { status: 'APPROVED', approvedById: userId },
    });

    if (updateResult.count === 0) {
      throw new NotFoundException('Lab result not found');
    }

    const updated = await this.prisma.labResult.findFirst({
      where: { id, order: { tenantId, branchId } },
    });

    if (!updated) {
      throw new NotFoundException('Lab result not found');
    }

    await this.audit.log(
      {
        tenantId,
        userId,
        eventKey: 'RESULT_APPROVED',
        recordType: 'LabResult',
        recordId: id,
        newValues: { approvedBy: userId, remarks: dto.pathologistRemarks },
      },
      undefined,
      branchId,
    );

    return updated;
  }

  async requestAmendment(
    tenantId: string,
    userId: string,
    branchId: string,
    id: string,
    dto: AmendLabResultDto,
  ) {
    const result = await this.findOne(tenantId, branchId, id);

    if (result.status !== 'RELEASED') {
      throw new BadRequestException('Only released results can be amended');
    }

    // 1. Create an approval request for the amendment (Maker-Checker rule)
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

    if (result.status !== 'RELEASED') {
      throw new BadRequestException(
        'Result must be released to apply an amendment',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Get current version count to increment
      const versionCount = await tx.labResultVersion.count({
        where: { labResultId: id },
      });

      // 2. Archive current state (Versioning rule)
      const version = await tx.labResultVersion.create({
        data: {
          labResultId: id,
          version: versionCount + 1,
          oldStatus: result.status,
          newStatus: 'AMENDED',
          amendedById: userId,
          reason: reason,
          oldData: {
            results: result.results,
            remarks: result.remarks,
            approvedById: result.approvedById,
            lockedAt: result.lockedAt,
          },
        },
      });

      const updateResult = await tx.labResult.updateMany({
        where: { id, order: { tenantId, branchId } },
        data: {
          status: 'AMENDED', // Resetting to allow re-encoding/re-approval
          lockedAt: null,
          approvedById: null,
          results: Prisma.DbNull, // Clear to allow re-encoding
          remarks: null,
        },
      });

      if (updateResult.count === 0) {
        throw new NotFoundException('Lab result not found');
      }

      const updated = await tx.labResult.findFirst({
        where: { id, order: { tenantId, branchId } },
      });

      if (!updated) {
        throw new NotFoundException('Lab result not found');
      }

      // 4. System Audit
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RESULT_AMENDMENT_APPLIED',
          recordType: 'LabResult',
          recordId: id,
          newValues: { versionId: version.id, status: 'AMENDED' },
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

    if (result.status !== 'APPROVED') {
      throw new BadRequestException('Only approved results can be released');
    }

    // Atomic Release Transaction (Section 13)
    return this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.labResult.updateMany({
        where: { id, order: { tenantId, branchId } },
        data: { status: 'RELEASED', lockedAt: new Date() },
      });

      if (updateResult.count === 0) {
        throw new NotFoundException('Lab result not found');
      }

      const updated = await tx.labResult.findFirst({
        where: { id, order: { tenantId, branchId } },
      });

      if (!updated?.lockedAt) {
        throw new NotFoundException('Lab result not found');
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RESULT_RELEASED',
          recordType: 'LabResult',
          recordId: id,
          newValues: { releasedAt: updated.lockedAt },
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
        order: { tenantId, branchId },
        status: { in: ['PENDING_COLLECTION', 'ENCODED', 'APPROVED'] },
      },
      include: {
        order: { include: { patient: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
