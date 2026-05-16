import { Test, TestingModule } from '@nestjs/testing';
import { PharmacyService } from './pharmacy.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PharmacyService', () => {
  let service: PharmacyService;

  const mockPrisma = {
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    patient: {
      findFirst: jest.fn(),
    },
    encounter: {
      findFirst: jest.fn(),
    },
    prescription: {
      create: jest.fn(),
      update: jest.fn(),
    },
    prescriptionItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    inventoryItem: {
      update: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    dispenseLog: {
      create: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PharmacyService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<PharmacyService>(PharmacyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPrescription', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const dto = {
      patientId: 'patient-1',
      encounterId: 'enc-1',
      branchId: 'branch-1',
      items: [
        {
          medicationId: 'med-1',
          dosage: '1 tab',
          frequency: 'BID',
          durationDays: 7,
          quantityPrescribed: 14,
        },
      ],
    };

    it('should create a prescription and log audit', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
      mockPrisma.encounter.findFirst.mockResolvedValue({ id: 'enc-1' });
      mockPrisma.prescription.create.mockResolvedValue({
        id: 'pres-1',
        ...dto,
      });

      const result = await service.createPrescription(tenantId, userId, dto);

      expect(result.id).toBe('pres-1');
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if patient does not exist in tenant', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.createPrescription(tenantId, userId, dto as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('dispenseItem', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const itemId = 'item-1';
    const dispenseDto = { branchId: 'branch-1', quantity: 5 };

    it('should dispense medication and deduct stock', async () => {
      const mockItem = {
        id: itemId,
        tenantId,
        prescriptionId: 'pres-1',
        quantityPrescribed: 10,
        quantityDispensed: 0,
        medication: {
          inventoryItem: {
            id: 'inv-1',
            totalQuantity: 20,
          },
        },
      };

      mockPrisma.prescriptionItem.findFirst.mockResolvedValue(mockItem);
      mockPrisma.prescriptionItem.findMany.mockResolvedValue([mockItem]);
      mockPrisma.prescriptionItem.update.mockResolvedValue({
        ...mockItem,
        quantityDispensed: 5,
      });
      mockPrisma.dispenseLog.create.mockResolvedValue({ id: 'log-1' });

      await service.dispenseItem(tenantId, userId, itemId, dispenseDto);

      expect(mockPrisma.stockMovement.create).toHaveBeenCalled();
      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalQuantity: { decrement: 5 },
          }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('should throw ConflictException if over-dispensing', async () => {
      const mockItem = {
        id: itemId,
        quantityPrescribed: 10,
        quantityDispensed: 8,
        medication: { inventoryItem: null },
      };
      mockPrisma.prescriptionItem.findFirst.mockResolvedValue(mockItem);

      await expect(
        service.dispenseItem(tenantId, userId, itemId, dispenseDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if insufficient stock', async () => {
      const mockItem = {
        id: itemId,
        quantityPrescribed: 10,
        quantityDispensed: 0,
        medication: {
          inventoryItem: {
            id: 'inv-1',
            totalQuantity: 2, // Less than dispenseDto.quantity (5)
          },
        },
      };
      mockPrisma.prescriptionItem.findFirst.mockResolvedValue(mockItem);

      await expect(
        service.dispenseItem(tenantId, userId, itemId, dispenseDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should fail closed for cross-tenant IDOR', async () => {
      mockPrisma.prescriptionItem.findFirst.mockResolvedValue(null);

      await expect(
        service.dispenseItem(tenantId, userId, itemId, dispenseDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
