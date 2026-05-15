import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInventoryItemDto,
  ReceiveStockDto,
  UpdateInventoryItemDto,
  InventoryStatus,
} from './dto/inventory.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createItem(
    tenantId: string,
    branchId: string,
    userId: string,
    dto: CreateInventoryItemDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          tenantId,
          ...dto,
        },
      });

      // Initialize stock at 0 for this branch
      await tx.branchStock.create({
        data: {
          tenantId,
          branchId,
          inventoryItemId: item.id,
          quantity: 0,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'INVENTORY_ITEM_CREATED',
          recordType: 'InventoryItem',
          recordId: item.id,
          newValues: item,
        },
        tx,
        branchId,
      );

      return item;
    });
  }

  async updateItem(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateInventoryItemDto,
  ) {
    const existing = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryItem.update({
        where: { id },
        data: dto,
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'INVENTORY_ITEM_UPDATED',
          recordType: 'InventoryItem',
          recordId: id,
          oldValues: existing,
          newValues: updated,
        },
        tx,
      );

      return updated;
    });
  }

  async deactivateItem(tenantId: string, userId: string, id: string) {
    const existing = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }

    if (existing.status === (InventoryStatus.INACTIVE as string)) {
      return existing;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryItem.update({
        where: { id },
        data: { status: InventoryStatus.INACTIVE },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'INVENTORY_ITEM_DEACTIVATED',
          recordType: 'InventoryItem',
          recordId: id,
          oldValues: existing,
          newValues: updated,
        },
        tx,
      );

      return updated;
    });
  }

  async receiveStock(
    tenantId: string,
    branchId: string,
    userId: string,
    id: string,
    dto: ReceiveStockDto,
  ) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const stock = await this.prisma.branchStock.upsert({
      where: {
        tenantId_branchId_inventoryItemId: {
          tenantId,
          branchId,
          inventoryItemId: id,
        },
      },
      update: {},
      create: {
        tenantId,
        branchId,
        inventoryItemId: id,
        quantity: 0,
      },
    });

    // Atomic Stock Transaction
    return this.prisma.$transaction(async (tx) => {
      const previousStock = stock.quantity;
      const newStock = previousStock + dto.quantity;

      const stockUpdate = await tx.branchStock.updateMany({
        where: { id: stock.id, tenantId, branchId },
        data: { quantity: newStock },
      });

      if (stockUpdate.count === 0) {
        throw new NotFoundException('Stock not found for this branch');
      }

      const updatedStock = await tx.branchStock.findFirst({
        where: { id: stock.id, tenantId, branchId },
      });

      if (!updatedStock) {
        throw new NotFoundException('Stock not found for this branch');
      }

      // 2. Insert Stock Log (Traceability)
      const log = await tx.stockLog.create({
        data: {
          tenantId,
          branchId,
          inventoryItemId: id,
          type: 'IN',
          quantity: dto.quantity,
          previousStock,
          newStock,
          remarks:
            dto.remarks ||
            `Stock received from ${dto.supplierName || 'unknown'}`,
        },
      });

      // 3. Log System Audit
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'STOCK_RECEIVED',
          recordType: 'InventoryItem',
          recordId: id,
          newValues: { log, updatedStock },
        },
        tx,
        branchId,
      );

      return updatedStock;
    });
  }

  async getCatalog(
    tenantId: string,
    branchId: string,
    status: InventoryStatus = InventoryStatus.ACTIVE,
  ) {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        status: status,
      },
      include: {
        branchStocks: {
          where: { branchId },
        },
      },
      orderBy: { name: 'asc' },
    });

    return items.map((item) => ({
      ...item,
      stock: item.branchStocks[0]?.quantity || 0,
      reorderLevel: item.branchStocks[0]?.reorderLevel || item.reorderLevel,
      branchStocks: undefined,
    }));
  }

  async getStockLogs(tenantId: string, branchId: string, itemId: string) {
    return this.prisma.stockLog.findMany({
      where: { tenantId, branchId, inventoryItemId: itemId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async dispenseItem(
    tenantId: string,
    branchId: string,
    userId: string,
    id: string,
    quantity: number,
    orderId?: string,
  ) {
    const stock = await this.prisma.branchStock.findUnique({
      where: {
        tenantId_branchId_inventoryItemId: {
          tenantId,
          branchId,
          inventoryItemId: id,
        },
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found for this branch');
    }

    // Guardrail (Section 15): Insufficient stock
    if (stock.quantity < quantity) {
      throw new BadRequestException(
        `insufficient_stock: Only ${stock.quantity} available`,
      );
    }

    // Atomic Stock Transaction
    return this.prisma.$transaction(async (tx) => {
      const previousStock = stock.quantity;
      const newStock = previousStock - quantity;

      const stockUpdate = await tx.branchStock.updateMany({
        where: { id: stock.id, tenantId, branchId },
        data: { quantity: newStock },
      });

      if (stockUpdate.count === 0) {
        throw new NotFoundException('Stock not found for this branch');
      }

      const updatedStock = await tx.branchStock.findFirst({
        where: { id: stock.id, tenantId, branchId },
      });

      if (!updatedStock) {
        throw new NotFoundException('Stock not found for this branch');
      }

      // 2. Insert Stock Log (Traceability)
      const log = await tx.stockLog.create({
        data: {
          tenantId,
          branchId,
          inventoryItemId: id,
          type: 'OUT',
          quantity: quantity,
          previousStock,
          newStock,
          referenceType: 'DISPENSING',
          referenceId: orderId,
          remarks: `Dispensed ${quantity} for order ${orderId || 'N/A'}`,
        },
      });

      // 3. Trigger Low-Stock Notification if crossing threshold
      if (
        newStock <= updatedStock.reorderLevel &&
        previousStock > updatedStock.reorderLevel
      ) {
        const item = await tx.inventoryItem.findUnique({ where: { id } });
        const existingAlert = await tx.notification.findFirst({
          where: {
            tenantId,
            status: 'PENDING',
            content: { contains: `(SKU: ${item?.sku})` },
          },
        });

        if (!existingAlert) {
          await tx.notification.create({
            data: {
              tenantId,
              type: 'IN_APP',
              recipient: 'ROLE:Pharmacist',
              subject: 'LOW STOCK ALERT: ' + item?.name,
              content: `Item ${item?.name} (SKU: ${item?.sku}) has fallen to ${newStock}. Reorder level is ${updatedStock.reorderLevel}.`,
              status: 'PENDING',
            },
          });
        }
      }

      // 4. Log System Audit
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'STOCK_DISPENSED',
          recordType: 'InventoryItem',
          recordId: id,
          newValues: { log, updatedStock },
        },
        tx,
        branchId,
      );

      return updatedStock;
    });
  }

  async getLowStockAlerts(tenantId: string, branchId: string) {
    return this.prisma.branchStock.findMany({
      where: {
        tenantId,
        branchId,
        quantity: { lte: this.prisma.branchStock.fields.reorderLevel },
      },
      include: { inventoryItem: true },
      orderBy: { quantity: 'asc' },
    });
  }
}
