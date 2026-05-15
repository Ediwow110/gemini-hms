import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { BadRequestException } from '@nestjs/common';

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
      order: {
        create: jest.fn().mockResolvedValue({ id: 'o1' }),
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
        { serviceName: 'Consultation', price: 500, quantity: 1 },
        { serviceName: 'Lab Test', price: 200, quantity: 2 },
      ],
    };

    it('should successfully create an order and invoice', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: mockPatientId, tenantId: mockTenantId });
      numbering.generateNumber
        .mockResolvedValueOnce('ORD-001')
        .mockResolvedValueOnce('INV-001');

      const result = await service.create(mockTenantId, mockUserId, mockBranchId, validDto);

      expect(result.order).toBeDefined();
      expect(result.invoice).toBeDefined();
      expect(prisma.patient.findFirst).toHaveBeenCalledWith({
        where: { id: mockPatientId, tenantId: mockTenantId },
      });
      expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          orderNumber: 'ORD-001',
          patientId: mockPatientId,
        }),
      }));
      expect(prisma.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          invoiceNumber: 'INV-001',
          totalAmount: 900, // 500*1 + 200*2
        }),
      }));
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
        eventKey: 'ORDER_CREATED',
      }));
    });

    it('should fail if no items are provided', async () => {
      const dto = { ...validDto, items: [] };
      await expect(service.create(mockTenantId, mockUserId, mockBranchId, dto))
        .rejects.toThrow(BadRequestException);
    });

    it('should fail if patient is not found or belongs to another tenant', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);
      await expect(service.create(mockTenantId, mockUserId, mockBranchId, validDto))
        .rejects.toThrow('Patient not found or access denied');
    });

    it('should use transaction client for numbering', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: mockPatientId, tenantId: mockTenantId });
      await service.create(mockTenantId, mockUserId, mockBranchId, validDto);

      expect(numbering.generateNumber).toHaveBeenCalledWith(
        mockTenantId,
        'ORDER',
        mockBranchId,
        expect.anything(), // tx client
      );
      expect(numbering.generateNumber).toHaveBeenCalledWith(
        mockTenantId,
        'INVOICE',
        mockBranchId,
        expect.anything(), // tx client
      );
    });
  });
});
