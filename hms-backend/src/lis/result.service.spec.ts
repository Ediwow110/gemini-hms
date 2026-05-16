import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ResultService } from './result.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LabResultStatus, ResultFlag } from '@prisma/client';

describe('ResultService', () => {
  let service: ResultService;
  let prisma: any;
  let auditService: any;

  const tenantId = 'tenant-a';
  const userId = 'user-1';
  const branchId = 'branch-1';
  const resultId = 'result-1';
  const specimenId = 'specimen-1';

  const mockSpecimen = (overrides = {}) => ({
    id: specimenId,
    tenantId,
    status: 'RECEIVED',
    ...overrides,
  });

  const mockResult = (overrides = {}) => ({
    id: resultId,
    tenantId,
    branchId,
    specimenId,
    status: LabResultStatus.ENCODED,
    encodedById: 'encoder-1',
    approvedById: null,
    releasedById: null,
    remarks: null,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const encodeDto = {
    specimenId,
    items: [{ testName: 'CBC', value: 'Normal', flag: ResultFlag.NORMAL }],
    remarks: 'Initial encoding',
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
      specimen: { findFirst: jest.fn() },
      labResult: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      labResultItem: { deleteMany: jest.fn() },
      labResultVersion: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<ResultService>(ResultService);
  });

  describe('encodeResult', () => {
    it('should encode result transactionally with audit log', async () => {
      prisma.specimen.findFirst.mockResolvedValue(mockSpecimen());
      const created = mockResult({ status: LabResultStatus.ENCODED });
      prisma.labResult.create.mockResolvedValue(created);

      const result = await service.encodeResult(
        tenantId,
        userId,
        branchId,
        encodeDto,
      );

      expect(result.status).toBe('ENCODED');
      expect(prisma.labResult.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          branchId,
          specimenId,
          status: LabResultStatus.ENCODED,
          encodedById: userId,
        }),
        include: { items: true },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'RESULT_ENCODED' }),
        expect.objectContaining({ labResult: prisma.labResult }),
        branchId,
      );
    });

    it('should throw NotFoundException for cross-tenant specimen', async () => {
      prisma.specimen.findFirst.mockResolvedValue(null);
      await expect(
        service.encodeResult(tenantId, userId, branchId, encodeDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should rollback if audit logging fails', async () => {
      prisma.specimen.findFirst.mockResolvedValue(mockSpecimen());
      prisma.labResult.create.mockResolvedValue(mockResult());
      auditService.log.mockRejectedValue(new Error('Audit failure'));

      await expect(
        service.encodeResult(tenantId, userId, branchId, encodeDto),
      ).rejects.toThrow('Audit failure');
    });
  });

  describe('transitionStatus', () => {
    it('should transition ENCODED -> VALIDATED', async () => {
      prisma.labResult.findFirst.mockResolvedValue(mockResult());
      const updated = mockResult({ status: LabResultStatus.VALIDATED });
      prisma.labResult.update.mockResolvedValue(updated);

      const result = await service.transitionStatus(
        tenantId,
        userId,
        branchId,
        resultId,
        LabResultStatus.VALIDATED,
        'RESULT_VALIDATED',
      );

      expect(result.status).toBe('VALIDATED');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'RESULT_VALIDATED' }),
        expect.anything(),
        branchId,
      );
    });

    it('should throw ConflictException for invalid transition ENCODED -> RELEASED', async () => {
      prisma.labResult.findFirst.mockResolvedValue(mockResult());

      await expect(
        service.transitionStatus(
          tenantId,
          userId,
          branchId,
          resultId,
          LabResultStatus.RELEASED,
          'RESULT_RELEASED',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException for self-approval', async () => {
      prisma.labResult.findFirst.mockResolvedValue(
        mockResult({ status: LabResultStatus.VALIDATED, encodedById: userId }),
      );

      await expect(
        service.transitionStatus(
          tenantId,
          userId,
          branchId,
          resultId,
          LabResultStatus.APPROVED,
          'RESULT_APPROVED',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should rollback if audit logging fails', async () => {
      prisma.labResult.findFirst.mockResolvedValue(mockResult());
      prisma.labResult.update.mockResolvedValue(
        mockResult({ status: LabResultStatus.VALIDATED }),
      );
      auditService.log.mockRejectedValue(new Error('Audit failure'));

      await expect(
        service.transitionStatus(
          tenantId,
          userId,
          branchId,
          resultId,
          LabResultStatus.VALIDATED,
          'RESULT_VALIDATED',
        ),
      ).rejects.toThrow('Audit failure');
    });
  });

  describe('amendResult', () => {
    it('should create version and transition RELEASED -> AMENDED', async () => {
      prisma.labResult.findFirst.mockResolvedValue(
        mockResult({ status: LabResultStatus.RELEASED }),
      );
      const updated = mockResult({ status: LabResultStatus.AMENDED });
      prisma.labResult.update.mockResolvedValue(updated);

      const amendDto = {
        items: [{ testName: 'CBC', value: 'High', flag: ResultFlag.ABNORMAL }],
        reasonForAmendment: 'Incorrect value',
        remarks: 'Corrected',
      };

      const result = await service.amendResult(
        tenantId,
        userId,
        branchId,
        resultId,
        amendDto,
      );

      expect(result.status).toBe('AMENDED');
      expect(prisma.labResultVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          labResultId: resultId,
          version: 1,
          reasonForAmendment: amendDto.reasonForAmendment,
        }),
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'RESULT_AMENDED' }),
        expect.anything(),
        branchId,
      );
    });

    it('should throw ConflictException if result is not RELEASED', async () => {
      prisma.labResult.findFirst.mockResolvedValue(
        mockResult({ status: LabResultStatus.ENCODED }),
      );
      const amendDto = {
        items: [{ testName: 'CBC', value: 'Normal' }],
        reasonForAmendment: 'Test',
      };

      await expect(
        service.amendResult(tenantId, userId, branchId, resultId, amendDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should rollback if audit logging fails during amendment', async () => {
      prisma.labResult.findFirst.mockResolvedValue(
        mockResult({ status: LabResultStatus.RELEASED }),
      );
      prisma.labResult.update.mockResolvedValue(
        mockResult({ status: LabResultStatus.AMENDED }),
      );
      auditService.log.mockRejectedValue(new Error('Audit failure'));

      const amendDto = {
        items: [{ testName: 'CBC', value: 'Normal' }],
        reasonForAmendment: 'Test',
      };

      await expect(
        service.amendResult(tenantId, userId, branchId, resultId, amendDto),
      ).rejects.toThrow('Audit failure');
    });
  });
});
