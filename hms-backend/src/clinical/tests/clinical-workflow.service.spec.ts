import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { ClinicalWorkflowService } from '../clinical-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NumberingService } from '../../numbering/numbering.service';
import { SaveVitalsDto } from '../dto/save-vitals.dto';
import type { RequestUser } from '../../common/types/authenticated-request.type';

describe('ClinicalWorkflowService.saveVitals', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;
  let auditService: any;

  const tenantId = 'tenant-a';
  const branchId = 'branch-1';
  const otherBranchId = 'branch-2';
  const userId = 'nurse-1';
  const patientId = 'patient-1';
  const encounterId = 'encounter-1';

  const mockEncounter = (overrides = {}) => ({
    id: encounterId,
    tenantId,
    branchId,
    patientId,
    status: 'IN_PROGRESS',
    type: 'OUTPATIENT',
    createdAt: new Date(),
    ...overrides,
  });

  const mockVitals = (overrides = {}) => ({
    id: 'vitals-1',
    tenantId,
    encounterId,
    temperature: 36.6,
    systolicBp: 120,
    diastolicBp: 80,
    heartRate: 72,
    respiratory: 16,
    status: 'ACTIVE',
    createdBy: userId,
    createdAt: new Date(),
    ...overrides,
  });

  const nurseUser: RequestUser = {
    userId,
    tenantId,
    branchId,
    roles: ['Nurse'],
  };

  const superAdminUser: RequestUser = {
    userId: 'admin-1',
    tenantId,
    roles: ['Super Admin'],
  };

  const patientUser: RequestUser = {
    userId: 'pat-1',
    tenantId,
    roles: ['Patient'],
  };

  const cashierUser: RequestUser = {
    userId: 'cash-1',
    tenantId,
    branchId,
    roles: ['Cashier'],
  };

  const validDto: SaveVitalsDto = {
    systolicBp: 120,
    diastolicBp: 80,
    temperature: 36.6,
    heartRate: 72,
    respiratoryRate: 16,
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      encounter: { findFirst: jest.fn() },
      vitals: { create: jest.fn() },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalWorkflowService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        {
          provide: NumberingService,
          useValue: {
            generateNumber: jest.fn().mockResolvedValue('CLN-000001'),
          },
        },
      ],
    }).compile();

    service = module.get<ClinicalWorkflowService>(ClinicalWorkflowService);
  });

  describe('Authorization', () => {
    it('should reject Patient user attempting to save vitals for another patient', async () => {
      const patientUserOther: RequestUser = {
        userId: 'pat-other',
        tenantId,
        roles: ['Patient'],
      };
      await expect(
        service.saveVitals(patientId, tenantId, patientUserOther, validDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Cashier role', async () => {
      await expect(
        service.saveVitals(patientId, tenantId, cashierUser, validDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should fail closed when non-Super Admin has no branchId', async () => {
      const noBranchUser: RequestUser = {
        userId,
        tenantId,
        roles: ['Nurse'],
      };
      await expect(
        service.saveVitals(patientId, tenantId, noBranchUser, validDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Branch Isolation', () => {
    it('should reject cross-branch save when encounter branch differs from user branch', async () => {
      prisma.encounter.findFirst.mockResolvedValue(
        mockEncounter({ branchId: otherBranchId }),
      );

      await expect(
        service.saveVitals(patientId, tenantId, nurseUser, validDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Validation', () => {
    it('should reject when no vital values are provided', async () => {
      const emptyDto: SaveVitalsDto = {};
      await expect(
        service.saveVitals(patientId, tenantId, nurseUser, emptyDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when no active encounter exists', async () => {
      prisma.encounter.findFirst.mockResolvedValue(null);
      await expect(
        service.saveVitals(patientId, tenantId, nurseUser, validDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Successful Save', () => {
    it('should save vitals and return VitalsSummaryDto for Nurse', async () => {
      prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
      prisma.vitals.create.mockResolvedValue(mockVitals());

      const result = await service.saveVitals(
        patientId,
        tenantId,
        nurseUser,
        validDto,
      );

      expect(result.id).toBe('vitals-1');
      expect(result.encounterId).toBe(encounterId);
      expect(result.patientId).toBe(patientId);
      expect(result.systolicBp).toBe(120);
      expect(result.diastolicBp).toBe(80);
      expect(result.temperature).toBe(36.6);
      expect(result.heartRate).toBe(72);
      expect(result.respiratoryRate).toBe(16);
      expect(result.status).toBe('ACTIVE');
      expect(result.recordedBy).toBe(userId);
    });

    it('should create audit log entry on successful save', async () => {
      prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
      prisma.vitals.create.mockResolvedValue(mockVitals());

      await service.saveVitals(patientId, tenantId, nurseUser, validDto);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          userId,
          eventKey: 'VITALS_SAVED',
          recordType: 'Vitals',
          recordId: 'vitals-1',
        }),
        expect.anything(),
        branchId,
      );
    });

    it('should allow Super Admin with no branchId to save vitals', async () => {
      prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
      prisma.vitals.create.mockResolvedValue(mockVitals());

      const result = await service.saveVitals(
        patientId,
        tenantId,
        superAdminUser,
        validDto,
      );

      expect(result.id).toBe('vitals-1');
    });

    it('should not call unrelated mutation methods (no encounter mutation, no billing mutation)', async () => {
      prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
      prisma.vitals.create.mockResolvedValue(mockVitals());

      await service.saveVitals(patientId, tenantId, nurseUser, validDto);

      expect(prisma.vitals.create).toHaveBeenCalledTimes(1);
      expect(prisma.encounter.create).toBeUndefined();
      expect(prisma.encounter.update).toBeUndefined();
    });
  });
});
