import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateSupplierDto,
  CreatePurchaseRequestDto,
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
} from './dto/procurement.dto';

@Injectable()
export class ProcurementService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createSupplier(tenantId: string, userId: string, dto: CreateSupplierDto) {
    const supplier = await this.prisma.supplier.create({
      data: {
        tenantId,
        name: dto.name,
        contactName: dto.contactName || null,
        contactEmail: dto.contactEmail || null,
        contactPhone: dto.contactPhone || null,
        address: dto.address || null,
        status: 'ACTIVE',
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'SUPPLIER_CREATED',
      recordType: 'Supplier',
      recordId: supplier.id,
      newValues: supplier,
    });

    return supplier;
  }

  async createPurchaseRequest(
    tenantId: string,
    userId: string,
    dto: CreatePurchaseRequestDto,
  ) {
    const pr = await this.prisma.purchaseRequest.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        requestedById: userId,
        items: JSON.parse(JSON.stringify(dto.items)),
        status: 'SUBMITTED',
        reason: dto.reason || null,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'PURCHASE_REQUEST_CREATED',
      recordType: 'PurchaseRequest',
      recordId: pr.id,
      newValues: pr,
    });

    return pr;
  }

  async approvePurchaseRequest(
    tenantId: string,
    userId: string,
    requestId: string,
  ) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id: requestId, tenantId },
    });

    if (!pr) {
      throw new NotFoundException('Purchase request not found');
    }

    if (pr.requestedById === userId) {
      throw new ForbiddenException('Cannot self-approve purchase request');
    }

    const updated = await this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedById: userId,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'PURCHASE_REQUEST_APPROVED',
      recordType: 'PurchaseRequest',
      recordId: requestId,
      newValues: updated,
    });

    return updated;
  }

  async createPurchaseOrder(
    tenantId: string,
    userId: string,
    dto: CreatePurchaseOrderDto,
  ) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id: dto.purchaseRequestId, tenantId },
    });

    if (!pr) {
      throw new NotFoundException('Purchase request not found');
    }

    if (pr.status !== 'APPROVED') {
      throw new BadRequestException(
        'Purchase request must be APPROVED to create a Purchase Order',
      );
    }

    const count = await this.prisma.purchaseOrder.count({ where: { tenantId } });
    const orderNumber = `PO-${(count + 1).toString().padStart(6, '0')}`;

    return await this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          supplierId: dto.supplierId,
          purchaseRequestId: dto.purchaseRequestId,
          orderNumber,
          status: 'SENT',
        },
      });

      await tx.purchaseRequest.update({
        where: { id: dto.purchaseRequestId },
        data: { status: 'ORDERED' },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'PURCHASE_ORDER_CREATED',
          recordType: 'PurchaseOrder',
          recordId: po.id,
          newValues: po,
        },
        tx,
      );

      return po;
    });
  }

  async receivePurchaseOrder(
    tenantId: string,
    userId: string,
    purchaseOrderId: string,
    dto: ReceivePurchaseOrderDto,
  ) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, tenantId },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    return await this.prisma.$transaction(async (tx) => {
      const receiving = await tx.receivingRecord.create({
        data: {
          tenantId,
          branchId: po.branchId,
          purchaseOrderId,
          receivedById: userId,
          notes: dto.notes || null,
        },
      });

      const updatedPo = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: 'RECEIVED' },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'PURCHASE_ORDER_RECEIVED',
          recordType: 'PurchaseOrder',
          recordId: purchaseOrderId,
          newValues: updatedPo,
        },
        tx,
      );

      return receiving;
    });
  }
}
