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
import * as crypto from 'crypto';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  clampTake,
} from '../common/utils/pagination';

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
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.labResult.findFirst({
        where: { id, order: { tenantId, branchId }, deletedAt: null },
      });

      if (!result) {
        throw new NotFoundException('Lab result not found');
      }

      if (
        dto.expectedVersion !== undefined &&
        result.version !== dto.expectedVersion
      ) {
        throw new ConflictException('Stale data: version mismatch');
      }

      // Guardrail (Section 15): Cannot edit released results
      if (result.status === 'RELEASED') {
        throw new ConflictException(
          'released_result_immutable: Cannot edit a result that has already been released',
        );
      }

      const updateResult = await tx.labResult.updateMany({
        where: { id, order: { tenantId, branchId }, version: result.version },
        data: {
          status: 'ENCODED',
          results: dto.results,
          remarks: dto.remarks,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Stale data: version mismatch during update',
        );
      }

      const updated = await tx.labResult.findFirst({
        where: { id, order: { tenantId, branchId } },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RESULT_ENCODED',
          recordType: 'LabResult',
          recordId: id,
          newValues: {
            results: dto.results,
            remarks: dto.remarks,
            version: result.version + 1,
          },
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
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.labResult.findFirst({
        where: { id, order: { tenantId, branchId }, deletedAt: null },
        include: { order: { include: { patient: true } } },
      });

      if (!result) {
        throw new NotFoundException('Lab result not found');
      }

      if (
        dto.expectedVersion !== undefined &&
        result.version !== dto.expectedVersion
      ) {
        throw new ConflictException('Stale data: version mismatch');
      }

      if (result.status === 'RELEASED') {
        throw new ConflictException(
          'Cannot approve a result that is already released',
        );
      }

      const updateResult = await tx.labResult.updateMany({
        where: { id, order: { tenantId, branchId }, version: result.version },
        data: {
          status: 'APPROVED',
          approvedById: userId,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Stale data: version mismatch during update',
        );
      }

      const updated = await tx.labResult.findFirst({
        where: { id, order: { tenantId, branchId } },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RESULT_APPROVED',
          recordType: 'LabResult',
          recordId: id,
          newValues: {
            approvedBy: userId,
            remarks: dto.pathologistRemarks,
            version: result.version + 1,
          },
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

    if (result.status !== 'RELEASED') {
      throw new BadRequestException('Only released results can be amended');
    }

    // 1. Create an approval request for the amendment (Maker-Checker rule)
    return this.approvals.createRequest(tenantId, userId, {
      type: 'RESULT_AMENDMENT',
      riskLevel: 'CRITICAL',
      recordId: id,
      reason: dto.reason,
      branchId,
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
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.labResult.findFirst({
        where: { id, order: { tenantId, branchId } },
        include: { order: true },
      });

      if (!result) {
        throw new NotFoundException('Lab result not found');
      }

      if (result.status === 'RELEASED') {
        throw new ConflictException('Result already released');
      }

      if (result.status !== 'APPROVED') {
        throw new BadRequestException('Result must be APPROVED before release');
      }

      const released = await tx.labResult.update({
        where: { id },
        data: { status: 'RELEASED', lockedAt: new Date() },
      });

      await tx.labResultSignature.create({
        data: {
          labResultId: released.id,
          signedById: userId,
          signedAt: new Date(),
          signatureHash: crypto
            .createHash('sha256')
            .update(`${released.id}-${userId}-${Date.now()}`)
            .digest('hex'),
        },
      });

      await tx.order.update({
        where: { id: released.orderId },
        data: { status: 'RELEASED' },
      });

      await tx.notificationOutbox.create({
        data: {
          recipientId: result.order.patientId,
          type: 'LAB_RESULT_READY',
          payload: JSON.stringify({
            resultId: released.id,
            orderId: result.orderId,
          }),
          scheduledAt: new Date(),
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'LAB_RESULT_RELEASED',
          recordType: 'LabResult',
          recordId: id,
          newValues: { status: 'RELEASED', releasedAt: released.lockedAt },
        },
        tx,
        branchId,
      );

      return released;
    });
  }

  async getPendingWorklist(
    tenantId: string,
    branchId: string,
    pageSize?: number,
  ) {
    const take = clampTake(pageSize, MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    return this.prisma.labResult.findMany({
      where: {
        order: { tenantId, branchId },
        status: { in: ['PENDING_COLLECTION', 'ENCODED', 'APPROVED'] },
      },
      include: {
        order: { include: { patient: true } },
      },
      orderBy: { createdAt: 'asc' },
      take,
    });
  }

  // ──── Phase 4D: Specimen Receiving ────

  async getPendingSpecimens(
    tenantId: string,
    branchId: string,
    pageSize?: number,
  ) {
    const take = clampTake(pageSize, MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    // Find lab specimens that need receiving (collected but not yet received)
    // Also find orders with lab results awaiting specimen collection
    const specimens = await this.prisma.labSpecimen.findMany({
      where: {
        tenantId,
        branchId,
        status: { in: ['COLLECTED', 'PENDING'] },
      },
      include: {
        order: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientNumber: true,
              },
            },
            clinicalItems: { select: { itemName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take,
    });

    // Also find orders with lab results that have no specimen yet
    const ordersWithResults = await this.prisma.labResult.findMany({
      where: {
        order: { tenantId, branchId, labSpecimen: null },
        status: 'PENDING_COLLECTION',
      },
      include: {
        order: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientNumber: true,
              },
            },
            clinicalItems: { select: { itemName: true } },
          },
        },
      },
      take,
    });

    return [
      ...specimens.map((s) => ({
        id: s.id,
        orderId: s.orderId,
        orderNumber: s.order.orderNumber,
        patientId: s.patientId,
        patientName: `${s.order.patient.firstName} ${s.order.patient.lastName}`,
        patientMrn: s.order.patient.patientNumber,
        specimenType: s.specimenType,
        collectionMode: s.collectionMode,
        collectedAt: s.collectedAt?.toISOString() || null,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        testNames: s.order.clinicalItems.map((ci) => ci.itemName),
      })),
      ...ordersWithResults.map((lr) => ({
        id: lr.orderId,
        orderId: lr.orderId,
        orderNumber: lr.order.orderNumber,
        patientId: lr.order.patientId,
        patientName: `${lr.order.patient.firstName} ${lr.order.patient.lastName}`,
        patientMrn: lr.order.patient.patientNumber,
        specimenType: 'Pending',
        collectionMode: 'N/A',
        collectedAt: null,
        status: 'PENDING_COLLECTION',
        createdAt: lr.createdAt.toISOString(),
        testNames: lr.order.clinicalItems.map((ci) => ci.itemName),
      })),
    ];
  }

  async receiveSpecimen(
    tenantId: string,
    userId: string,
    branchId: string,
    specimenIdOrOrderId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Find existing specimen or order to create one
      const specimen = await tx.labSpecimen.findFirst({
        where: {
          OR: [{ id: specimenIdOrOrderId }, { orderId: specimenIdOrOrderId }],
          tenantId,
          branchId,
        },
      });

      if (specimen) {
        if (specimen.status === 'RECEIVED') {
          throw new ConflictException('Specimen already received');
        }
        const updated = await tx.labSpecimen.update({
          where: { id: specimen.id },
          data: {
            status: 'RECEIVED',
            receivedAt: new Date(),
            receivedById: userId,
          },
        });
        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'SPECIMEN_RECEIVED',
            recordType: 'LabSpecimen',
            recordId: updated.id,
            oldValues: { status: specimen.status },
            newValues: { status: 'RECEIVED' },
          },
          tx,
          branchId,
        );
        return updated;
      }

      // No specimen exists yet — create one and mark received
      const order = await tx.order.findFirst({
        where: { id: specimenIdOrOrderId, tenantId, branchId },
      });
      if (!order) {
        throw new NotFoundException('Order not found for specimen receiving');
      }

      const created = await tx.labSpecimen.create({
        data: {
          tenantId,
          branchId,
          patientId: order.patientId,
          orderId: order.id,
          specimenType: 'Unknown',
          status: 'RECEIVED',
          receivedAt: new Date(),
          receivedById: userId,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'SPECIMEN_RECEIVED',
          recordType: 'LabSpecimen',
          recordId: created.id,
          newValues: { status: 'RECEIVED', orderId: order.id },
        },
        tx,
        branchId,
      );

      return created;
    });
  }

  // ──── Phase 4D: Releasable Results ────

  async getReleasableResults(
    tenantId: string,
    branchId: string,
    pageSize?: number,
  ) {
    const take = clampTake(pageSize, MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const results = await this.prisma.labResult.findMany({
      where: {
        order: { tenantId, branchId },
        status: 'APPROVED',
      },
      include: {
        order: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientNumber: true,
              },
            },
            clinicalItems: { select: { itemName: true } },
          },
        },
      },
      orderBy: { validatedAt: 'asc' },
      take,
    });

    return results.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      orderNumber: r.order.orderNumber,
      patientId: r.order.patientId,
      patientName: `${r.order.patient.firstName} ${r.order.patient.lastName}`,
      patientMrn: r.order.patient.patientNumber,
      status: r.status,
      encodedById: r.encodedById,
      encodedAt: r.encodedAt?.toISOString() || null,
      validatedById: r.validatedById,
      validatedAt: r.validatedAt?.toISOString() || null,
      results: r.results,
      remarks: r.remarks,
      createdAt: r.createdAt.toISOString(),
      testNames: r.order.clinicalItems.map((ci) => ci.itemName),
    }));
  }

  // ──── Phase 4E: Critical Results ────

  async getCriticalResults(
    tenantId: string,
    branchId: string,
    status?: string,
    pageSize?: number,
  ) {
    const take = clampTake(pageSize, MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const whereClause: any = {
      isCritical: true,
      order: { tenantId, branchId },
    };

    if (
      status &&
      ['OPEN', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED'].includes(status)
    ) {
      whereClause.criticalStatus = status;
    }

    const results = await this.prisma.labResult.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientNumber: true,
              },
            },
            clinicalItems: { select: { itemName: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take,
    });

    return results.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      orderNumber: r.order.orderNumber,
      patientId: r.order.patientId,
      patientName: `${r.order.patient.firstName} ${r.order.patient.lastName}`,
      patientMrn: r.order.patient.patientNumber,
      testNames: r.order.clinicalItems.map((ci) => ci.itemName),
      results: r.results,
      status: r.status,
      isCritical: r.isCritical,
      criticalStatus: r.criticalStatus,
      criticalAcknowledgedAt: r.criticalAcknowledgedAt?.toISOString() || null,
      criticalAcknowledgedById: r.criticalAcknowledgedById,
      criticalEscalatedAt: r.criticalEscalatedAt?.toISOString() || null,
      criticalEscalatedById: r.criticalEscalatedById,
      criticalEscalationNotes: r.criticalEscalationNotes,
      criticalResolvedAt: r.criticalResolvedAt?.toISOString() || null,
      criticalResolvedById: r.criticalResolvedById,
      criticalResolvedNotes: r.criticalResolvedNotes,
      encodedAt: r.encodedAt?.toISOString() || null,
      validatedAt: r.validatedAt?.toISOString() || null,
      releasedAt: r.releasedAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async markResultAsCritical(
    tenantId: string,
    userId: string,
    branchId: string,
    resultId: string,
    reason?: string,
    expectedVersion?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.labResult.findFirst({
        where: { id: resultId, order: { tenantId, branchId }, deletedAt: null },
        include: { order: true },
      });

      if (!result) {
        throw new NotFoundException('Lab result not found');
      }

      if (expectedVersion !== undefined && result.version !== expectedVersion) {
        throw new ConflictException('Stale data: version mismatch');
      }

      if (result.status !== 'APPROVED' && result.status !== 'RELEASED') {
        throw new BadRequestException(
          'Only APPROVED or RELEASED results can be marked as critical',
        );
      }

      const updated = await tx.labResult.updateMany({
        where: {
          id: resultId,
          order: { tenantId, branchId },
          version: result.version,
        },
        data: {
          isCritical: true,
          criticalStatus: 'OPEN',
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new ConflictException(
          'Stale data: version mismatch during update',
        );
      }

      // Create notification outbox entry for critical result
      await tx.notificationOutbox.create({
        data: {
          recipientId: result.order.patientId,
          type: 'CRITICAL_RESULT',
          payload: JSON.stringify({
            resultId,
            orderId: result.orderId,
            reason: reason || null,
          }),
          scheduledAt: new Date(),
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'LAB_RESULT_MARKED_CRITICAL',
          recordType: 'LabResult',
          recordId: resultId,
          oldValues: { isCritical: false },
          newValues: {
            isCritical: true,
            criticalStatus: 'OPEN',
            reason: reason || null,
            version: result.version + 1,
          },
        },
        tx,
        branchId,
      );

      return this.getCriticalResults(tenantId, branchId);
    });
  }

  async acknowledgeCriticalResult(
    tenantId: string,
    userId: string,
    branchId: string,
    resultId: string,
    notes?: string,
    expectedVersion?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.labResult.findFirst({
        where: { id: resultId, order: { tenantId, branchId }, deletedAt: null },
      });

      if (!result) {
        throw new NotFoundException('Lab result not found');
      }

      if (expectedVersion !== undefined && result.version !== expectedVersion) {
        throw new ConflictException('Stale data: version mismatch');
      }

      if (!result.isCritical) {
        throw new BadRequestException('Result is not marked as critical');
      }

      if (result.criticalStatus === 'RESOLVED') {
        throw new ConflictException('Critical result is already resolved');
      }

      const updated = await tx.labResult.updateMany({
        where: {
          id: resultId,
          order: { tenantId, branchId },
          version: result.version,
        },
        data: {
          criticalStatus: 'ACKNOWLEDGED',
          criticalAcknowledgedAt: new Date(),
          criticalAcknowledgedById: userId,
          criticalEscalationNotes: notes || null,
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new ConflictException(
          'Stale data: version mismatch during update',
        );
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'CRITICAL_RESULT_ACKNOWLEDGED',
          recordType: 'LabResult',
          recordId: resultId,
          oldValues: { criticalStatus: result.criticalStatus },
          newValues: {
            criticalStatus: 'ACKNOWLEDGED',
            acknowledgedAt: new Date().toISOString(),
            version: result.version + 1,
          },
        },
        tx,
        branchId,
      );

      return this.getCriticalResults(tenantId, branchId);
    });
  }

  async escalateCriticalResult(
    tenantId: string,
    userId: string,
    branchId: string,
    resultId: string,
    notes: string,
    expectedVersion?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.labResult.findFirst({
        where: { id: resultId, order: { tenantId, branchId }, deletedAt: null },
      });

      if (!result) {
        throw new NotFoundException('Lab result not found');
      }

      if (expectedVersion !== undefined && result.version !== expectedVersion) {
        throw new ConflictException('Stale data: version mismatch');
      }

      if (!result.isCritical) {
        throw new BadRequestException('Result is not marked as critical');
      }

      if (result.criticalStatus === 'RESOLVED') {
        throw new ConflictException('Critical result is already resolved');
      }

      const updated = await tx.labResult.updateMany({
        where: {
          id: resultId,
          order: { tenantId, branchId },
          version: result.version,
        },
        data: {
          criticalStatus: 'ESCALATED',
          criticalEscalatedAt: new Date(),
          criticalEscalatedById: userId,
          criticalEscalationNotes: notes,
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new ConflictException(
          'Stale data: version mismatch during update',
        );
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'CRITICAL_RESULT_ESCALATED',
          recordType: 'LabResult',
          recordId: resultId,
          oldValues: { criticalStatus: result.criticalStatus },
          newValues: {
            criticalStatus: 'ESCALATED',
            notes,
            version: result.version + 1,
          },
        },
        tx,
        branchId,
      );

      return this.getCriticalResults(tenantId, branchId);
    });
  }

  async resolveCriticalResult(
    tenantId: string,
    userId: string,
    branchId: string,
    resultId: string,
    notes?: string,
    expectedVersion?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.labResult.findFirst({
        where: { id: resultId, order: { tenantId, branchId }, deletedAt: null },
      });

      if (!result) {
        throw new NotFoundException('Lab result not found');
      }

      if (expectedVersion !== undefined && result.version !== expectedVersion) {
        throw new ConflictException('Stale data: version mismatch');
      }

      if (!result.isCritical) {
        throw new BadRequestException('Result is not marked as critical');
      }

      const updated = await tx.labResult.updateMany({
        where: {
          id: resultId,
          order: { tenantId, branchId },
          version: result.version,
        },
        data: {
          criticalStatus: 'RESOLVED',
          criticalResolvedAt: new Date(),
          criticalResolvedById: userId,
          criticalResolvedNotes: notes || null,
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new ConflictException(
          'Stale data: version mismatch during update',
        );
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'CRITICAL_RESULT_RESOLVED',
          recordType: 'LabResult',
          recordId: resultId,
          oldValues: { criticalStatus: result.criticalStatus },
          newValues: {
            criticalStatus: 'RESOLVED',
            version: result.version + 1,
          },
        },
        tx,
        branchId,
      );

      return this.getCriticalResults(tenantId, branchId);
    });
  }

  // ──── Phase 4F: Turnaround Time Metrics ────

  async getTurnaroundMetrics(tenantId: string, branchId: string) {
    // Query all lab results for this tenant/branch with their specimens and orders.
    // SAFETY: Use a high cap (5000) to prevent memory DoS while keeping recent
    // results for meaningful metrics.
    const TAT_SAFETY_CAP = 5000;
    const results = await this.prisma.labResult.findMany({
      where: {
        order: { tenantId, branchId },
        deletedAt: null,
      },
      include: {
        order: {
          include: {
            labSpecimen: { select: { receivedAt: true } },
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientNumber: true,
              },
            },
            clinicalItems: { select: { itemName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: TAT_SAFETY_CAP,
    });

    const releasedResults = results.filter((r) => r.status === 'RELEASED');
    const encodedResults = results.filter((r) => r.encodedAt);
    const validatedResults = results.filter((r) => r.validatedAt);

    // Helper: compute minutes between two dates
    const minutesDiff = (
      end?: Date | null,
      start?: Date | null,
    ): number | null => {
      if (!end || !start) return null;
      return Math.round((end.getTime() - start.getTime()) / 60000);
    };

    // Helper: compute stats for a duration field
    const computeMetric = (
      label: string,
      field: string,
      values: (number | null)[],
    ): {
      label: string;
      field: string;
      count: number;
      averageMinutes: number | null;
      minMinutes: number | null;
      maxMinutes: number | null;
      missingTimestampCount: number;
    } => {
      const validValues = values.filter(
        (v): v is number => v !== null && v >= 0,
      );
      return {
        label,
        field,
        count: validValues.length,
        averageMinutes:
          validValues.length > 0
            ? Math.round(
                validValues.reduce((a, b) => a + b, 0) / validValues.length,
              )
            : null,
        minMinutes: validValues.length > 0 ? Math.min(...validValues) : null,
        maxMinutes: validValues.length > 0 ? Math.max(...validValues) : null,
        missingTimestampCount: values.length - validValues.length,
      };
    };

    // Compute specimen-to-release (core TAT)
    const specimenToRelease = releasedResults.map((r) =>
      minutesDiff(r.releasedAt, r.order.labSpecimen?.receivedAt),
    );

    // Compute order-to-release
    const orderToRelease = releasedResults.map((r) =>
      minutesDiff(r.releasedAt, r.order.createdAt),
    );

    // Compute receipt-to-encode
    const receiptToEncode = encodedResults.map((r) =>
      minutesDiff(r.encodedAt, r.order.labSpecimen?.receivedAt),
    );

    // Compute encode-to-validate
    const encodeToValidate = validatedResults.map((r) =>
      minutesDiff(r.validatedAt, r.encodedAt),
    );

    // Compute validate-to-release
    const validateToRelease = releasedResults.map((r) =>
      minutesDiff(r.releasedAt, r.validatedAt),
    );

    // Detail rows (most recent 50 results)
    const detailRows = results.slice(0, 50).map((r) => ({
      resultId: r.id,
      orderId: r.orderId,
      orderNumber: r.order.orderNumber,
      patientName: `${r.order.patient.firstName} ${r.order.patient.lastName}`,
      testNames: r.order.clinicalItems.map((ci) => ci.itemName),
      status: r.status,
      orderCreatedAt: r.order.createdAt.toISOString(),
      specimenReceivedAt:
        r.order.labSpecimen?.receivedAt?.toISOString() || null,
      encodedAt: r.encodedAt?.toISOString() || null,
      validatedAt: r.validatedAt?.toISOString() || null,
      releasedAt: r.releasedAt?.toISOString() || null,
      specimenToReleaseMinutes:
        r.status === 'RELEASED'
          ? minutesDiff(r.releasedAt, r.order.labSpecimen?.receivedAt)
          : null,
      orderToReleaseMinutes:
        r.status === 'RELEASED'
          ? minutesDiff(r.releasedAt, r.order.createdAt)
          : null,
    }));

    return {
      totalResults: results.length,
      releasedCount: releasedResults.length,
      pendingCount: results.length - releasedResults.length,
      metrics: [
        computeMetric(
          'Specimen to Release',
          'specimenToRelease',
          specimenToRelease,
        ),
        computeMetric('Order to Release', 'orderToRelease', orderToRelease),
        computeMetric('Receipt to Encode', 'receiptToEncode', receiptToEncode),
        computeMetric(
          'Encode to Validate',
          'encodeToValidate',
          encodeToValidate,
        ),
        computeMetric(
          'Validate to Release',
          'validateToRelease',
          validateToRelease,
        ),
      ],
      detailRows,
    };
  }
}
