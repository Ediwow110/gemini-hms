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
import { MarkVitalsErrorDto } from '../dto/mark-vitals-error.dto';
import type { RequestUser } from '../../common/types/authenticated-request.type';

describe('ClinicalWorkflowService.markVitalsEnteredInError', () => {
  let service: ClinicalWorkflowService;
  let prisma: any;
  let auditService: any;

  const tenantId = 'tenant-a';
  const branchId = 'branch-1';
  const otherBranchId = 'branch-2';
  const userId = 'nurse-1';
  const patientId = 'patient-1';
  const vitalsId = 'vitals-1';
  const encounterId = 'encounter-1';

  const mockVitals = (overrides = {}) => ({
    id: vitalsId,
    tenantId,
    encounterId,
    status: 'ACTIVE',
    encounter: {
      id: encounterId,
      patientId,
      branchId,
    },
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

  const validDto: MarkVitalsErrorDto = {
    reason: 'Wrong patient',
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      vitals: {
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

  it('should successfully mark vitals as entered-in-error', async () => {
    prisma.vitals.findFirst.mockResolvedValue(mockVitals());
    prisma.vitals.update.mockResolvedValue({
      ...mockVitals(),
      status: 'ENTERED_IN_ERROR',
    });

    await service.markVitalsEnteredInError(
      patientId,
      vitalsId,
      tenantId,
      nurseUser,
      validDto,
    );

    expect(prisma.vitals.update).toHaveBeenCalledWith({
      where: { id: vitalsId },
      data: expect.objectContaining({
        status: 'ENTERED_IN_ERROR',
        errorReason: validDto.reason,
        errorById: userId,
      }),
    });

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKey: 'VITALS_ENTERED_IN_ERROR',
        recordType: 'Vitals',
        recordId: vitalsId,
        newValues: {
          status: 'ENTERED_IN_ERROR',
          reason: validDto.reason,
        },
      }),
      expect.anything(),
      branchId,
    );
  });

  it('should reject if vitals not found', async () => {
    prisma.vitals.findFirst.mockResolvedValue(null);

    await expect(
      service.markVitalsEnteredInError(
        patientId,
        vitalsId,
        tenantId,
        nurseUser,
        validDto,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject if patientId mismatch', async () => {
    prisma.vitals.findFirst.mockResolvedValue(
      mockVitals({ encounter: { patientId: 'wrong-patient' } }),
    );

    await expect(
      service.markVitalsEnteredInError(
        patientId,
        vitalsId,
        tenantId,
        nurseUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject if vitals already in error', async () => {
    prisma.vitals.findFirst.mockResolvedValue(
      mockVitals({ status: 'ENTERED_IN_ERROR' }),
    );

    await expect(
      service.markVitalsEnteredInError(
        patientId,
        vitalsId,
        tenantId,
        nurseUser,
        validDto,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject cross-branch correction', async () => {
    prisma.vitals.findFirst.mockResolvedValue(
      mockVitals({ encounter: { branchId: otherBranchId, patientId } }),
    );

    await expect(
      service.markVitalsEnteredInError(
        patientId,
        tenantId,
        vitalsId,
        nurseUser,
        validDto,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow Super Admin to mark error across branches', async () => {
    prisma.vitals.findFirst.mockResolvedValue(
      mockVitals({ encounter: { branchId: otherBranchId, patientId } }),
    );
    prisma.vitals.update.mockResolvedValue({
      ...mockVitals(),
      status: 'ENTERED_IN_ERROR',
    });

    await service.markVitalsEnteredInError(
      patientId,
      vitalsId,
      tenantId,
      superAdminUser,
      validDto,
    );

    expect(prisma.vitals.update).toHaveBeenCalled();
  });
});
