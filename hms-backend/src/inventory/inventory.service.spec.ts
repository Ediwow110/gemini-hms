import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StockMovementType } from '@prisma/client';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb) => cb(prisma)),
      inventoryItem: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      stockBatch: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      stockMovement: {
        create: jest.fn(),
      },
    };

    audit = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  const mockTenantId = 'tenant-uuid';
  const mockBranchId = 'branch-uuid';
  const mockUserId = 'user-uuid';

  describe('createItem', () => {
    it('should create an item and log audit', async () => {
      const dto = {
        name: 'Aspirin',
        sku: 'ASP-001',
        unitOfMeasure: 'TABLET',
        reorderLevel: 100,
        price: 5,
      };
      prisma.inventoryItem.findUnique.mockResolvedValue(null);
      prisma.inventoryItem.create.mockResolvedValue({ id: 'item-1', ...dto });

      const result = await service.createItem(
        mockTenantId,
        mockBranchId,
        mockUserId,
        dto,
      );

      expect(result.id).toBe('item-1');
      expect(prisma.inventoryItem.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'INVENTORY_ITEM_CREATED' }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should throw ConflictException if SKU exists', async () => {
      prisma.inventoryItem.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.createItem(mockTenantId, mockBranchId, mockUserId, {
          name: 'test',
          sku: 'SKU1',
          unitOfMeasure: 'EA',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('receiveStock', () => {
    it('should receive stock, update batch and item, and create movement', async () => {
      const dto = {
        inventoryItemId: 'item-1',
        batchNumber: 'B001',
        quantity: 50,
      };
      const mockItem = {
        id: 'item-1',
        tenantId: mockTenantId,
        totalQuantity: 10,
      };
      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.stockBatch.findFirst.mockResolvedValue(null); // New batch
      prisma.stockBatch.create.mockResolvedValue({
        id: 'batch-1',
        quantity: 50,
      });
      prisma.inventoryItem.update.mockResolvedValue({
        ...mockItem,
        totalQuantity: 60,
      });
      prisma.stockMovement.create.mockResolvedValue({ id: 'move-1' });

      const result = await service.receiveStock(
        mockTenantId,
        mockBranchId,
        mockUserId,
        dto,
      );

      expect(result.item.totalQuantity).toBe(60);
      expect(prisma.stockBatch.create).toHaveBeenCalled();
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: StockMovementType.RECEIVE,
            quantityChange: 50,
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'STOCK_RECEIVED' }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should update existing batch if found', async () => {
      const dto = {
        inventoryItemId: 'item-1',
        batchNumber: 'B001',
        quantity: 50,
      };
      prisma.inventoryItem.findFirst.mockResolvedValue({ id: 'item-1' });
      prisma.stockBatch.findFirst.mockResolvedValue({
        id: 'batch-1',
        quantity: 10,
      });
      prisma.stockBatch.update.mockResolvedValue({
        id: 'batch-1',
        quantity: 60,
      });
      prisma.inventoryItem.update.mockResolvedValue({});
      prisma.stockMovement.create.mockResolvedValue({});

      await service.receiveStock(mockTenantId, mockBranchId, mockUserId, dto);

      expect(prisma.stockBatch.update).toHaveBeenCalled();
      expect(prisma.stockBatch.create).not.toHaveBeenCalled();
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock and create movement', async () => {
      const dto = {
        inventoryItemId: 'item-1',
        stockBatchId: 'batch-1',
        quantityChange: -5,
        reason: 'Damage',
      };
      const mockItem = {
        id: 'item-1',
        tenantId: mockTenantId,
        totalQuantity: 10,
      };
      const mockBatch = { id: 'batch-1', quantity: 10 };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.stockBatch.findFirst.mockResolvedValue(mockBatch);
      prisma.stockBatch.update.mockResolvedValue({ ...mockBatch, quantity: 5 });
      prisma.inventoryItem.update.mockResolvedValue({
        ...mockItem,
        totalQuantity: 5,
      });
      prisma.stockMovement.create.mockResolvedValue({ id: 'move-2' });

      const result = await service.adjustStock(
        mockTenantId,
        mockBranchId,
        mockUserId,
        dto,
      );

      expect(result.item.totalQuantity).toBe(5);
      expect(prisma.stockBatch.update).toHaveBeenCalled();
      expect(prisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: StockMovementType.ADJUSTMENT,
            quantityChange: -5,
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'STOCK_ADJUSTED' }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should throw ConflictException if adjustment results in negative stock (item level)', async () => {
      const dto = {
        inventoryItemId: 'item-1',
        quantityChange: -20,
        reason: 'Test',
      };
      prisma.inventoryItem.findFirst.mockResolvedValue({
        id: 'item-1',
        totalQuantity: 10,
      });

      await expect(
        service.adjustStock(mockTenantId, mockBranchId, mockUserId, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if adjustment results in negative stock (batch level)', async () => {
      const dto = {
        inventoryItemId: 'item-1',
        stockBatchId: 'batch-1',
        quantityChange: -20,
        reason: 'Test',
      };
      prisma.inventoryItem.findFirst.mockResolvedValue({
        id: 'item-1',
        totalQuantity: 100,
      });
      prisma.stockBatch.findFirst.mockResolvedValue({
        id: 'batch-1',
        quantity: 10,
      });

      await expect(
        service.adjustStock(mockTenantId, mockBranchId, mockUserId, dto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Tenant Isolation', () => {
    it('receiveStock should fail if item belongs to another tenant', async () => {
      prisma.inventoryItem.findFirst.mockResolvedValue(null); // findFirst with tenantId filter returns null if mismatched

      await expect(
        service.receiveStock('tenant-A', mockBranchId, mockUserId, {
          inventoryItemId: 'item-B',
          batchNumber: 'B1',
          quantity: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Atomic Rollback', () => {
    it('should rollback if audit log fails', async () => {
      const dto = {
        inventoryItemId: 'item-1',
        batchNumber: 'B1',
        quantity: 10,
      };
      prisma.inventoryItem.findFirst.mockResolvedValue({ id: 'item-1' });
      prisma.stockBatch.findFirst.mockResolvedValue(null);
      prisma.stockBatch.create.mockResolvedValue({ id: 'batch-1' });
      prisma.inventoryItem.update.mockResolvedValue({});
      prisma.stockMovement.create.mockResolvedValue({});

      audit.log.mockRejectedValue(new Error('Audit DB Down'));

      await expect(
        service.receiveStock(mockTenantId, mockBranchId, mockUserId, dto),
      ).rejects.toThrow('Audit DB Down');

      // The transaction callback should have been called, and error propagated
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
