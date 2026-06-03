import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { ClinicalWorkflowService } from '../clinical-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NumberingService } from '../../numbering/numbering.service';
import { SaveTriageDto, AcuityLevel } from '../dto/save-triage.dto';
import type { RequestUser } from '../../common/types/authenticated-request.type';

describe('ClinicalWorkflowService.saveTriage', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;
  let auditService: any;

  const tenantId = 'tenant-a';
  const branchId = 'branch-1';
  const otherBranchId = 'branch-2';
  const userId = 'nurse-1';
  const patientId = 'patient-1';
  const encounterId = 'encounter-1';
  const queueEntryId = 'queue-1';

  const mockEncounter = (overrides = {}) => ({
    id: encounterId,
    tenantId,
    branchId,
    patientId,
    status: 'OPEN',
    ...overrides,
  });

  const mockQueueEntry = (overrides = {}) => ({
    id: queueEntryId,
    tenantId,
    branchId,
    patientId,
    status: 'WAITING',
    ...overrides,
  });

  const nurseUser: RequestUser = {
    userId,
    tenantId,
    branchId,
    roles: ['Nurse'],
  };

  const patientUser: RequestUser = {
    userId: 'patient-user-1',
    tenantId,
    roles: ['Patient'],
  };

  const validDto: SaveTriageDto = {
    acuityLevel: AcuityLevel.YELLOW,
    chiefComplaintSummary: 'Persistent cough',
    arrivalMode: 'WALK_IN',
    painScore: 3,
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      encounter: {
        findFirst: jest.fn(),
      },
      queueEntry: {
        findFirst: jest.fn(),
      },
      triage: {
        create: jest.fn(),
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

  it('should successfully save triage with active encounter', async () => {
    prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
    prisma.queueEntry.findFirst.mockResolvedValue(mockQueueEntry());
    prisma.triage.create.mockResolvedValue({ id: 'triage-1' });

    await service.saveTriage(patientId, tenantId, nurseUser, validDto);

    expect(prisma.triage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        patientId,
        encounterId,
        queueEntryId,
        acuityLevel: 'YELLOW',
        chiefComplaintSummary: 'Persistent cough',
      }),
    });

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'TRIAGE_SAVED',
        recordType: 'Triage',
        newValues: expect.objectContaining({
          acuityLevel: 'YELLOW',
          recordedFields: expect.arrayContaining([
            'acuityLevel',
            'chiefComplaintSummary',
            'arrivalMode',
            'painScore',
          ]),
        }),
      }),
      expect.anything(),
      branchId,
    );
  });

  it('should successfully save triage with only queue entry', async () => {
    prisma.encounter.findFirst.mockResolvedValue(null);
    prisma.queueEntry.findFirst.mockResolvedValue(mockQueueEntry());
    prisma.triage.create.mockResolvedValue({ id: 'triage-1' });

    await service.saveTriage(patientId, tenantId, nurseUser, validDto);

    expect(prisma.triage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        patientId,
        encounterId: undefined,
        queueEntryId,
      }),
    });
  });

  it('should reject if no active encounter or queue entry', async () => {
    prisma.encounter.findFirst.mockResolvedValue(null);
    prisma.queueEntry.findFirst.mockResolvedValue(null);

    await expect(
      service.saveTriage(patientId, tenantId, nurseUser, validDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject if Patient role tries to save triage', async () => {
    await expect(
      service.saveTriage(patientId, tenantId, patientUser, validDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject cross-branch triage save', async () => {
    // Nurse is in branch-1, but patient is in branch-2
    prisma.encounter.findFirst.mockResolvedValue(null);
    prisma.queueEntry.findFirst.mockResolvedValue(
      mockQueueEntry({ branchId: otherBranchId }),
    );

    await expect(
      service.saveTriage(patientId, tenantId, nurseUser, validDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject empty payload', async () => {
    await expect(
      service.saveTriage(patientId, tenantId, nurseUser, {}),
    ).rejects.toThrow(BadRequestException);
  });

  it('should fail closed if missing branchId for branch-scoped user', async () => {
    const userNoBranch: RequestUser = { ...nurseUser, branchId: undefined };
    await expect(
      service.saveTriage(patientId, tenantId, userNoBranch, validDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should not leak raw PHI notes in audit log', async () => {
    prisma.encounter.findFirst.mockResolvedValue(mockEncounter());
    prisma.queueEntry.findFirst.mockResolvedValue(mockQueueEntry());
    prisma.triage.create.mockResolvedValue({ id: 'triage-1' });

    const dtoWithNotes = { ...validDto, notes: 'Very sensitive information' };
    await service.saveTriage(patientId, tenantId, nurseUser, dtoWithNotes);

    const auditCall = auditService.log.mock.calls[0][0];
    expect(auditCall.newValues.notes).toBeUndefined();
    expect(auditCall.newValues.chiefComplaintSummary).toBeUndefined();
  });
});
