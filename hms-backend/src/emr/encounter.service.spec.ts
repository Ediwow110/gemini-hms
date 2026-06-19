import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { EncounterService } from './encounter.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateEncounterDto,
  CreateClinicalNoteDto,
  CreateVitalsDto,
} from './dto/encounter.dto';
import { EncounterStatus, NoteType } from '@prisma/client';

describe('EncounterService', () => {
  let service: EncounterService;
  let prisma: any;
  let auditService: any;
  let loggerSpy: jest.SpyInstance;

  const tenantId = 'tenant-a';
  const otherTenantId = 'tenant-b';
  const userId = 'user-1';
  const branchId = 'branch-1';
  const patientId = 'patient-1';
  const encounterId = 'encounter-1';

  const mockActivePatient = (id: string, tenant: string) => ({
    id,
    tenantId: tenant,
    firstName: 'John',
    lastName: 'Doe',
    status: 'ACTIVE',
  });

  const mockEncounter = (overrides = {}) => ({
    id: encounterId,
    tenantId,
    branchId,
    patientId,
    attendingId: null,
    status: EncounterStatus.IN_PROGRESS,
    type: 'OUTPATIENT',
    reason: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      patient: { findFirst: jest.fn() },
      encounter: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      vitals: { create: jest.fn() },
      diagnosis: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
      clinicalNote: { create: jest.fn() },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncounterService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<EncounterService>(EncounterService);

    // Suppress expected error logs
    loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  describe('create', () => {
    it('should create encounter transactionally with audit log', async () => {
      prisma.patient.findFirst.mockResolvedValue(
        mockActivePatient(patientId, tenantId),
      );
      const created = mockEncounter();
      prisma.encounter.create.mockResolvedValue(created);

      const dto: CreateEncounterDto = { patientId, branchId };
      const result = await service.create(tenantId, userId, branchId, dto);

      expect(result.status).toBe(EncounterStatus.IN_PROGRESS);
      expect(prisma.encounter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          branchId,
          patientId,
          createdBy: userId,
          updatedBy: userId,
        }),
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'ENCOUNTER_CREATED' }),
        expect.objectContaining({ encounter: prisma.encounter }),
        branchId,
      );
    });

    it('should throw NotFoundException if patient not found in tenant', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);
      const dto: CreateEncounterDto = { patientId, branchId };

      await expect(
        service.create(tenantId, userId, branchId, dto),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.encounter.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should rollback if audit logging fails', async () => {
      prisma.patient.findFirst.mockResolvedValue(
        mockActivePatient(patientId, tenantId),
      );
      prisma.encounter.create.mockResolvedValue(mockEncounter());
      auditService.log.mockRejectedValue(new Error('Audit failure'));

      await expect(
        service.create(tenantId, userId, branchId, { patientId, branchId }),
      ).rejects.toThrow('Audit failure');
    });
  });

  describe('findOne', () => {
    it('should return encounter with tenant + branch scope', async () => {
      prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
      const result = await service.findOne(tenantId, encounterId, branchId);
      expect(result.id).toBe(encounterId);
      expect(prisma.encounter.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: encounterId,
          tenantId,
          branchId,
          archivedAt: null,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException for cross-branch leakage', async () => {
      prisma.encounter.findFirst.mockResolvedValue(null);
      await expect(
        service.findOne(tenantId, encounterId, branchId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addClinicalNote', () => {
    it('should add note transactionally with audit log', async () => {
      prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
      const createdNote = {
        id: 'note-1',
        noteType: NoteType.PROGRESS,
        content: 'Test',
      };
      prisma.clinicalNote.create.mockResolvedValue(createdNote);

      const dto: CreateClinicalNoteDto = {
        noteType: NoteType.PROGRESS,
        content: 'Test',
      };
      const result = await service.addClinicalNote(
        tenantId,
        userId,
        branchId,
        encounterId,
        dto,
      );

      expect(result.id).toBe('note-1');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'CLINICAL_NOTE_ADDED' }),
        expect.objectContaining({ encounter: prisma.encounter }),
        branchId,
      );
    });

    it('should throw ConflictException if encounter is FINISHED', async () => {
      prisma.encounter.findFirst.mockResolvedValue(
        mockEncounter({ status: EncounterStatus.FINISHED }),
      );

      const dto: CreateClinicalNoteDto = {
        noteType: NoteType.PROGRESS,
        content: 'Late entry',
      };
      await expect(
        service.addClinicalNote(tenantId, userId, branchId, encounterId, dto),
      ).rejects.toThrow(ConflictException);

      expect(prisma.clinicalNote.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if encounter is CANCELLED', async () => {
      prisma.encounter.findFirst.mockResolvedValue(
        mockEncounter({ status: EncounterStatus.CANCELLED }),
      );

      const dto: CreateClinicalNoteDto = {
        noteType: NoteType.PROGRESS,
        content: 'Test',
      };
      await expect(
        service.addClinicalNote(tenantId, userId, branchId, encounterId, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for cross-tenant encounter', async () => {
      prisma.encounter.findFirst.mockResolvedValue(null);
      const dto: CreateClinicalNoteDto = {
        noteType: NoteType.PROGRESS,
        content: 'Test',
      };
      await expect(
        service.addClinicalNote(
          otherTenantId,
          userId,
          branchId,
          encounterId,
          dto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should rollback if audit logging fails during note creation', async () => {
      prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
      prisma.clinicalNote.create.mockResolvedValue({ id: 'note-1' });
      auditService.log.mockRejectedValue(new Error('Audit failure'));

      const dto: CreateClinicalNoteDto = {
        noteType: NoteType.PROGRESS,
        content: 'Test',
      };
      await expect(
        service.addClinicalNote(tenantId, userId, branchId, encounterId, dto),
      ).rejects.toThrow('Audit failure');
    });
  });

  describe('addVitals', () => {
    it('should add vitals transactionally with audit log', async () => {
      prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
      const createdVitals = { id: 'vitals-1', heartRate: 80, systolicBp: 120 };
      prisma.vitals.create.mockResolvedValue(createdVitals);

      const dto: CreateVitalsDto = { heartRate: 80, systolicBp: 120 };
      const result = await service.addVitals(
        tenantId,
        userId,
        branchId,
        encounterId,
        dto,
      );

      expect(result.id).toBe('vitals-1');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'VITALS_ADDED' }),
        expect.objectContaining({ encounter: prisma.encounter }),
        branchId,
      );
    });

    it('should throw ConflictException if encounter is FINISHED', async () => {
      prisma.encounter.findFirst.mockResolvedValue(
        mockEncounter({ status: EncounterStatus.FINISHED }),
      );

      const dto: CreateVitalsDto = { heartRate: 80 };
      await expect(
        service.addVitals(tenantId, userId, branchId, encounterId, dto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should update status transactionally with audit log', async () => {
      const updated = mockEncounter({
        status: EncounterStatus.FINISHED,
        endedAt: new Date(),
      });
      prisma.encounter.findFirst
        .mockResolvedValueOnce(mockEncounter())
        .mockResolvedValueOnce(updated);
      prisma.encounter.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateStatus(
        tenantId,
        userId,
        encounterId,
        EncounterStatus.FINISHED,
        branchId,
      );

      expect(result.status).toBe(EncounterStatus.FINISHED);
      expect(prisma.encounter.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: encounterId,
            tenantId,
            branchId,
            archivedAt: null,
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'ENCOUNTER_STATUS_UPDATED' }),
        expect.objectContaining({ encounter: prisma.encounter }),
        branchId,
      );
    });

    it('should rollback if audit logging fails during status update', async () => {
      const updated = mockEncounter({
        status: EncounterStatus.FINISHED,
      });
      prisma.encounter.findFirst
        .mockResolvedValueOnce(mockEncounter())
        .mockResolvedValueOnce(updated);
      prisma.encounter.updateMany.mockResolvedValue({ count: 1 });
      auditService.log.mockRejectedValue(new Error('Audit failure'));

      await expect(
        service.updateStatus(
          tenantId,
          userId,
          encounterId,
          EncounterStatus.FINISHED,
          branchId,
        ),
      ).rejects.toThrow('Audit failure');
    });
  });

  describe('removeDiagnosis', () => {
    const diagnosisId = 'diagnosis-1';

    it('removes a diagnosis from an open encounter and emits audit', async () => {
      prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
      prisma.diagnosis.findFirst.mockResolvedValue({
        id: diagnosisId,
        tenantId,
        encounterId,
        icd10Code: 'I10',
        description: 'Essential hypertension',
        isPrimary: true,
      });
      prisma.diagnosis.delete.mockResolvedValue({ id: diagnosisId });

      const result = await service.removeDiagnosis(
        tenantId,
        userId,
        branchId,
        encounterId,
        diagnosisId,
      );

      expect(result).toEqual({ success: true });
      expect(prisma.diagnosis.delete).toHaveBeenCalledWith({
        where: { id: diagnosisId },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'DIAGNOSIS_REMOVED',
          recordId: diagnosisId,
        }),
        prisma,
        branchId,
      );
    });

    it('rejects removal when diagnosis is not found', async () => {
      prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
      prisma.diagnosis.findFirst.mockResolvedValue(null);

      await expect(
        service.removeDiagnosis(
          tenantId,
          userId,
          branchId,
          encounterId,
          diagnosisId,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.diagnosis.delete).not.toHaveBeenCalled();
    });

    it('rejects removal from a finished encounter', async () => {
      prisma.encounter.findFirst.mockResolvedValue(
        mockEncounter({ status: EncounterStatus.FINISHED }),
      );

      await expect(
        service.removeDiagnosis(
          tenantId,
          userId,
          branchId,
          encounterId,
          diagnosisId,
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.diagnosis.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('archived-record operational filtering', () => {
    it('findOne excludes archived encounters (where.archivedAt is null)', async () => {
      prisma.encounter.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(tenantId, encounterId, branchId),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.encounter.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: encounterId,
            tenantId,
            branchId,
            archivedAt: null,
          }),
        }),
      );
    });

    it('getEncounterLocked rejects archived encounters (pre-read fail-closed)', async () => {
      prisma.encounter.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus(
          tenantId,
          userId,
          encounterId,
          EncounterStatus.FINISHED,
          branchId,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.encounter.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: encounterId,
            tenantId,
            branchId,
            archivedAt: null,
          }),
        }),
      );
      expect(prisma.encounter.update).not.toHaveBeenCalled();
    });

    it('addVitals rejects archived encounters via getEncounterLocked', async () => {
      prisma.encounter.findFirst.mockResolvedValue(null);

      const dto: CreateVitalsDto = {
        temperature: 37.0,
        systolicBp: 120,
        diastolicBp: 80,
        heartRate: 72,
        respiratory: 16,
      };

      await expect(
        service.addVitals(tenantId, userId, branchId, encounterId, dto),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.vitals.create).not.toHaveBeenCalled();
    });

    it('updateStatus rejects archived encounter via updateMany count zero', async () => {
      prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
      prisma.encounter.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateStatus(
          tenantId,
          userId,
          encounterId,
          EncounterStatus.FINISHED,
          branchId,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(auditService.log).not.toHaveBeenCalled();
    });
  });
});
