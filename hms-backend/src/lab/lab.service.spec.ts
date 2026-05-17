import { Test, TestingModule } from '@nestjs/testing';
import { LabService } from './lab.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('LabService Branch Isolation', () => {
  let service: LabService;
  let prisma: any;

  beforeEach(async () => {
    const prismaMock = {
      labResult: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      labResultSignature: {
        create: jest.fn(),
      },
      order: {
        update: jest.fn(),
      },
      notificationOutbox: {
        create: jest.fn(),
      },
    };
    prismaMock.$transaction = jest.fn().mockImplementation(async (cb) => await cb(prismaMock));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabService,
        {
          provide: PrismaService,
          useValue: prismaMock,
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
          deletedAt: null,
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
          results: { hemoglobin: 14 },
        }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.labResult.updateMany).not.toHaveBeenCalled();
    });

    it('should persist results and remarks in the LabResult record', async () => {
      const mockResult = { id: labResultId, status: 'PENDING_COLLECTION' };
      prisma.labResult.findFirst
        .mockResolvedValueOnce(mockResult) // findOne
        .mockResolvedValueOnce({ ...mockResult, status: 'ENCODED' }); // updated

      prisma.labResult.updateMany.mockResolvedValue({ count: 1 });

      const dto = { results: { glucose: 100 }, remarks: 'Normal' };
      await service.encodeResult(
        tenantId,
        'user-1',
        branchId,
        labResultId,
        dto,
      );

      expect(prisma.labResult.updateMany).toHaveBeenCalledWith({
        where: expect.anything(),
        data: expect.objectContaining({
          status: 'ENCODED',
          results: dto.results,
          remarks: dto.remarks,
        }),
      });
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

    it('should release an approved result with signature and outbox', async () => {
      const mockResult = {
        id: labResultId,
        status: 'APPROVED',
        orderId: 'order-1',
        order: { tenantId, branchId, patientId: 'patient-1' },
        lockedAt: new Date(),
      };
      prisma.labResult.findFirst.mockResolvedValue(mockResult);
      prisma.labResult.update.mockResolvedValue({
        ...mockResult,
        status: 'RELEASED',
      });
      prisma.labResultSignature.create.mockResolvedValue({ id: 'sig-1' });
      prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'RELEASED' });
      prisma.notificationOutbox.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.releaseResult(tenantId, 'user-1', branchId, labResultId);

      expect(result.status).toBe('RELEASED');
      expect(prisma.labResult.update).toHaveBeenCalled();
      expect(prisma.labResultSignature.create).toHaveBeenCalled();
      expect(prisma.notificationOutbox.create).toHaveBeenCalled();
    });

    it('should reject release if already RELEASED', async () => {
      prisma.labResult.findFirst.mockResolvedValue({
        id: labResultId,
        status: 'RELEASED',
        order: { tenantId, branchId },
      });

      await expect(
        service.releaseResult(tenantId, 'user-1', branchId, labResultId),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject release if not APPROVED', async () => {
      prisma.labResult.findFirst.mockResolvedValue({
        id: labResultId,
        status: 'PENDING',
        order: { tenantId, branchId },
      });

      await expect(
        service.releaseResult(tenantId, 'user-1', branchId, labResultId),
      ).rejects.toThrow(BadRequestException);
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
