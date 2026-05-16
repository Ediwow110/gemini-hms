import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InventoryStatus } from './dto/inventory.dto';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb) => cb(prisma)),
      inventoryItem: {
        findFirst: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
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
        status: InventoryStatus.ACTIVE,
      };
      prisma.inventoryItem.findFirst.mockResolvedValue(existing);
      prisma.inventoryItem.update.mockResolvedValue({
        ...existing,
        status: InventoryStatus.INACTIVE,
      });

      const result = await service.deactivateItem(
        mockTenantId,
        mockUserId,
        'item-1',
      );

      expect(result.status).toBe(InventoryStatus.INACTIVE);
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

  describe('Alerts', () => {
    it('should not create an alert if stock remains above reorder level', async () => {
      prisma.branchStock.findUnique.mockResolvedValue({
        id: '1',
        quantity: 20,
        reorderLevel: 10,
      });
      prisma.branchStock.updateMany.mockResolvedValue({ count: 1 });
      prisma.branchStock.findFirst.mockResolvedValue({
        id: '1',
        quantity: 15,
        reorderLevel: 10,
      });
      prisma.inventoryItem.findUnique.mockResolvedValue({
        id: 'item-1',
        sku: 'SKU1',
        name: 'Test',
      });

      await service.dispenseItem('tenant1', 'branch1', 'user1', '1', 5);

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
      prisma.inventoryItem.findUnique.mockResolvedValue({
        id: 'item-1',
        sku: 'SKU1',
        name: 'Test',
      });
      prisma.notification.findFirst.mockResolvedValue(null);

      await service.dispenseItem('tenant1', 'branch1', 'user1', '1', 5);

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
      prisma.inventoryItem.findUnique.mockResolvedValue({
        id: 'item-1',
        sku: 'SKU1',
        name: 'Test',
      });
      prisma.notification.findFirst.mockResolvedValue({
        id: 'notif1',
        status: 'PENDING',
      }); // Existing alert

      await service.dispenseItem('tenant1', 'branch1', 'user1', '1', 5);

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('scoped branch stock writes', () => {
    it('receiveStock rejects when scoped stock update touches no row', async () => {
      prisma.inventoryItem.findFirst.mockResolvedValue({
        id: 'item-99',
        tenantId: 'tenant1',
      });
      prisma.branchStock.upsert.mockResolvedValue({
        id: 'bs-99',
        tenantId: 'tenant1',
        branchId: 'branch1',
        quantity: 0,
      });
      prisma.branchStock.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.receiveStock('tenant1', 'branch1', 'user1', 'item-99', {
          quantity: 10,
          supplierName: 'ACME',
          remarks: 'in',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.branchStock.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'bs-99',
          tenantId: 'tenant1',
          branchId: 'branch1',
        },
        data: expect.objectContaining({ quantity: 10 }),
      });
      expect(prisma.stockLog.create).not.toHaveBeenCalled();
    });

    it('receiveStock writes audit entries with branch context', async () => {
      prisma.inventoryItem.findFirst.mockResolvedValue({
        id: 'item-99',
        tenantId: 'tenant1',
      });
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

    it('dispenseItem rejects when scoped stock update touches no row', async () => {
      prisma.branchStock.findUnique.mockResolvedValue({
        id: 'bs-1',
        quantity: 10,
        reorderLevel: 5,
      });
      prisma.branchStock.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.dispenseItem('tenant1', 'branch1', 'user1', 'item-1', 2),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.stockLog.create).not.toHaveBeenCalled();
    });
  });
});
