import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/types/authenticated-request.type';
import type { RadiologyOrderDto } from './dto/radiology-order.dto';

@Injectable()
export class RadiologyService {
  constructor(private readonly prisma: PrismaService) {}

  private isSuperAdmin(actor: RequestUser): boolean {
    return (actor.roles ?? []).includes('Super Admin');
  }

  /**
   * Lists imaging orders from live clinical orders (orderType = IMAGING).
   * Upload/finalize/report persistence is not modeled — phase stays PENDING.
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
      },
      orderBy: [{ requestedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    return orders.map((order) => this.toRadiologyOrderDto(order));
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
      procedureFromItems ||
      order.clinicalIndication?.trim() ||
      'Imaging study';

    const priority: RadiologyOrderDto['priority'] =
      order.priority === 'STAT' ? 'STAT' : 'ROUTINE';

    const requestedAt = (
      order.requestedAt ?? order.createdAt
    ).toISOString();

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      patientName: patientName || '(unnamed patient)',
      procedure,
      priority,
      phase: 'PENDING',
      requestedAt,
    };
  }
}