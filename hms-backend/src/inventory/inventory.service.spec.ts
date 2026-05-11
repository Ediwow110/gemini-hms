import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('InventoryService Alerts', () => {
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
      },
      branchStock: {
        findUnique: jest.fn(),
        update: jest.fn(),
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

  it('should not create an alert if stock remains above reorder level', async () => {
    prisma.branchStock.findUnique.mockResolvedValue({
      id: '1',
      quantity: 20,
      reorderLevel: 10,
    });
    prisma.branchStock.update.mockResolvedValue({
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
    prisma.branchStock.update.mockResolvedValue({
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
    prisma.branchStock.update.mockResolvedValue({
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
