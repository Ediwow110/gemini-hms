import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInventoryItemDto,
  ReceiveStockDto,
  UpdateInventoryItemDto,
  AdjustStockDto,
  InventoryStatus,
} from './dto/inventory.dto';
import { AuditService } from '../audit/audit.service';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  clampTake,
} from '../common/utils/pagination';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private assertPositiveQuantity(quantity: number) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException(
        'validation_error: quantity_must_be_a_positive_number',
      );
    }
  }

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

    // Atomic Stock Transaction with Optimistic Locking
    return this.prisma.$transaction(async (tx) => {
      const previousStock = stock.quantity;
      const newStock = previousStock + dto.quantity;

      const stockUpdate = await tx.branchStock.updateMany({
        where: { id: stock.id, tenantId, branchId, version: stock.version },
        data: { quantity: newStock, version: { increment: 1 } },
      });

      if (stockUpdate.count === 0) {
        const current = await tx.branchStock.findUnique({
          where: { id: stock.id },
        });
        if (!current) {
          throw new NotFoundException('Stock not found for this branch');
        }
        throw new ConflictException(
          'version_conflict: Stock was modified by another transaction',
        );
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
      take: MAX_PAGE_SIZE,
    });

    return items.map((item) => ({
      ...item,
      stock: item.branchStocks[0]?.quantity || 0,
      reorderLevel: item.branchStocks[0]?.reorderLevel || item.reorderLevel,
      branchStocks: undefined,
    }));
  }

  async getStockLogs(
    tenantId: string,
    branchId: string,
    itemId: string,
    pageSize?: number,
  ) {
    const take = clampTake(pageSize, MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    return this.prisma.stockLog.findMany({
      where: { tenantId, branchId, inventoryItemId: itemId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async dispenseItem(
    tenantId: string,
    branchId: string,
    userId: string,
    id: string,
    quantity: number,
    orderId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    this.assertPositiveQuantity(quantity);

    const db = tx || this.prisma;

    const item = await db.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    if (item.status === 'INACTIVE') {
      throw new BadRequestException('Cannot dispense an inactive item');
    }

    const stock = await db.branchStock.findUnique({
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

    if (stock.quantity < quantity) {
      throw new BadRequestException(
        `insufficient_stock: Only ${stock.quantity} available`,
      );
    }

    const applyDispense = async (activeTx: Prisma.TransactionClient) => {
      const previousStock = stock.quantity;
      const newStock = previousStock - quantity;

      const stockUpdate = await activeTx.branchStock.updateMany({
        where: { id: stock.id, tenantId, branchId, version: stock.version },
        data: { quantity: newStock, version: { increment: 1 } },
      });

      if (stockUpdate.count === 0) {
        const current = await activeTx.branchStock.findUnique({
          where: { id: stock.id },
        });
        if (!current) {
          throw new NotFoundException('Stock not found for this branch');
        }
        throw new ConflictException(
          'version_conflict: Stock was modified by another transaction',
        );
      }

      const updatedStock = await activeTx.branchStock.findFirst({
        where: { id: stock.id, tenantId, branchId },
      });

      if (!updatedStock) {
        throw new NotFoundException('Stock not found for this branch');
      }

      const log = await activeTx.stockLog.create({
        data: {
          tenantId,
          branchId,
          inventoryItemId: id,
          type: 'OUT',
          quantity,
          previousStock,
          newStock,
          referenceType: 'DISPENSING',
          referenceId: orderId,
          remarks: `Dispensed ${quantity} for order ${orderId || 'N/A'}`,
        },
      });

      if (
        newStock <= updatedStock.reorderLevel &&
        previousStock > updatedStock.reorderLevel
      ) {
        const item = await activeTx.inventoryItem.findUnique({ where: { id } });
        const existingAlert = await activeTx.notification.findFirst({
          where: {
            tenantId,
            status: 'PENDING',
            content: { contains: `(SKU: ${item?.sku}) in Branch ${branchId}` },
          },
        });

        if (!existingAlert) {
          await activeTx.notification.create({
            data: {
              tenantId,
              type: 'IN_APP',
              recipient: 'ROLE:Pharmacist',
              subject: 'LOW STOCK ALERT: ' + item?.name,
              content: `Item ${item?.name} (SKU: ${item?.sku}) in Branch ${branchId} has fallen to ${newStock}. Reorder level is ${updatedStock.reorderLevel}.`,
              status: 'PENDING',
            },
          });
        }
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'STOCK_DISPENSED',
          recordType: 'InventoryItem',
          recordId: id,
          newValues: { log, updatedStock },
        },
        activeTx,
        branchId,
      );

      return updatedStock;
    };

    if (tx) {
      return applyDispense(tx);
    }

    return this.prisma.$transaction(applyDispense);
  }

  async getLowStockAlerts(tenantId: string, branchId: string) {
    const branchStocks = await this.prisma.branchStock.findMany({
      where: { tenantId, branchId },
      include: { inventoryItem: true },
      orderBy: { quantity: 'asc' },
    });
    return branchStocks.filter((bs) => bs.quantity <= bs.reorderLevel);
  }

  async adjustStock(
    tenantId: string,
    branchId: string,
    userId: string,
    id: string,
    dto: AdjustStockDto,
  ) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException(
        'validation_error: adjustment_reason_is_required',
      );
    }

    const stock = await this.prisma.branchStock.findFirst({
      where: { inventoryItemId: id, tenantId, branchId },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found for this item and branch');
    }

    return this.prisma.$transaction(async (tx) => {
      const previousStock = stock.quantity;
      const newStock = dto.newQuantity;

      const stockUpdate = await tx.branchStock.updateMany({
        where: { id: stock.id, tenantId, branchId, version: stock.version },
        data: { quantity: newStock, version: { increment: 1 } },
      });

      if (stockUpdate.count === 0) {
        const current = await tx.branchStock.findUnique({
          where: { id: stock.id },
        });
        if (!current) {
          throw new NotFoundException('Stock not found');
        }
        throw new ConflictException(
          'version_conflict: Stock was modified by another transaction',
        );
      }

      // Create stock log for the adjustment
      await tx.stockLog.create({
        data: {
          tenantId,
          branchId,
          inventoryItemId: id,
          type: 'ADJUSTMENT',
          quantity: newStock - previousStock,
          previousStock,
          newStock,
          referenceType: 'ADJUSTMENT',
          remarks: dto.reason,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'STOCK_ADJUSTED',
          recordType: 'BranchStock',
          recordId: stock.id,
          oldValues: { quantity: previousStock },
          newValues: { quantity: newStock, reason: dto.reason },
        },
        tx,
        branchId,
      );

      return tx.branchStock.findFirst({
        where: { id: stock.id },
        include: { inventoryItem: true },
      });
    });
  }
}
