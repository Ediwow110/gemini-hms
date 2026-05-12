import { Test, TestingModule } from '@nestjs/testing';
import { LabService } from './lab.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('LabService Branch Isolation', () => {
  let service: LabService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabService,
        {
          provide: PrismaService,
          useValue: {
            labResult: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: ApprovalsService,
          useValue: {
            createRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LabService>(LabService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const tenantId = 'tenant-123';
  const branchId = 'branch-456';
  const otherBranchId = 'branch-789';
  const labResultId = 'lab-result-123';

  describe('findOne', () => {
    it('should scope by tenantId and branchId', async () => {
      prisma.labResult.findFirst.mockResolvedValue({ id: labResultId });

      await service.findOne(tenantId, branchId, labResultId);

      expect(prisma.labResult.findFirst).toHaveBeenCalledWith({
        where: {
          id: labResultId,
          order: { tenantId, branchId },
        },
        include: expect.anything(),
      });
    });

    it('should throw NotFoundException if result does not belong to branch', async () => {
      prisma.labResult.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(tenantId, otherBranchId, labResultId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPendingWorklist', () => {
    it('should scope by tenantId and branchId', async () => {
      prisma.labResult.findMany.mockResolvedValue([]);

      await service.getPendingWorklist(tenantId, branchId);

      expect(prisma.labResult.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          order: { tenantId, branchId },
        }),
        include: expect.anything(),
        orderBy: expect.anything(),
      });
    });
  });

  describe('encodeResult', () => {
    it('should fail if lab result belongs to another branch', async () => {
      // findOne will be called and it will throw NotFoundException if branch mismatch
      prisma.labResult.findFirst.mockResolvedValue(null);

      await expect(
        service.encodeResult(tenantId, 'user-1', otherBranchId, labResultId, {
          results: 'any',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.labResult.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('approveResult', () => {
    it('should fail if lab result belongs to another branch', async () => {
      prisma.labResult.findFirst.mockResolvedValue(null);

      await expect(
        service.approveResult(tenantId, 'user-1', otherBranchId, labResultId, {
          pathologistRemarks: 'ok',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.labResult.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('releaseResult', () => {
    it('should fail if lab result belongs to another branch', async () => {
      prisma.labResult.findFirst.mockResolvedValue(null);

      await expect(
        service.releaseResult(tenantId, 'user-1', otherBranchId, labResultId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestAmendment', () => {
    it('should fail if lab result belongs to another branch', async () => {
      prisma.labResult.findFirst.mockResolvedValue(null);

      await expect(
        service.requestAmendment(
          tenantId,
          'user-1',
          otherBranchId,
          labResultId,
          {
            reason: 'error',
          },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
