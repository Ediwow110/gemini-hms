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

  async approvePurchaseRequest(user: RequestUser, requestId: string) {
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: { id: requestId, tenantId: user.tenantId },
    });

    if (!pr) {
      throw new NotFoundException('Purchase request not found');
    }

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
    if (
      !user.roles?.includes('Super Admin') &&
      user.branchId !== dto.branchId
    ) {
      throw new ForbiddenException(
        'Cannot create purchase order for a different branch',
      );
    }

    // Validate PR existence and branch scope outside transaction (fast-fail)
    const pr = await this.prisma.purchaseRequest.findFirst({
      where: {
        id: dto.purchaseRequestId,
        tenantId: user.tenantId,
        branchId: dto.branchId,
      },
    });

    if (!pr) {
      throw new NotFoundException('Purchase request not found in this branch');
    }

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, tenantId: user.tenantId },
    });

    if (!supplier || supplier.status !== 'ACTIVE') {
      throw new BadRequestException('Invalid or inactive supplier');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Atomically claim the PR: only succeeds if still APPROVED (prevents duplicate POs)
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

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (!user.roles?.includes('Super Admin') && user.branchId !== po.branchId) {
      throw new ForbiddenException(
        'Cannot receive purchase order for a different branch',
      );
    }

    if (po.status === 'RECEIVED') {
      throw new BadRequestException('Purchase order is already received');
    }

    if (po.status !== 'SENT') {
      throw new BadRequestException(
        'Only SENT purchase orders can be received',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // Atomically claim the PO: only succeeds if still SENT (prevents duplicate receives)
      const claimedPo = await tx.purchaseOrder.updateMany({
        where: { id: purchaseOrderId, status: 'SENT' },
        data: { status: 'RECEIVED' },
      });

      if (claimedPo.count === 0) {
        throw new BadRequestException('Purchase order is already received');
      }

      const receiving = await tx.receivingRecord.create({
        data: {
          tenantId: user.tenantId,
          branchId: po.branchId,
          purchaseOrderId,
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
}
