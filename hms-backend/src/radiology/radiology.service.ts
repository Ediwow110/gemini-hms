import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AUDIT_EVENT_KEYS } from '../audit/audit-event-keys';
import type { RequestUser } from '../common/types/authenticated-request.type';
import type {
  RadiologyOrderDto,
  RadiologyReportFinalizeResponseDto,
} from './dto/radiology-order.dto';
import type { FinalizeRadiologyReportDto } from './dto/finalize-radiology-report.dto';

@Injectable()
export class RadiologyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private isSuperAdmin(actor: RequestUser): boolean {
    return (actor.roles ?? []).includes('Super Admin');
  }

  private buildOrderScope(actor: RequestUser, orderId: string) {
    const where: Record<string, unknown> = {
      id: orderId,
      tenantId: actor.tenantId,
      orderType: 'IMAGING',
      deletedAt: null,
      status: { notIn: ['CANCELLED'] },
    };

    if (!this.isSuperAdmin(actor) && actor.branchId) {
      where.branchId = actor.branchId;
    }

    return where;
  }

  /**
   * Lists imaging orders from live clinical orders (orderType = IMAGING).
   * Phase is FINALIZED when a persisted radiology report exists; otherwise PENDING.
   * Binary study upload is not modeled — file attachments remain unavailable.
   */
  async listImagingOrders(actor: RequestUser): Promise<RadiologyOrderDto[]> {
    const where: Record<string, unknown> = {
      tenantId: actor.tenantId,
      orderType: 'IMAGING',
      deletedAt: null,
      status: { notIn: ['CANCELLED'] },
    };

    if (!this.isSuperAdmin(actor) && actor.branchId) {
      where.branchId = actor.branchId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        patient: { select: { firstName: true, lastName: true } },
        clinicalItems: { select: { itemName: true } },
        radiologyReport: {
          select: {
            interpretation: true,
            status: true,
            finalizedAt: true,
          },
        },
      },
      orderBy: [{ requestedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    return orders.map((order) => this.toRadiologyOrderDto(order));
  }

  async finalizeReport(
    actor: RequestUser,
    orderId: string,
    dto: FinalizeRadiologyReportDto,
  ): Promise<RadiologyReportFinalizeResponseDto> {
    const actorUserId = actor.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user context is required');
    }

    const order = await this.prisma.order.findFirst({
      where: this.buildOrderScope(actor, orderId),
      include: { radiologyReport: { select: { id: true } } },
    });

    if (!order) {
      throw new NotFoundException('Imaging order not found');
    }

    if (order.radiologyReport) {
      throw new ConflictException(
        'Radiology report already finalized for this order',
      );
    }

    const interpretation = dto.interpretation.trim();
    const finalizedAt = new Date();

    const report = await this.prisma.$transaction(async (tx) => {
      const created = await tx.radiologyReport.create({
        data: {
          tenantId: actor.tenantId,
          orderId: order.id,
          interpretation,
          status: 'FINALIZED',
          finalizedById: actorUserId,
          finalizedAt,
        },
      });

      await this.audit.log(
        {
          tenantId: actor.tenantId,
          userId: actorUserId,
          eventKey: AUDIT_EVENT_KEYS.RADIOLOGY_REPORT_FINALIZED,
          recordType: 'RadiologyReport',
          recordId: created.id,
          newValues: {
            orderId: order.id,
            status: 'FINALIZED',
            finalizedAt: created.finalizedAt,
          },
        },
        tx,
        order.branchId,
      );

      return created;
    });

    return {
      id: report.id,
      orderId: report.orderId,
      interpretation: report.interpretation,
      status: report.status,
      finalizedAt: report.finalizedAt.toISOString(),
    };
  }

  private toRadiologyOrderDto(order: {
    id: string;
    orderNumber: string;
    priority: string | null;
    requestedAt: Date | null;
    createdAt: Date;
    clinicalIndication: string | null;
    patient: { firstName: string; lastName: string };
    clinicalItems: { itemName: string }[];
    radiologyReport: {
      interpretation: string;
      status: string;
      finalizedAt: Date;
    } | null;
  }): RadiologyOrderDto {
    const patientName = [order.patient.firstName, order.patient.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const procedureFromItems = order.clinicalItems
      .map((item) => item.itemName)
      .filter(Boolean)
      .join(', ');

    const procedure =
      procedureFromItems || order.clinicalIndication?.trim() || 'Imaging study';

    const priority: RadiologyOrderDto['priority'] =
      order.priority === 'STAT' ? 'STAT' : 'ROUTINE';

    const requestedAt = (order.requestedAt ?? order.createdAt).toISOString();

    const isFinalized = order.radiologyReport?.status === 'FINALIZED';

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      patientName: patientName || '(unnamed patient)',
      procedure,
      priority,
      phase: isFinalized ? 'FINALIZED' : 'PENDING',
      requestedAt,
      ...(isFinalized && order.radiologyReport
        ? {
            interpretation: order.radiologyReport.interpretation,
            finalizedAt: order.radiologyReport.finalizedAt.toISOString(),
          }
        : {}),
    };
  }
}
