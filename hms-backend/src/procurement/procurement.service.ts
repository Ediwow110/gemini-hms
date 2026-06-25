import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import {
  CreateSupplierDto,
  CreatePurchaseRequestDto,
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  CreateRFQDto,
} from './dto/procurement.dto';
import type { RequestUser } from '../common/types/authenticated-request.type';

@Injectable()
export class ProcurementService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private numbering: NumberingService,
  ) {}

  async createSupplier(user: RequestUser, dto: CreateSupplierDto) {
    const supplier = await this.prisma.supplier.create({
      data: {
        tenantId: user.tenantId,
        name: dto.name,
        contactName: dto.contactName || null,
        contactEmail: dto.contactEmail || null,
        contactPhone: dto.contactPhone || null,
        address: dto.address || null,
        status: 'ACTIVE',
      },
    });

    await this.audit.log({
      tenantId: user.tenantId,
      userId: user.userId!,
      eventKey: 'SUPPLIER_CREATED',
      recordType: 'Supplier',
      recordId: supplier.id,
      newValues: supplier,
    });

    return supplier;
  }

  async listSuppliers(
    user: RequestUser,
    filters: { search?: string; status?: string } = {},
  ) {
    const where: Record<string, unknown> = { tenantId: user.tenantId };

    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }

    return this.prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async createPurchaseRequest(
    user: RequestUser,
    dto: CreatePurchaseRequestDto,
  ) {
    if (
      !user.roles?.includes('Super Admin') &&
      user.branchId !== dto.branchId
    ) {
      throw new ForbiddenException(
        'Cannot create purchase request for a different branch',
      );
    }

    const pr = await this.prisma.purchaseRequest.create({
      data: {
        tenantId: user.tenantId,
        branchId: dto.branchId,
        requestedById: user.userId!,
        items: dto.items as any,
        status: 'SUBMITTED',
        reason: dto.reason || null,
      },
    });

    await this.audit.log(
      {
        tenantId: user.tenantId,
        userId: user.userId!,
        eventKey: 'PURCHASE_REQUEST_CREATED',
        recordType: 'PurchaseRequest',
        recordId: pr.id,
        newValues: pr,
      },
      undefined,
      dto.branchId,
    );

    return pr;
  }

  async listPurchaseRequests(
    user: RequestUser,
    filters: { status?: string; branchId?: string } = {},
  ) {
    const where: Record<string, unknown> = { tenantId: user.tenantId };
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (filters.branchId) {
      if (!isSuperAdmin && user.branchId !== filters.branchId) {
        throw new ForbiddenException(
          'Cannot view purchase requests for a different branch',
        );
      }
      where.branchId = filters.branchId;
    } else if (!isSuperAdmin && user.branchId) {
      where.branchId = user.branchId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return this.prisma.purchaseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPurchaseOrders(
    user: RequestUser,
    filters: { status?: string; branchId?: string } = {},
  ) {
    const where: Record<string, unknown> = { tenantId: user.tenantId };
    const isSuperAdmin = user.roles?.includes('Super Admin');

    if (filters.branchId) {
      if (!isSuperAdmin && user.branchId !== filters.branchId) {
        throw new ForbiddenException(
          'Cannot view purchase orders for a different branch',
        );
      }
      where.branchId = filters.branchId;
    } else if (!isSuperAdmin && user.branchId) {
      where.branchId = user.branchId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
          },
        },
        purchaseRequest: {
          select: {
            id: true,
            status: true,
            reason: true,
            items: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approvePurchaseRequest(user: RequestUser, requestId: string) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id: requestId, tenantId: user.tenantId },
    });

    if (!pr) throw new NotFoundException('Purchase request not found');

    if (!user.roles?.includes('Super Admin') && user.branchId !== pr.branchId) {
      throw new ForbiddenException(
        'Cannot approve purchase request for a different branch',
      );
    }

    if (pr.requestedById === user.userId) {
      throw new ForbiddenException('Cannot self-approve purchase request');
    }

    if (pr.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Can only approve SUBMITTED purchase requests',
      );
    }

    const updated = await this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedById: user.userId,
      },
    });

    await this.audit.log(
      {
        tenantId: user.tenantId,
        userId: user.userId!,
        eventKey: 'PURCHASE_REQUEST_APPROVED',
        recordType: 'PurchaseRequest',
        recordId: requestId,
        newValues: updated,
      },
      undefined,
      pr.branchId,
    );

    return updated;
  }

  async createPurchaseOrder(user: RequestUser, dto: CreatePurchaseOrderDto) {
    if (!user.roles?.includes('Super Admin') && user.branchId !== dto.branchId) {
      throw new ForbiddenException(
        'Cannot create purchase order for a different branch',
      );
    }

    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id: dto.purchaseRequestId, tenantId: user.tenantId, branchId: dto.branchId },
    });

    if (!pr) throw new NotFoundException('Purchase request not found in this branch');

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, tenantId: user.tenantId },
    });

    if (!supplier || supplier.status !== 'ACTIVE') {
      throw new BadRequestException('Invalid or inactive supplier');
    }

    return await this.prisma.$transaction(async (tx) => {
      const claimedPr = await tx.purchaseRequest.updateMany({
        where: { id: dto.purchaseRequestId, status: 'APPROVED' },
        data: { status: 'ORDERED' },
      });

      if (claimedPr.count === 0) {
        throw new BadRequestException(
          'Purchase request is no longer APPROVED — may already have a Purchase Order',
        );
      }

      const orderNumber = await this.numbering.generateNumber(
        user.tenantId,
        'PURCHASE_ORDER',
        dto.branchId,
        tx,
      );

      const po = await tx.purchaseOrder.create({
        data: {
          tenantId: user.tenantId,
          branchId: dto.branchId,
          supplierId: dto.supplierId,
          purchaseRequestId: dto.purchaseRequestId,
          orderNumber,
          status: 'SENT',
        },
      });

      await this.audit.log(
        {
          tenantId: user.tenantId,
          userId: user.userId!,
          eventKey: 'PURCHASE_ORDER_CREATED',
          recordType: 'PurchaseOrder',
          recordId: po.id,
          newValues: po,
        },
        tx,
        dto.branchId,
      );

      return po;
    });
  }

  async receivePurchaseOrder(
    user: RequestUser,
    purchaseOrderId: string,
    dto: ReceivePurchaseOrderDto,
  ) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, tenantId: user.tenantId },
    });

    if (!po) throw new NotFoundException('Purchase order not found');

    if (!user.roles?.includes('Super Admin') && user.branchId !== po.branchId) {
      throw new ForbiddenException(
        'Cannot receive purchase order for a different branch',
      );
    }

    if (po.status === 'RECEIVED') throw new BadRequestException('Purchase order is already received');
    if (po.status !== 'SENT') throw new BadRequestException('Only SENT purchase orders can be received');

    return await this.prisma.$transaction(async (tx) => {
      const claimedPo = await tx.purchaseOrder.updateMany({
        where: { id: purchaseOrderId, status: 'SENT' },
        data: { status: 'RECEIVED' },
      });

      if (claimedPo.count === 0) throw new BadRequestException('Purchase order is already received');

      const receiving = await tx.receivingRecord.create({
        data: {
          tenantId: user.tenantId,
          branchId: po.branchId,
          purchaseOrderId,
          supplierId: po.supplierId,
          receivedById: user.userId!,
          notes: dto.notes || null,
        },
      });

      await this.audit.log(
        {
          tenantId: user.tenantId,
          userId: user.userId!,
          eventKey: 'PURCHASE_ORDER_RECEIVED',
          recordType: 'PurchaseOrder',
          recordId: purchaseOrderId,
          newValues: { status: 'RECEIVED' },
        },
        tx,
        po.branchId,
      );

      return receiving;
    });
  }

  async createRFQ(user: RequestUser, dto: CreateRFQDto) {
    const rfq = await this.prisma.rFQ.create({
      data: {
        tenantId: user.tenantId,
        branchId: user.branchId || 'SYSTEM',
        itemId: dto.itemId,
        buyerId: user.userId!,
        title: dto.title || 'New RFQ',
        warrantyTier: dto.warrantyTier,
        siteReadinessDetails: dto.siteReadinessDetails,
        leasingOption: dto.leasingOption,
        status: 'NEGOTIATION',
      },
    });

    await this.audit.log({
      tenantId: user.tenantId,
      userId: user.userId!,
      eventKey: 'RFQ_CREATED',
      recordType: 'RFQ',
      recordId: rfq.id,
      newValues: rfq,
    });

    return rfq;
  }

  async listRFQs(user: RequestUser, filters: { status?: string } = {}) {
    const where: Record<string, unknown> = { tenantId: user.tenantId };
    if (filters.status) where.status = filters.status;

    return this.prisma.rFQ.findMany({
      where,
      include: { quotes: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitQuote(user: RequestUser, rfqId: string, dto: any) {
    const rfq = await this.prisma.rFQ.findFirst({
      where: { id: rfqId, tenantId: user.tenantId },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');

    return this.prisma.quote.create({
      data: {
        tenantId: user.tenantId,
        rfqId: rfqId,
        supplierId: user.supplierId || 'TBD',
        amount: dto.amount,
        totalAmount: dto.amount,
        deliveryDays: dto.deliveryDays,
        warrantyMonths: dto.warrantyMonths,
        status: 'SENT',
      },
    });
  }

  async listQuotes(user: RequestUser, rfqId: string) {
    return this.prisma.quote.findMany({
      where: { rfqId, tenantId: user.tenantId },
      orderBy: { amount: 'asc' },
    });
  }

  async listReceivingRecords(
    user: RequestUser,
    filters: { status?: string; branchId?: string } = {},
  ) {
    const where: Record<string, unknown> = { tenantId: user.tenantId };
    if (filters.branchId) where.branchId = filters.branchId;

    return this.prisma.receivingRecord.findMany({
      where,
      include: {
        purchaseOrder: {
          include: { supplier: true },
        },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async getVendorPerformance(user: RequestUser) {
    const suppliers = await this.prisma.supplier.findMany({
      where: { tenantId: user.tenantId },
    });

    const performance = await Promise.all(
      suppliers.map(async (s) => {
        const records = await this.prisma.receivingRecord.findMany({
          where: { supplierId: s.id },
          include: { purchaseOrder: true },
        });

        if (records.length === 0) {
          return {
            id: s.id,
            supplier: s.name,
            onTimeRate: 0,
            qualityRate: 0,
            responseTime: 'N/A',
            riskScore: 'UNKNOWN',
          };
        }

        const onTimeCount = records.filter(
          (r) =>
            r.purchaseOrder?.expectedDeliveryDate &&
            r.receivedAt <= r.purchaseOrder.expectedDeliveryDate,
        ).length;

        const avgQuality =
          records.reduce((acc, r) => acc + (Number((r as any).qualityScore) || 0), 0) /
          records.length;

        const onTimeRate = (onTimeCount / records.length) * 100;
        const riskScore = onTimeRate < 70 || avgQuality < 0.7 ? 'HIGH' : 'LOW';

        return {
          id: s.id,
          supplier: s.name,
          onTimeRate: Math.round(onTimeRate),
          qualityRate: Math.round(avgQuality * 100),
          responseTime: '4h',
          riskScore,
        };
      }),
    );

    return performance;
  }
}
