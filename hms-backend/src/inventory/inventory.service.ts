import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateInventoryItemDto,
  ReceiveStockDto,
  AdjustStockDto,
} from './dto/inventory.dto';
import { StockMovementType, Prisma } from '@prisma/client';

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
    // Check if SKU already exists for this tenant
    const existing = await this.prisma.inventoryItem.findUnique({
      where: {
        tenantId_sku: {
          tenantId,
          sku: dto.sku,
        },
      },
    });

    if (existing) {
      throw new ConflictException('SKU already exists for this tenant');
    }

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          tenantId,
          branchId,
          name: dto.name,
          sku: dto.sku,
          unitOfMeasure: dto.unitOfMeasure,
          reorderLevel: dto.reorderLevel || 0,
          totalQuantity: 0,
          price: new Prisma.Decimal(dto.price),
          status: 'ACTIVE',
          createdBy: userId,
          updatedBy: userId,
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

  async receiveStock(
    tenantId: string,
    branchId: string,
    userId: string,
    dto: ReceiveStockDto,
  ) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: dto.inventoryItemId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update or Create the StockBatch quantity
      // Assuming batch_number is unique per item in a branch
      let batch = await tx.stockBatch.findFirst({
        where: {
          tenantId,
          branchId,
          inventoryItemId: dto.inventoryItemId,
          batchNumber: dto.batchNumber,
        },
      });

      if (batch) {
        batch = await tx.stockBatch.update({
          where: { id: batch.id },
          data: {
            quantity: { increment: dto.quantity },
            expiryDate: dto.expiryDate
              ? new Date(dto.expiryDate)
              : batch.expiryDate,
            updatedBy: userId,
          },
        });
      } else {
        batch = await tx.stockBatch.create({
          data: {
            tenantId,
            branchId,
            inventoryItemId: dto.inventoryItemId,
            batchNumber: dto.batchNumber,
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            quantity: dto.quantity,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      // 2. Update the InventoryItem total_quantity
      const updatedItem = await tx.inventoryItem.update({
        where: { id: dto.inventoryItemId },
        data: {
          totalQuantity: { increment: dto.quantity },
          updatedBy: userId,
        },
      });

      // 3. Create the StockMovement record
      const movement = await tx.stockMovement.create({
        data: {
          tenantId,
          branchId,
          inventoryItemId: dto.inventoryItemId,
          stockBatchId: batch.id,
          movementType: StockMovementType.RECEIVE,
          quantityChange: dto.quantity,
          referenceId: dto.referenceId,
          reason: `Stock received into batch ${dto.batchNumber}`,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 4. Call AuditService.log
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'STOCK_RECEIVED',
          recordType: 'StockMovement',
          recordId: movement.id,
          newValues: {
            item: updatedItem,
            batch,
            movement,
          },
        },
        tx,
        branchId,
      );

      return { item: updatedItem, batch, movement };
    });
  }

  async adjustStock(
    tenantId: string,
    branchId: string,
    userId: string,
    dto: AdjustStockDto,
  ) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: dto.inventoryItemId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.prisma.$transaction(async (tx) => {
      let batch = null;

      // 1. Negative Stock Guard (Item Level)
      if (item.totalQuantity + dto.quantityChange < 0) {
        throw new ConflictException('insufficient_stock');
      }

      if (dto.stockBatchId) {
        batch = await tx.stockBatch.findFirst({
          where: {
            id: dto.stockBatchId,
            inventoryItemId: dto.inventoryItemId,
            tenantId,
          },
        });

        if (!batch) {
          throw new NotFoundException('Stock batch not found');
        }

        // Negative Stock Guard (Batch Level)
        if (batch.quantity + dto.quantityChange < 0) {
          throw new ConflictException('insufficient_stock');
        }

        // 2. Update StockBatch quantity
        batch = await tx.stockBatch.update({
          where: { id: batch.id },
          data: {
            quantity: { increment: dto.quantityChange },
            updatedBy: userId,
          },
        });
      } else if (dto.quantityChange < 0) {
        // If no batch ID and negative adjustment, we should ideally know which batch to deduct from.
        // But for generic adjustment, we might need a policy.
        // For now, if no batch ID is provided for negative adjustment, we fail if it's not allowed by business rules.
        // However, the requirement says "Adjust existing stock".
        // I will assume adjustments can be global if no batch is specified, but usually adjustments are batch-specific in healthcare.
        // If I must allow it, I won't update any batch.
      }

      // 3. Update the InventoryItem total_quantity
      const updatedItem = await tx.inventoryItem.update({
        where: { id: dto.inventoryItemId },
        data: {
          totalQuantity: { increment: dto.quantityChange },
          updatedBy: userId,
        },
      });

      // 4. Create the StockMovement record
      const movement = await tx.stockMovement.create({
        data: {
          tenantId,
          branchId,
          inventoryItemId: dto.inventoryItemId,
          stockBatchId: dto.stockBatchId,
          movementType: StockMovementType.ADJUSTMENT,
          quantityChange: dto.quantityChange,
          referenceId: dto.referenceId,
          reason: dto.reason,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 5. Call AuditService.log
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'STOCK_ADJUSTED',
          recordType: 'StockMovement',
          recordId: movement.id,
          newValues: {
            item: updatedItem,
            batch,
            movement,
          },
        },
        tx,
        branchId,
      );

      return { item: updatedItem, batch, movement };
    });
  }

  async getCatalog(tenantId: string, branchId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { tenantId, branchId },
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getItem(tenantId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
      include: {
        batches: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }
}
