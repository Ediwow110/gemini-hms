import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ClinicalWorkflowService } from '../clinical-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NumberingService } from '../../numbering/numbering.service';
import type { RequestUser } from '../../common/types/authenticated-request.type';

describe('ClinicalWorkflowService.signSOAP', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;
  let auditService: any;

  const tenantId = 'tenant-a';
  const branchId = 'branch-1';
  const otherBranchId = 'branch-2';
  const userId = 'doctor-1';
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
    archivedAt: null,
    ...overrides,
  });

  const mockClinicalNote = (overrides = {}) => ({
    id: 'note-1',
    tenantId,
    encounterId,
    noteType: 'SOAP',
    subjective: 'Feels tired',
    objective: 'Normal vitals',
    assessment: 'Fatigue',
    plan: 'Rest',
    authorId: userId,
    lockedAt: null,
    lockedBy: null,
    createdBy: userId,
    updatedBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const doctorUser: RequestUser = {
    userId,
    tenantId,
    branchId,
    roles: ['Doctor'],
  };

  const branchAdminUser: RequestUser = {
    userId: 'admin-branch-1',
    tenantId,
    branchId,
    roles: ['Branch Admin'],
  };

  const superAdminUser: RequestUser = {
    userId: 'super-admin-1',
    tenantId,
    roles: ['Super Admin'],
  };

  const nurseUser: RequestUser = {
    userId: 'nurse-1',
    tenantId,
    branchId,
    roles: ['Nurse'],
  };

  const patientUser: RequestUser = {
    userId: patientId,
    tenantId,
    roles: ['Patient'],
  };

  const cashierUser: RequestUser = {
    userId: 'cash-1',
    tenantId,
    branchId,
    roles: ['Cashier'],
  };

  const labUser: RequestUser = {
    userId: 'lab-1',
    tenantId,
    branchId,
    roles: ['Lab Technician'],
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      encounter: { findUnique: jest.fn() },
      clinicalNote: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
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

  // ======================================
  // AUTHORIZATION RULES (6 tests)
  // ======================================
  describe('Authorization Rules', () => {
    it('should reject Patient role from signing SOAP', async () => {
      await expect(
        service.signSOAP(patientId, encounterId, tenantId, patientUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Nurse role from signing SOAP', async () => {
      await expect(
        service.signSOAP(patientId, encounterId, tenantId, nurseUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Cashier role from signing SOAP', async () => {
      await expect(
        service.signSOAP(patientId, encounterId, tenantId, cashierUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Lab Technician role from signing SOAP', async () => {
      await expect(
        service.signSOAP(patientId, encounterId, tenantId, labUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should fail closed when branchId is missing for branch-scoped user', async () => {
      const doctorNoBranch: RequestUser = {
        userId,
        tenantId,
        roles: ['Doctor'],
      };
      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorNoBranch),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should accept Doctor role for signing SOAP with valid encounter', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).resolves.toBeDefined();
    });
  });

  // ======================================
  // BRANCH & TENANT ISOLATION (3 tests)
  // ======================================
  describe('Branch & Tenant Isolation', () => {
    it('should reject cross-branch sign when encounter branch differs from user branch', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ branchId: otherBranchId }),
      );

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject tenant mismatch on sign', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ tenantId: 'tenant-b' }),
      );

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Super Admin to sign cross-branch as long as tenant matches', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ branchId: otherBranchId }),
      );
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: 'super-admin-1' }),
      );

      const result = await service.signSOAP(
        patientId,
        encounterId,
        tenantId,
        superAdminUser,
      );
      expect(result.status).toBe('SIGNED');
    });
  });

  // ======================================
  // ROUTE CONSISTENCY & ENCOUNTER STATE (5 tests)
  // ======================================
  describe('Route Consistency & Encounter State Validation', () => {
    it('should reject when encounter does not belong to patientId', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ patientId: 'patient-other' }),
      );

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when encounter does not exist', async () => {
      prisma.encounter.findUnique.mockResolvedValue(null);

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject when encounter is archived', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ archivedAt: new Date() }),
      );

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when encounter is finished', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ status: 'FINISHED' }),
      );

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when encounter is cancelled', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ status: 'CANCELLED' }),
      );

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ======================================
  // CLINICAL NOTE STATE VALIDATION (4 tests)
  // ======================================
  describe('ClinicalNote State Validation', () => {
    it('should reject sign when no SOAP draft exists for encounter', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(null);

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject sign when SOAP draft is already locked/signed', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject sign when SOAP note has been soft-deleted', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(null); // deletedAt filter excludes it

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept sign when valid unlocked draft SOAP exists', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );

      const result = await service.signSOAP(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
      );
      expect(result.status).toBe('SIGNED');
    });
  });

  // ======================================
  // SIGN EXECUTION & SIDE EFFECTS (7 tests)
  // ======================================
  describe('Sign Execution & Side Effects', () => {
    it('should set lockedAt and lockedBy on the note', async () => {
      const now = new Date();
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: now, lockedBy: userId }),
      );

      await service.signSOAP(patientId, encounterId, tenantId, doctorUser);

      expect(prisma.clinicalNote.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'note-1' },
          data: expect.objectContaining({
            lockedAt: expect.any(Date),
            lockedBy: userId,
          }),
        }),
      );
    });

    it('should increment version on sign', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );

      await service.signSOAP(patientId, encounterId, tenantId, doctorUser);

      expect(prisma.clinicalNote.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: { increment: 1 },
          }),
        }),
      );
    });

    it('should return status SIGNED and lockedAt in response', async () => {
      const now = new Date();
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: now, lockedBy: userId }),
      );

      const result = await service.signSOAP(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
      );

      expect(result.status).toBe('SIGNED');
      expect(result.lockedAt).toEqual(now);
      expect(result.lockedBy).toBe(userId);
    });

    it('should log audit event SOAP_SIGNED in the same transaction', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );

      await service.signSOAP(patientId, encounterId, tenantId, doctorUser);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          userId,
          eventKey: 'SOAP_SIGNED',
          recordType: 'ClinicalNote',
          recordId: 'note-1',
          newValues: expect.objectContaining({
            patientId,
            encounterId,
            branchId,
            noteType: 'SOAP',
            oldStatus: 'DRAFT',
            newStatus: 'SIGNED',
          }),
        }),
        expect.anything(),
        branchId,
      );
    });

    it('should NOT include full SOAP text in audit payload', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );

      await service.signSOAP(patientId, encounterId, tenantId, doctorUser);

      const loggedPayload = auditService.log.mock.calls[0][0].newValues;
      expect(loggedPayload.subjective).toBeUndefined();
      expect(loggedPayload.objective).toBeUndefined();
      expect(loggedPayload.assessment).toBeUndefined();
      expect(loggedPayload.plan).toBeUndefined();
    });

    it('should not perform other side effects (orders, prescriptions, billing)', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );

      await service.signSOAP(patientId, encounterId, tenantId, doctorUser);

      expect(prisma.clinicalNote.update).toHaveBeenCalledTimes(1);
      expect(prisma.order).toBeUndefined();
      expect(prisma.prescription).toBeUndefined();
      expect(prisma.billingHandoff).toBeUndefined();
    });
  });

  // ======================================
  // BRANCH ADMIN & SUPER ADMIN SUPPORT (4 tests)
  // ======================================
  describe('Branch Admin & Super Admin Support', () => {
    it('should allow Branch Admin to sign SOAP for their branch', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: 'admin-branch-1' }),
      );

      const result = await service.signSOAP(
        patientId,
        encounterId,
        tenantId,
        branchAdminUser,
      );
      expect(result.status).toBe('SIGNED');
    });

    it('should allow Super Admin to sign SOAP for any branch', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ branchId: 'branch-other' }),
      );
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: 'super-admin-1' }),
      );

      const result = await service.signSOAP(
        patientId,
        encounterId,
        tenantId,
        superAdminUser,
      );
      expect(result.status).toBe('SIGNED');
    });

    it('should reject Branch Admin trying to sign SOAP in different branch', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ branchId: otherBranchId }),
      );

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, branchAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Super Admin sign when tenant mismatches', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ tenantId: 'tenant-b' }),
      );

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, superAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ======================================
  // IDEMPOTENCY & TRANSACTION INTEGRITY (3 tests)
  // ======================================
  describe('Idempotency & Transaction Integrity', () => {
    it('should reject signing an already-signed note (idempotent)', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use $transaction for the entire operation', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );

      await service.signSOAP(patientId, encounterId, tenantId, doctorUser);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should roll back on audit failure by throwing inside transaction', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );
      auditService.log.mockRejectedValue(new Error('audit_write_failed'));

      await expect(
        service.signSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow('audit_write_failed');
    });
  });

  // ======================================
  // getDraftSOAP post-sign state (3 tests)
  // ======================================
  describe('getDraftSOAP Post-Sign State', () => {
    it('should return status SIGNED for locked notes in getDraftSOAP', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );

      const result = await service.getDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
      );
      expect(result?.status).toBe('SIGNED');
      expect(result?.lockedAt).toBeDefined();
      expect(result?.lockedBy).toBe(userId);
    });

    it('should return accessLabel Clinical SOAP Signed for signed notes', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(
        mockClinicalNote({ lockedAt: new Date(), lockedBy: userId }),
      );

      const result = await service.getDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
      );
      expect(result?.accessLabel).toBe('Clinical SOAP Signed');
    });

    it('should return status DRAFT and original accessLabel for unlocked notes', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());

      const result = await service.getDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
      );
      expect(result?.status).toBe('DRAFT');
      expect(result?.accessLabel).toBe('Clinical SOAP Draft');
      expect(result?.lockedAt).toBeUndefined();
    });
  });
});
