import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InventoryStatus, Prisma } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb) => cb(prisma)),
      inventoryItem: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'item-1',
          tenantId: 'tenant1',
          status: 'ACTIVE',
        }),
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({
          id: 'item-1',
          sku: 'SKU1',
          name: 'Test',
          status: 'ACTIVE',
        }),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      branchStock: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      stockLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      notification: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };
    prisma.branchStock.fields = { reorderLevel: 'reorderLevel' };

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

  describe('lifecycle management', () => {
    const mockTenantId = 'tenant-uuid';
    const mockUserId = 'user-uuid';
    const mockBranchId = 'branch-uuid';

    it('should create an item and initialize stock', async () => {
      const dto = {
        name: 'Aspirin',
        sku: 'ASP-001',
        category: 'DRUG',
        unit: 'TAB',
        reorderLevel: 100,
        price: 5,
      };
      prisma.inventoryItem.create.mockResolvedValue({ id: 'item-1', ...dto });

      const result = await service.createItem(
        mockTenantId,
        mockBranchId,
        mockUserId,
        dto,
      );

      expect(result.id).toBe('item-1');
      expect(prisma.branchStock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ branchId: mockBranchId }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'INVENTORY_ITEM_CREATED' }),
        expect.anything(),
        mockBranchId,
      );
    });

    it('should update an item and log audit', async () => {
      const existing = { id: 'item-1', tenantId: mockTenantId, price: 5 };
      prisma.inventoryItem.findFirst.mockResolvedValue(existing);
      prisma.inventoryItem.update.mockResolvedValue({ ...existing, price: 6 });

      const result = await service.updateItem(
        mockTenantId,
        mockUserId,
        'item-1',
        {
          price: 6,
        },
      );

      expect(result.price).toBe(6);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'INVENTORY_ITEM_UPDATED',
          oldValues: existing,
        }),
        expect.anything(),
      );
    });

    it('should deactivate an item and log audit', async () => {
      const existing = {
        id: 'item-1',
        tenantId: mockTenantId,
        status: 'ACTIVE',
      };
      prisma.inventoryItem.findFirst.mockResolvedValue(existing);
      prisma.inventoryItem.update.mockResolvedValue({
        ...existing,
        status: 'INACTIVE',
      });

      const result = await service.deactivateItem(
        mockTenantId,
        mockUserId,
        'item-1',
      );

      expect(result.status).toBe('INACTIVE');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'INVENTORY_ITEM_DEACTIVATED' }),
        expect.anything(),
      );
    });

    it('should fail update if item not found in tenant', async () => {
      prisma.inventoryItem.findFirst.mockResolvedValue(null);
      await expect(
        service.updateItem(mockTenantId, mockUserId, 'item-1', { price: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('dispense validation', () => {
    it('rejects negative quantity before touching stock', async () => {
      await expect(
        service.dispenseItem('tenant1', 'branch1', 'user1', 'item-1', -5),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.branchStock.findUnique).not.toHaveBeenCalled();
    });

    it('rejects zero quantity before touching stock', async () => {
      await expect(
        service.dispenseItem('tenant1', 'branch1', 'user1', 'item-1', 0),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.branchStock.findUnique).not.toHaveBeenCalled();
    });

    it('rejects non-finite quantity before touching stock', async () => {
      await expect(
        service.dispenseItem(
          'tenant1',
          'branch1',
          'user1',
          'item-1',
          Number.NaN,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.branchStock.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Alerts', () => {
    it('should not create an alert if stock remains above reorder level', async () => {
      prisma.branchStock.findUnique.mockResolvedValue({
        id: '1',
        quantity: 20,
        reorderLevel: 10,
        version: 1,
      });
      prisma.branchStock.updateMany.mockResolvedValue({ count: 1 });
      prisma.branchStock.findFirst.mockResolvedValue({
        id: '1',
        quantity: 15,
        reorderLevel: 10,
        version: 1,
      });

      await service.dispenseItem('tenant1', 'branch1', 'user1', 'item-1', 5);

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('should create an alert on threshold crossing', async () => {
      prisma.branchStock.findUnique.mockResolvedValue({
        id: '1',
        quantity: 15,
        reorderLevel: 10,
      });
      prisma.branchStock.updateMany.mockResolvedValue({ count: 1 });
      prisma.branchStock.findFirst.mockResolvedValue({
        id: '1',
        quantity: 10,
        reorderLevel: 10,
      });
      prisma.notification.findFirst.mockResolvedValue(null);

      await service.dispenseItem('tenant1', 'branch1', 'user1', 'item-1', 5);

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ subject: 'LOW STOCK ALERT: Test' }),
        }),
      );
    });

    it('should prevent duplicate unresolved alert spam', async () => {
      prisma.branchStock.findUnique.mockResolvedValue({
        id: '1',
        quantity: 15,
        reorderLevel: 10,
      });
      prisma.branchStock.updateMany.mockResolvedValue({ count: 1 });
      prisma.branchStock.findFirst.mockResolvedValue({
        id: '1',
        quantity: 10,
        reorderLevel: 10,
      });
      prisma.notification.findFirst.mockResolvedValue({
        id: 'notif1',
        status: 'PENDING',
      }); // Existing alert

      await service.dispenseItem('tenant1', 'branch1', 'user1', 'item-1', 5);

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('scoped branch stock writes', () => {
    it('receiveStock rejects when scoped stock update touches no row', async () => {
      prisma.branchStock.upsert.mockResolvedValue({
        id: 'bs-99',
        tenantId: 'tenant1',
        branchId: 'branch1',
        quantity: 0,
        version: 1,
      });
      prisma.branchStock.updateMany.mockResolvedValue({ count: 0 });
      prisma.branchStock.findUnique.mockResolvedValue({
        id: 'bs-99',
        tenantId: 'tenant1',
        branchId: 'branch1',
        quantity: 0,
        version: 2,
      });

      await expect(
        service.receiveStock('tenant1', 'branch1', 'user1', 'item-99', {
          quantity: 10,
          supplierName: 'ACME',
          remarks: 'in',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.branchStock.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'bs-99',
          tenantId: 'tenant1',
          branchId: 'branch1',
          version: 1,
        },
        data: expect.objectContaining({
          quantity: 10,
          version: { increment: 1 },
        }),
      });
      expect(prisma.stockLog.create).not.toHaveBeenCalled();
    });

    it('receiveStock writes audit entries with branch context', async () => {
      prisma.branchStock.upsert.mockResolvedValue({
        id: 'bs-99',
        tenantId: 'tenant1',
        branchId: 'branch1',
        quantity: 5,
      });
      prisma.branchStock.updateMany.mockResolvedValue({ count: 1 });
      prisma.branchStock.findFirst.mockResolvedValue({
        id: 'bs-99',
        tenantId: 'tenant1',
        branchId: 'branch1',
        quantity: 15,
      });
      prisma.stockLog.create.mockResolvedValue({ id: 'log-1' });

      await service.receiveStock('tenant1', 'branch1', 'user1', 'item-99', {
        quantity: 10,
        supplierName: 'ACME',
        remarks: 'in',
      });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'STOCK_RECEIVED' }),
        expect.anything(),
        'branch1',
      );
    });

    it('dispenseItem uses provided transaction client without opening a nested transaction', async () => {
      const tx = {
        branchStock: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'bs-1',
            quantity: 10,
            reorderLevel: 5,
            version: 1,
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          findFirst: jest.fn().mockResolvedValue({
            id: 'bs-1',
            quantity: 8,
            reorderLevel: 5,
            version: 2,
          }),
        },
        stockLog: { create: jest.fn().mockResolvedValue({ id: 'log-1' }) },
        inventoryItem: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'item-1',
            tenantId: 'tenant1',
            status: 'ACTIVE',
          }),
          findUnique: jest.fn().mockResolvedValue({
            id: 'item-1',
            sku: 'SKU1',
            name: 'Test',
          }),
        },
        notification: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
      } as unknown as Prisma.TransactionClient;

      await service.dispenseItem(
        'tenant1',
        'branch1',
        'user1',
        'item-1',
        2,
        'order-1',
        tx,
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(tx.branchStock.updateMany).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'STOCK_DISPENSED' }),
        tx,
        'branch1',
      );
    });

    it('dispenseItem rejects when scoped stock update touches no row', async () => {
      prisma.branchStock.findUnique.mockResolvedValue({
        id: 'bs-1',
        quantity: 10,
        reorderLevel: 5,
        version: 1,
      });
      prisma.branchStock.updateMany.mockResolvedValue({ count: 0 });
      // The second findUnique (inside transaction for current stock check) returns the stock
      prisma.branchStock.findUnique.mockResolvedValue({
        id: 'bs-1',
        quantity: 10,
        reorderLevel: 5,
        version: 2,
      });

      await expect(
        service.dispenseItem('tenant1', 'branch1', 'user1', 'item-1', 2),
      ).rejects.toThrow(ConflictException);

      expect(prisma.stockLog.create).not.toHaveBeenCalled();
    });
  });

  describe('adjustStock', () => {
    const mockBranchStock = {
      id: 'stock-1',
      inventoryItemId: 'item-1',
      tenantId: 'tenant1',
      branchId: 'branch1',
      quantity: 10,
      reorderLevel: 5,
      version: 1,
    };

    it('should adjust stock to a new quantity and create a stock log', async () => {
      prisma.branchStock.findFirst
        .mockResolvedValueOnce(mockBranchStock)
        .mockResolvedValueOnce({ ...mockBranchStock, quantity: 25 });
      prisma.branchStock.updateMany.mockResolvedValue({ count: 1 });
      prisma.stockLog.create.mockResolvedValue({});

      await service.adjustStock('tenant1', 'branch1', 'user1', 'item-1', {
        newQuantity: 25,
        reason: 'Physical inventory count correction',
      });

      expect(prisma.branchStock.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 25,
            version: { increment: 1 },
          }),
        }),
      );
      expect(prisma.stockLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'ADJUSTMENT',
            quantity: 15, // 25 - 10
            previousStock: 10,
            newStock: 25,
            remarks: 'Physical inventory count correction',
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if stock not found', async () => {
      prisma.branchStock.findFirst.mockResolvedValue(null);

      await expect(
        service.adjustStock('tenant1', 'branch1', 'user1', 'nonexistent', {
          newQuantity: 10,
          reason: 'Correction',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if stock version mismatch', async () => {
      prisma.branchStock.findFirst.mockResolvedValue(mockBranchStock);
      prisma.branchStock.updateMany.mockResolvedValue({ count: 0 });
      prisma.branchStock.findUnique.mockResolvedValue({
        ...mockBranchStock,
        version: 2,
      });

      await expect(
        service.adjustStock('tenant1', 'branch1', 'user1', 'item-1', {
          newQuantity: 20,
          reason: 'Correction',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject blank adjustment reasons', async () => {
      await expect(
        service.adjustStock('tenant1', 'branch1', 'user1', 'item-1', {
          newQuantity: 20,
          reason: '   ',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.branchStock.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('getCatalog pagination', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should apply MAX_PAGE_SIZE cap (100) for catalog', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([]);
      await (service as any).getCatalog('tenant1', 'branch1');
      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should filter by tenantId and status', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([]);
      await (service as any).getCatalog('tenant1', 'branch1', 'ACTIVE');
      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant1', status: 'ACTIVE' },
        }),
      );
    });

    it('should order by name asc', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([]);
      await (service as any).getCatalog('tenant1', 'branch1');
      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } }),
      );
    });

    it('should include branchStocks scoped to branchId', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([]);
      await (service as any).getCatalog('tenant1', 'branch1');
      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { branchStocks: { where: { branchId: 'branch1' } } },
        }),
      );
    });
  });

  describe('getStockLogs pagination', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should apply default max page size when no pageSize provided', async () => {
      prisma.stockLog.findMany = jest.fn().mockResolvedValue([]);
      await service.getStockLogs('tenant1', 'branch1', 'item-1');
      expect(prisma.stockLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should clamp pageSize to max when over limit', async () => {
      prisma.stockLog.findMany = jest.fn().mockResolvedValue([]);
      await service.getStockLogs('tenant1', 'branch1', 'item-1', 500);
      expect(prisma.stockLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should preserve tenantId and branchId filters', async () => {
      prisma.stockLog.findMany = jest.fn().mockResolvedValue([]);
      await service.getStockLogs('tenant1', 'branch1', 'item-1');
      expect(prisma.stockLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'tenant1',
            branchId: 'branch1',
            inventoryItemId: 'item-1',
          },
        }),
      );
    });

    it('should order by createdAt desc', async () => {
      prisma.stockLog.findMany = jest.fn().mockResolvedValue([]);
      await service.getStockLogs('tenant1', 'branch1', 'item-1');
      expect(prisma.stockLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });
  });
});
