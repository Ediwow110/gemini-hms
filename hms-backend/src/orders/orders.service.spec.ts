import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { OrderItemType } from './dto/order.dto';
import { Prisma } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let audit: any;
  let numbering: any;

  const mockTenantId = 'tenant-uuid';
  const mockUserId = 'user-uuid';
  const mockBranchId = 'branch-uuid';
  const mockPatientId = 'patient-uuid';

  const createPrismaMock = () => {
    const mock: any = {
      patient: {
        findFirst: jest.fn(),
      },
      serviceCatalog: {
        findFirst: jest.fn(),
      },
      inventoryItem: {
        findFirst: jest.fn(),
      },
      order: {
        create: jest
          .fn()
          .mockImplementation((args) =>
            Promise.resolve({ id: 'o1', ...args.data }),
          ),
      },
      invoice: {
        create: jest.fn().mockResolvedValue({ id: 'i1' }),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => await cb(mock)),
    };
    return mock;
  };

  beforeEach(async () => {
    prisma = createPrismaMock();
    audit = { log: jest.fn().mockResolvedValue({}) };
    numbering = { generateNumber: jest.fn().mockResolvedValue('NUM-1') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: NumberingService, useValue: numbering },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('create', () => {
    const validDto = {
      patientId: mockPatientId,
      branchId: mockBranchId,
      items: [
        {
          itemType: OrderItemType.SERVICE,
          itemId: 's1',
          quantity: 1,
          price: 9999,
        }, // Price should be ignored
        { itemType: OrderItemType.INVENTORY, itemId: 'v1', quantity: 2 },
      ],
    };

    it('should successfully create an order and invoice using trusted prices', async () => {
      prisma.patient.findFirst.mockResolvedValue({
        id: mockPatientId,
        tenantId: mockTenantId,
      });

      // Mock ServiceCatalog price: 500
      prisma.serviceCatalog.findFirst.mockResolvedValue({
        id: 's1',
        name: 'Consultation',
        price: new Prisma.Decimal(500),
      });

      // Mock InventoryItem price: 200
      prisma.inventoryItem.findFirst.mockResolvedValue({
        id: 'v1',
        name: 'Lab Test',
        price: new Prisma.Decimal(200),
      });

      numbering.generateNumber
        .mockResolvedValueOnce('ORD-001')
        .mockResolvedValueOnce('INV-001');

      const result = await service.create(
        mockTenantId,
        mockUserId,
        mockBranchId,
        validDto,
      );

      expect(result.order).toBeDefined();
      expect(result.invoice).toBeDefined();

      // Verify client-provided price (9999) was ignored
      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: new Prisma.Decimal(900), // 500*1 + 200*2 = 900
          }),
        }),
      );

      // Verify line item snapshots
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: {
              create: [
                expect.objectContaining({
                  name: 'Consultation',
                  unitPrice: new Prisma.Decimal(500),
                }),
                expect.objectContaining({
                  name: 'Lab Test',
                  unitPrice: new Prisma.Decimal(200),
                }),
              ],
            },
          }),
        }),
      );
    });

    it('should fail if service item is not found or inactive', async () => {
      prisma.patient.findFirst.mockResolvedValue({
        id: mockPatientId,
        tenantId: mockTenantId,
      });
      prisma.serviceCatalog.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockTenantId, mockUserId, mockBranchId, validDto),
      ).rejects.toThrow('Service item s1 not found or inactive');
    });

    it('should fail if inventory item is not found or inactive', async () => {
      prisma.patient.findFirst.mockResolvedValue({
        id: mockPatientId,
        tenantId: mockTenantId,
      });
      prisma.serviceCatalog.findFirst.mockResolvedValue({
        id: 's1',
        name: 'S1',
        price: new Prisma.Decimal(100),
      });
      prisma.inventoryItem.findFirst.mockResolvedValue(null); // Not found or inactive

      await expect(
        service.create(mockTenantId, mockUserId, mockBranchId, validDto),
      ).rejects.toThrow('Inventory item v1 not found or inactive');
    });

    it('should fail if patient tenant isolation is breached', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);
      await expect(
        service.create(mockTenantId, mockUserId, mockBranchId, validDto),
      ).rejects.toThrow('Patient not found or access denied');
    });

    it('should fail if no items are provided', async () => {
      const dto = { ...validDto, items: [] };
      await expect(
        service.create(mockTenantId, mockUserId, mockBranchId, dto),
      ).rejects.toThrow('Order must contain at least one item');
    });
  });
});
