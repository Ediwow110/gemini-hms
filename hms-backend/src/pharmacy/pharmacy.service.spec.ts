import { Test, TestingModule } from '@nestjs/testing';
import { PharmacyService } from './pharmacy.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

describe('PharmacyService', () => {
  let service: PharmacyService;
  let prisma: any;
  let audit: any;
  let inventory: any;

  const mockTenantId = 'tenant-1';
  const mockBranchId = 'branch-1';
  const mockUserId = 'user-1';
  const mockPrescriptionId = 'rx-1';
  const mockEncounterId = 'enc-1';
  const mockPatientId = 'patient-1';
  const mockInventoryItemId = 'item-1';

  const basePrescription = {
    id: mockPrescriptionId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    encounterId: mockEncounterId,
    prescribedById: 'doc-1',
    patientId: mockPatientId,
    medicationName: 'Amoxicillin 500mg',
    dosage: '500mg',
    frequency: 'TID',
    duration: '7 days',
    notes: 'Take with food',
    status: 'ACTIVE',
    createdById: 'doc-1',
    updatedById: null,
    dispensedById: null,
    dispensedAt: null,
    deletedAt: null,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const basePatient = {
    id: mockPatientId,
    firstName: 'John',
    lastName: 'Doe',
    patientNumber: 'PT-001',
  };

  const basePrescriber = {
    id: 'doc-1',
    email: 'doctor@example.com',
  };

  const mockPharmacistUser = {
    userId: mockUserId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Pharmacist'],
  };

  const mockBranchAdminUser = {
    userId: 'branch-admin-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Branch Admin'],
  };

  const mockSuperAdminUser = {
    userId: 'super-admin-1',
    tenantId: mockTenantId,
    branchId: 'any-branch',
    roles: ['Super Admin'],
  };

  const mockUnauthorizedUser = {
    userId: 'cashier-1',
    tenantId: mockTenantId,
    branchId: mockBranchId,
    roles: ['Cashier'],
  };

  const validDto = {
    version: 0,
    inventoryItemId: mockInventoryItemId,
    quantity: 1,
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((cb: any) => cb(prisma)),
      prescription: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      inventoryItem: {
        findMany: jest.fn(),
      },
    };

    audit = {
      log: jest.fn(),
    };

    inventory = {
      dispenseItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PharmacyService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: InventoryService, useValue: inventory },
      ],
    }).compile();

    service = module.get<PharmacyService>(PharmacyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrescriptionQueue', () => {
    it('should return prescriptions for branch-scoped user', async () => {
      prisma.prescription.findMany.mockResolvedValue([
        {
          ...basePrescription,
          patient: basePatient,
          prescribedBy: basePrescriber,
        },
      ]);

      const result = await service.getPrescriptionQueue(
        mockTenantId,
        undefined,
        mockPharmacistUser,
        'ACTIVE',
      );

      expect(result).toHaveLength(1);
      expect(result[0].patientName).toBe('John Doe');
      expect(result[0].medicationName).toBe('Amoxicillin 500mg');
      expect(result[0].status).toBe('ACTIVE');
      expect(prisma.prescription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            branchId: mockBranchId,
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('should return all branch prescriptions when no status filter', async () => {
      prisma.prescription.findMany.mockResolvedValue([
        {
          ...basePrescription,
          patient: basePatient,
          prescribedBy: basePrescriber,
        },
      ]);

      const result = await service.getPrescriptionQueue(
        mockTenantId,
        undefined,
        mockPharmacistUser,
        undefined,
      );

      expect(result).toHaveLength(1);
      expect(prisma.prescription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ status: expect.anything() }),
        }),
      );
    });

    it('should enforce tenant isolation', async () => {
      await expect(
        service.getPrescriptionQueue(
          'wrong-tenant',
          undefined,
          mockPharmacistUser,
          'ACTIVE',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject user without branch context', async () => {
      const userNoBranch = {
        ...mockPharmacistUser,
        branchId: undefined,
      };

      await expect(
        service.getPrescriptionQueue(
          mockTenantId,
          undefined,
          userNoBranch,
          'ACTIVE',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getDrugCatalog', () => {
    it('should return drug catalog for branch-scoped Pharmacist', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([
        {
          id: 'drug-1',
          tenantId: mockTenantId,
          name: 'Amoxicillin 500mg Capsule',
          sku: 'DRUG-AMX-500',
          category: 'DRUG',
          unit: 'capsules',
          reorderLevel: 200,
          currentStock: 150,
          price: 0.5,
          status: 'ACTIVE',
          branchStocks: [{ quantity: 150, reorderLevel: 200 }],
        },
      ]);

      const result = await service.getDrugCatalog(
        mockTenantId,
        undefined,
        mockPharmacistUser,
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Amoxicillin 500mg Capsule');
      expect(result[0].quantity).toBe(150);
      expect(result[0].type).toBe('DRUG');
      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            category: 'DRUG',
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('should return empty array when no drugs found', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([]);

      const result = await service.getDrugCatalog(
        mockTenantId,
        undefined,
        mockPharmacistUser,
      );

      expect(result).toHaveLength(0);
    });

    it('should enforce tenant isolation', async () => {
      await expect(
        service.getDrugCatalog('wrong-tenant', undefined, mockPharmacistUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('dispenseMedication', () => {
    it('should dispense medication successfully for Pharmacist', async () => {
      prisma.prescription.findFirst.mockResolvedValue(basePrescription);
      prisma.prescription.updateMany.mockResolvedValue({ count: 1 });
      prisma.prescription.findUnique.mockResolvedValue({
        ...basePrescription,
        status: 'DISPENSED',
        dispensedById: mockUserId,
        dispensedAt: new Date(),
        version: 1,
      });
      inventory.dispenseItem.mockResolvedValue({ quantity: 99 });

      const result = await service.dispenseMedication(
        mockPrescriptionId,
        mockTenantId,
        mockPharmacistUser,
        validDto,
      );

      expect(result.status).toBe('DISPENSED');
      expect(result.version).toBe(1);
      expect(result.dispensedById).toBe(mockUserId);
      expect(prisma.prescription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: mockPrescriptionId,
            version: 0,
            status: 'ACTIVE',
          }),
        }),
      );
      expect(inventory.dispenseItem).toHaveBeenCalledWith(
        mockTenantId,
        mockBranchId,
        mockUserId,
        mockInventoryItemId,
        1,
        mockPrescriptionId,
        prisma,
      );
      expect(audit.log).toHaveBeenCalled();
    });

    it('should dispense successfully for Branch Admin', async () => {
      prisma.prescription.findFirst.mockResolvedValue(basePrescription);
      prisma.prescription.updateMany.mockResolvedValue({ count: 1 });
      prisma.prescription.findUnique.mockResolvedValue({
        ...basePrescription,
        status: 'DISPENSED',
        dispensedById: mockUserId,
        dispensedAt: new Date(),
        version: 1,
      });
      inventory.dispenseItem.mockResolvedValue({ quantity: 99 });

      const result = await service.dispenseMedication(
        mockPrescriptionId,
        mockTenantId,
        mockBranchAdminUser,
        validDto,
      );

      expect(result.status).toBe('DISPENSED');
    });

    it('should dispense successfully for Super Admin', async () => {
      prisma.prescription.findFirst.mockResolvedValue(basePrescription);
      prisma.prescription.updateMany.mockResolvedValue({ count: 1 });
      prisma.prescription.findUnique.mockResolvedValue({
        ...basePrescription,
        status: 'DISPENSED',
        dispensedById: 'super-admin-1',
        dispensedAt: new Date(),
        version: 1,
      });
      inventory.dispenseItem.mockResolvedValue({ quantity: 99 });

      const result = await service.dispenseMedication(
        mockPrescriptionId,
        mockTenantId,
        mockSuperAdminUser,
        validDto,
      );

      expect(result.status).toBe('DISPENSED');
    });

    it('should reject unauthorized role (Cashier)', async () => {
      await expect(
        service.dispenseMedication(
          mockPrescriptionId,
          mockTenantId,
          mockUnauthorizedUser,
          validDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject non-existent prescription', async () => {
      prisma.prescription.findFirst.mockResolvedValue(null);

      await expect(
        service.dispenseMedication(
          mockPrescriptionId,
          mockTenantId,
          mockPharmacistUser,
          validDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject already dispensed prescription', async () => {
      prisma.prescription.findFirst.mockResolvedValue({
        ...basePrescription,
        status: 'DISPENSED',
      });

      await expect(
        service.dispenseMedication(
          mockPrescriptionId,
          mockTenantId,
          mockPharmacistUser,
          validDto,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject cancelled prescription', async () => {
      prisma.prescription.findFirst.mockResolvedValue({
        ...basePrescription,
        status: 'CANCELLED',
      });

      await expect(
        service.dispenseMedication(
          mockPrescriptionId,
          mockTenantId,
          mockPharmacistUser,
          validDto,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw conflict on version mismatch', async () => {
      prisma.prescription.findFirst.mockResolvedValue(basePrescription);
      prisma.prescription.updateMany.mockResolvedValue({ count: 0 });
      prisma.prescription.findUnique.mockResolvedValue({
        ...basePrescription,
        version: 1,
      });

      await expect(
        service.dispenseMedication(
          mockPrescriptionId,
          mockTenantId,
          mockPharmacistUser,
          validDto,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should enforce tenant isolation', async () => {
      await expect(
        service.dispenseMedication(
          mockPrescriptionId,
          'wrong-tenant',
          mockPharmacistUser,
          validDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should enforce branch isolation for non-Super Admin', async () => {
      const wrongBranchUser = {
        ...mockPharmacistUser,
        branchId: 'different-branch',
      };

      prisma.prescription.findFirst.mockResolvedValue(basePrescription);

      await expect(
        service.dispenseMedication(
          mockPrescriptionId,
          mockTenantId,
          wrongBranchUser,
          validDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject the outer transaction if a later step fails after stock deduction', async () => {
      prisma.prescription.findFirst.mockResolvedValue(basePrescription);
      prisma.prescription.updateMany.mockResolvedValue({ count: 1 });
      inventory.dispenseItem.mockResolvedValue({ quantity: 99 });
      audit.log.mockRejectedValue(new Error('audit failed'));

      await expect(
        service.dispenseMedication(
          mockPrescriptionId,
          mockTenantId,
          mockPharmacistUser,
          validDto,
        ),
      ).rejects.toThrow('audit failed');

      expect(inventory.dispenseItem).toHaveBeenCalledWith(
        mockTenantId,
        mockBranchId,
        mockUserId,
        mockInventoryItemId,
        1,
        mockPrescriptionId,
        prisma,
      );
    });
  });
});
