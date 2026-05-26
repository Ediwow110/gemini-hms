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

  // ──── Phase 4D: Specimen Receiving ────

  async getPendingSpecimens(tenantId: string, branchId: string) {
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
            patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
            clinicalItems: { select: { itemName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
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
            patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
            clinicalItems: { select: { itemName: true } },
          },
        },
      },
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
      let specimen = await tx.labSpecimen.findFirst({
        where: {
          OR: [
            { id: specimenIdOrOrderId },
            { orderId: specimenIdOrOrderId },
          ],
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

  async getReleasableResults(tenantId: string, branchId: string) {
    const results = await this.prisma.labResult.findMany({
      where: {
        order: { tenantId, branchId },
        status: 'APPROVED',
      },
      include: {
        order: {
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
            clinicalItems: { select: { itemName: true } },
          },
        },
      },
      orderBy: { validatedAt: 'asc' },
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
  ) {
    const whereClause: any = {
      isCritical: true,
      order: { tenantId, branchId },
    };

    if (status && ['OPEN', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED'].includes(status)) {
      whereClause.criticalStatus = status;
    }

    const results = await this.prisma.labResult.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true } },
            clinicalItems: { select: { itemName: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
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
  ) {
    const result = await this.findOne(tenantId, branchId, resultId);

    if (result.status !== 'APPROVED' && result.status !== 'RELEASED') {
      throw new BadRequestException(
        'Only APPROVED or RELEASED results can be marked as critical',
      );
    }

    const updated = await this.prisma.labResult.updateMany({
      where: { id: resultId, order: { tenantId, branchId } },
      data: {
        isCritical: true,
        criticalStatus: 'OPEN',
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Lab result not found');
    }

    // Create notification outbox entry for critical result
    await this.prisma.notificationOutbox.create({
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
        newValues: { isCritical: true, criticalStatus: 'OPEN', reason: reason || null },
      },
      undefined,
      branchId,
    );

    return this.getCriticalResults(tenantId, branchId);
  }

  async acknowledgeCriticalResult(
    tenantId: string,
    userId: string,
    branchId: string,
    resultId: string,
    notes?: string,
  ) {
    const result = await this.findOne(tenantId, branchId, resultId);

    if (!result.isCritical) {
      throw new BadRequestException('Result is not marked as critical');
    }

    if (result.criticalStatus === 'RESOLVED') {
      throw new ConflictException('Critical result is already resolved');
    }

    const updated = await this.prisma.labResult.updateMany({
      where: { id: resultId, order: { tenantId, branchId } },
      data: {
        criticalStatus: 'ACKNOWLEDGED',
        criticalAcknowledgedAt: new Date(),
        criticalAcknowledgedById: userId,
        criticalEscalationNotes: notes || null,
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Lab result not found');
    }

    await this.audit.log(
      {
        tenantId,
        userId,
        eventKey: 'CRITICAL_RESULT_ACKNOWLEDGED',
        recordType: 'LabResult',
        recordId: resultId,
        oldValues: { criticalStatus: result.criticalStatus },
        newValues: { criticalStatus: 'ACKNOWLEDGED', acknowledgedAt: new Date().toISOString() },
      },
      undefined,
      branchId,
    );

    return this.getCriticalResults(tenantId, branchId);
  }

  async escalateCriticalResult(
    tenantId: string,
    userId: string,
    branchId: string,
    resultId: string,
    notes: string,
  ) {
    const result = await this.findOne(tenantId, branchId, resultId);

    if (!result.isCritical) {
      throw new BadRequestException('Result is not marked as critical');
    }

    if (result.criticalStatus === 'RESOLVED') {
      throw new ConflictException('Critical result is already resolved');
    }

    const updated = await this.prisma.labResult.updateMany({
      where: { id: resultId, order: { tenantId, branchId } },
      data: {
        criticalStatus: 'ESCALATED',
        criticalEscalatedAt: new Date(),
        criticalEscalatedById: userId,
        criticalEscalationNotes: notes,
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Lab result not found');
    }

    await this.audit.log(
      {
        tenantId,
        userId,
        eventKey: 'CRITICAL_RESULT_ESCALATED',
        recordType: 'LabResult',
        recordId: resultId,
        oldValues: { criticalStatus: result.criticalStatus },
        newValues: { criticalStatus: 'ESCALATED', notes },
      },
      undefined,
      branchId,
    );

    return this.getCriticalResults(tenantId, branchId);
  }

  async resolveCriticalResult(
    tenantId: string,
    userId: string,
    branchId: string,
    resultId: string,
    notes?: string,
  ) {
    const result = await this.findOne(tenantId, branchId, resultId);

    if (!result.isCritical) {
      throw new BadRequestException('Result is not marked as critical');
    }

    const updated = await this.prisma.labResult.updateMany({
      where: { id: resultId, order: { tenantId, branchId } },
      data: {
        criticalStatus: 'RESOLVED',
        criticalResolvedAt: new Date(),
        criticalResolvedById: userId,
        criticalResolvedNotes: notes || null,
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Lab result not found');
    }

    await this.audit.log(
      {
        tenantId,
        userId,
        eventKey: 'CRITICAL_RESULT_RESOLVED',
        recordType: 'LabResult',
        recordId: resultId,
        oldValues: { criticalStatus: result.criticalStatus },
        newValues: { criticalStatus: 'RESOLVED' },
      },
      undefined,
      branchId,
    );

    return this.getCriticalResults(tenantId, branchId);
  }
}
