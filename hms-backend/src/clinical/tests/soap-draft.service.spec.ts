import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { ClinicalWorkflowService } from '../clinical-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NumberingService } from '../../numbering/numbering.service';
import { SaveDraftSoapDto } from '../dto/save-draft-soap.dto';
import type { RequestUser } from '../../common/types/authenticated-request.type';

describe('ClinicalWorkflowService.saveDraftSOAP', () => {
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

  const validDto: SaveDraftSoapDto = {
    subjective: 'Feels tired',
    objective: 'Normal vitals',
    assessment: 'Fatigue',
    plan: 'Rest',
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      encounter: { findUnique: jest.fn() },
      clinicalNote: {
        findFirst: jest.fn(),
        create: jest.fn(),
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

  describe('Authorization Rules', () => {
    it('should reject Patient role', async () => {
      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          patientUser,
          validDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Nurse role', async () => {
      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          nurseUser,
          validDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Cashier role', async () => {
      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          cashierUser,
          validDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Lab Technician role', async () => {
      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          labUser,
          validDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should fail closed when branchId is missing for branch-scoped user', async () => {
      const doctorNoBranch: RequestUser = {
        userId,
        tenantId,
        roles: ['Doctor'],
      };
      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          doctorNoBranch,
          validDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Branch & Tenant Isolation', () => {
    it('should reject cross-branch save when encounter branch differs from user branch', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ branchId: otherBranchId }),
      );

      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          doctorUser,
          validDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject tenant mismatch', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ tenantId: 'tenant-b' }),
      );

      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          doctorUser,
          validDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Route Consistency & Encounter State Validation', () => {
    it('should reject when encounter does not belong to patientId', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ patientId: 'patient-other' }),
      );

      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          doctorUser,
          validDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when encounter does not exist', async () => {
      prisma.encounter.findUnique.mockResolvedValue(null);

      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          doctorUser,
          validDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject when encounter is archived', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ archivedAt: new Date() }),
      );

      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          doctorUser,
          validDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when encounter is closed/finished/cancelled', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ status: 'FINISHED' }),
      );

      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          doctorUser,
          validDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Payload validation', () => {
    it('should reject empty payload', async () => {
      const emptyDto: SaveDraftSoapDto = {};
      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          doctorUser,
          emptyDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payload with only spaces', async () => {
      const spacesDto: SaveDraftSoapDto = {
        subjective: '   ',
        objective: '',
      };
      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          doctorUser,
          spacesDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce DTO max lengths', async () => {
      const tooLongText = 'a'.repeat(2001);

      const dtoSubj = new SaveDraftSoapDto();
      dtoSubj.subjective = tooLongText;
      let errors = await validate(dtoSubj);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.maxLength).toBeDefined();

      const dtoObj = new SaveDraftSoapDto();
      dtoObj.objective = tooLongText;
      errors = await validate(dtoObj);
      expect(errors.length).toBeGreaterThan(0);

      const dtoAssess = new SaveDraftSoapDto();
      dtoAssess.assessment = tooLongText;
      errors = await validate(dtoAssess);
      expect(errors.length).toBeGreaterThan(0);

      const dtoPlan = new SaveDraftSoapDto();
      dtoPlan.plan = tooLongText;
      errors = await validate(dtoPlan);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Successful Draft Save', () => {
    it('should create new ClinicalNote of type SOAP when none exists', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(null);
      prisma.clinicalNote.create.mockResolvedValue(mockClinicalNote());

      const result = await service.saveDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
        validDto,
      );

      expect(prisma.clinicalNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            noteType: 'SOAP',
            subjective: 'Feels tired',
            objective: 'Normal vitals',
            assessment: 'Fatigue',
            plan: 'Rest',
            content: '',
          }),
        }),
      );
      expect(result.id).toBe('note-1');
      expect(result.status).toBe('DRAFT');
    });

    it('should update existing ClinicalNote of type SOAP when it exists and is unlocked', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(
        mockClinicalNote({ id: 'note-existing' }),
      );
      prisma.clinicalNote.update.mockResolvedValue(
        mockClinicalNote({ id: 'note-existing', plan: 'Rest and fluids' }),
      );

      const updateDto: SaveDraftSoapDto = { plan: 'Rest and fluids' };
      const result = await service.saveDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
        updateDto,
      );

      expect(prisma.clinicalNote.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'note-existing' },
          data: expect.objectContaining({
            plan: 'Rest and fluids',
          }),
        }),
      );
      expect(result.id).toBe('note-existing');
      expect(result.plan).toBe('Rest and fluids');
    });

    it('should reject if existing ClinicalNote is locked', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(
        mockClinicalNote({ id: 'note-existing', lockedAt: new Date() }),
      );

      await expect(
        service.saveDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          doctorUser,
          validDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log audit event in same transaction and not store full SOAP text', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(null);
      prisma.clinicalNote.create.mockResolvedValue(mockClinicalNote());

      await service.saveDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
        validDto,
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          userId,
          eventKey: 'SOAP_DRAFT_SAVED',
          recordType: 'ClinicalNote',
          recordId: 'note-1',
          newValues: expect.objectContaining({
            patientId,
            encounterId,
            branchId,
            noteType: 'SOAP',
            status: 'DRAFT',
            recordedFields: expect.arrayContaining([
              'subjective',
              'objective',
              'assessment',
              'plan',
            ]),
          }),
        }),
        expect.anything(),
        branchId,
      );

      const loggedPayload = auditService.log.mock.calls[0][0].newValues;
      expect(loggedPayload.subjective).toBeUndefined();
      expect(loggedPayload.objective).toBeUndefined();
      expect(loggedPayload.assessment).toBeUndefined();
      expect(loggedPayload.plan).toBeUndefined();
    });

    it('should support Branch Admin explicit save', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(null);
      prisma.clinicalNote.create.mockResolvedValue(
        mockClinicalNote({ authorId: 'admin-branch-1' }),
      );

      const result = await service.saveDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        branchAdminUser,
        validDto,
      );

      expect(result.status).toBe('DRAFT');
    });

    it('should support Super Admin explicit save bypassing branch scoping', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ branchId: 'branch-some-other' }),
      );
      prisma.clinicalNote.findFirst.mockResolvedValue(null);
      prisma.clinicalNote.create.mockResolvedValue(
        mockClinicalNote({ authorId: 'super-admin-1' }),
      );

      const result = await service.saveDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        superAdminUser,
        validDto,
      );

      expect(result.status).toBe('DRAFT');
    });

    it('should not perform other side effects like signing or billing', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(null);
      prisma.clinicalNote.create.mockResolvedValue(mockClinicalNote());

      await service.saveDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
        validDto,
      );

      expect(prisma.clinicalNote.create).toHaveBeenCalledTimes(1);
      // No order, prescription, or billing handoff creation should occur
      expect(prisma.order).toBeUndefined();
      expect(prisma.prescription).toBeUndefined();
      expect(prisma.billingHandoff).toBeUndefined();
    });
  });

  describe('getDraftSOAP', () => {
    it('should reject Patient role', async () => {
      await expect(
        service.getDraftSOAP(patientId, encounterId, tenantId, patientUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Nurse role', async () => {
      await expect(
        service.getDraftSOAP(patientId, encounterId, tenantId, nurseUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Cashier role', async () => {
      await expect(
        service.getDraftSOAP(patientId, encounterId, tenantId, cashierUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Lab Technician role', async () => {
      await expect(
        service.getDraftSOAP(patientId, encounterId, tenantId, labUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should fail closed when branchId is missing for branch-scoped user', async () => {
      const userMissingBranch = { ...doctorUser, branchId: undefined };
      await expect(
        service.getDraftSOAP(
          patientId,
          encounterId,
          tenantId,
          userMissingBranch,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject tenant mismatch', async () => {
      await expect(
        service.getDraftSOAP(
          patientId,
          encounterId,
          'other-tenant',
          doctorUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject cross-branch fetch when encounter branch differs from user branch', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ branchId: 'other-branch' }),
      );
      await expect(
        service.getDraftSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject when encounter does not belong to patientId', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ patientId: 'other-patient' }),
      );
      await expect(
        service.getDraftSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when encounter does not exist', async () => {
      prisma.encounter.findUnique.mockResolvedValue(null);
      await expect(
        service.getDraftSOAP(patientId, encounterId, tenantId, doctorUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return null when ClinicalNote does not exist', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(null);

      const result = await service.getDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
      );
      expect(result).toBeNull();
    });

    it('should return mapped SoapDraftSummaryDto when ClinicalNote exists', async () => {
      prisma.encounter.findUnique.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.findFirst.mockResolvedValue(
        mockClinicalNote({
          subjective: 'Symptom check',
          objective: 'Vitals stable',
        }),
      );

      const result = await service.getDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        doctorUser,
      );
      expect(result).toBeDefined();
      expect(result?.subjective).toBe('Symptom check');
      expect(result?.objective).toBe('Vitals stable');
      expect(result?.status).toBe('DRAFT');
    });

    it('should support Super Admin bypass of branch scoping', async () => {
      prisma.encounter.findUnique.mockResolvedValue(
        mockEncounter({ branchId: 'other-branch' }),
      );
      prisma.clinicalNote.findFirst.mockResolvedValue(mockClinicalNote());

      const result = await service.getDraftSOAP(
        patientId,
        encounterId,
        tenantId,
        superAdminUser,
      );
      expect(result).toBeDefined();
    });
  });
});
