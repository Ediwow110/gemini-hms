import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryItemDto, ReceiveStockDto } from './dto/inventory.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createItem(
    tenantId: string,
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
      );

      return item;
    });
  }

  async receiveStock(
    tenantId: string,
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

    // Atomic Stock Transaction
    return this.prisma.$transaction(async (tx) => {
      const previousStock = item.currentStock;
      const newStock = previousStock + dto.quantity;

      // 1. Update Inventory Item
      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: { currentStock: newStock },
      });

      // 2. Insert Stock Log (Traceability)
      const log = await tx.stockLog.create({
        data: {
          tenantId,
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
          newValues: { log, updatedItem },
        },
        tx,
      );

      return updatedItem;
    });
  }

  async getCatalog(tenantId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async getStockLogs(tenantId: string, itemId: string) {
    return this.prisma.stockLog.findMany({
      where: { tenantId, inventoryItemId: itemId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async dispenseItem(
    tenantId: string,
    userId: string,
    id: string,
    quantity: number,
    orderId?: string,
  ) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    // Guardrail (Section 15): Insufficient stock
    if (item.currentStock < quantity) {
      throw new BadRequestException(
        `insufficient_stock: Only ${item.currentStock} ${item.unit} available`,
      );
    }

    // Atomic Stock Transaction
    return this.prisma.$transaction(async (tx) => {
      const previousStock = item.currentStock;
      const newStock = previousStock - quantity;

      // 1. Update Inventory Item
      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: { currentStock: newStock },
      });

      // 2. Insert Stock Log (Traceability)
      const log = await tx.stockLog.create({
        data: {
          tenantId,
          inventoryItemId: id,
          type: 'OUT',
          quantity: quantity,
          previousStock,
          newStock,
          referenceType: 'DISPENSING',
          referenceId: orderId,
          remarks: `Dispensed ${quantity} ${item.unit} for order ${orderId || 'N/A'}`,
        },
      });

      // 3. Trigger Low-Stock Notification if crossing threshold
      if (newStock <= item.reorderLevel && previousStock > item.reorderLevel) {
        const existingAlert = await tx.notification.findFirst({
          where: {
            tenantId,
            status: 'PENDING',
            content: { contains: `(SKU: ${item.sku})` }, // Identify specific item
          },
        });

        if (!existingAlert) {
          await tx.notification.create({
            data: {
              tenantId,
              type: 'IN_APP',
              recipient: 'ROLE:Pharmacist', // Role-based routing instead of hardcoded string
              subject: 'LOW STOCK ALERT: ' + item.name,
              content: `Item ${item.name} (SKU: ${item.sku}) has fallen to ${newStock} ${item.unit}. Reorder level is ${item.reorderLevel}.`,
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
          newValues: { log, updatedItem },
        },
        tx,
      );

      return updatedItem;
    });
  }

  async getLowStockAlerts(tenantId: string) {
    // Find all items where current stock is less than or equal to reorder level
    return this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        currentStock: { lte: this.prisma.inventoryItem.fields.reorderLevel }, // Prisma 4.3.0+ feature
      },
      orderBy: { currentStock: 'asc' },
    });
  }
}
