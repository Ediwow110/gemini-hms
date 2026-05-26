import { Test, TestingModule } from '@nestjs/testing';
import { LabService } from './lab.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('LabService — Phase 4D additions', () => {
  let service: LabService;
  let prisma: any;
  let audit: any;
  let approvals: any;

  const mockTenantId = 'tenant-1';
  const mockBranchId = 'branch-1';
  const mockUserId = 'user-1';
  const mockOrderId = 'order-1';
  const mockPatientId = 'patient-1';
  const mockSpecimenId = 'specimen-1';
  const mockResultId = 'result-1';

  const mockSpecimen = {
    id: mockSpecimenId,
    tenantId: mockTenantId,
    branchId: mockBranchId,
    patientId: mockPatientId,
    orderId: mockOrderId,
    specimenType: 'Whole Blood',
    collectionMode: 'ROUTINE',
    collectedAt: new Date(),
    status: 'COLLECTED',
    receivedAt: null,
    receivedById: null,
    createdAt: new Date(),
    order: {
      orderNumber: 'ORD-001',
      patient: { id: mockPatientId, firstName: 'John', lastName: 'Doe', patientNumber: 'MRN-001' },
      clinicalItems: [{ itemName: 'CBC' }],
    },
  };

  const mockResult = {
    id: mockResultId,
    orderId: mockOrderId,
    tenantId: mockTenantId,
    status: 'APPROVED',
    encodedById: mockUserId,
    encodedAt: new Date(),
    validatedById: 'validator-1',
    validatedAt: new Date(),
    results: { WBC: 7.5 },
    remarks: 'Normal',
    createdAt: new Date(),
    order: {
      orderNumber: 'ORD-001',
      patient: { id: mockPatientId, firstName: 'John', lastName: 'Doe', patientNumber: 'MRN-001' },
      clinicalItems: [{ itemName: 'CBC' }],
    },
  };

  beforeEach(async () => {
    prisma = {
      labSpecimen: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      labResult: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      labResultSignature: { create: jest.fn() },
      labResultVersion: { count: jest.fn(), create: jest.fn() },
      notificationOutbox: { create: jest.fn() },
      order: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };

    audit = { log: jest.fn() };
    approvals = { createRequest: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: ApprovalsService, useValue: approvals },
      ],
    }).compile();

    service = module.get<LabService>(LabService);
  });

  describe('getPendingSpecimens', () => {
    it('should return pending specimens', async () => {
      prisma.labSpecimen.findMany.mockResolvedValue([mockSpecimen]);
      prisma.labResult.findMany.mockResolvedValue([]);
      const result = await service.getPendingSpecimens(mockTenantId, mockBranchId);
      expect(result).toHaveLength(1);
      expect(result[0].patientName).toBe('John Doe');
      expect(result[0].status).toBe('COLLECTED');
    });

    it('should include orders awaiting collection', async () => {
      prisma.labSpecimen.findMany.mockResolvedValue([]);
      prisma.labResult.findMany.mockResolvedValue([{
        ...mockResult,
        orderId: mockOrderId,
        order: {
          orderNumber: 'ORD-002',
          patient: { id: mockPatientId, firstName: 'Jane', lastName: 'Smith', patientNumber: 'MRN-002' },
          clinicalItems: [{ itemName: 'BMP' }],
        },
      }]);
      const result = await service.getPendingSpecimens(mockTenantId, mockBranchId);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('PENDING_COLLECTION');
    });
  });

  describe('receiveSpecimen', () => {
    it('should receive an existing collected specimen', async () => {
      prisma.labSpecimen.findFirst.mockResolvedValue(mockSpecimen);
      prisma.labSpecimen.update.mockResolvedValue({ ...mockSpecimen, status: 'RECEIVED' });
      prisma.$transaction.mockImplementation((cb: any) => cb(prisma));

      const result = await service.receiveSpecimen(mockTenantId, mockUserId, mockBranchId, mockSpecimenId);
      expect(prisma.labSpecimen.update).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'SPECIMEN_RECEIVED' }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('should throw ConflictException if already received', async () => {
      prisma.labSpecimen.findFirst.mockResolvedValue({ ...mockSpecimen, status: 'RECEIVED' });
      await expect(
        service.receiveSpecimen(mockTenantId, mockUserId, mockBranchId, mockSpecimenId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when no specimen or order found', async () => {
      prisma.labSpecimen.findFirst.mockResolvedValue(null);
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(
        service.receiveSpecimen(mockTenantId, mockUserId, mockBranchId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReleasableResults', () => {
    it('should return only APPROVED results', async () => {
      prisma.labResult.findMany.mockResolvedValue([mockResult]);
      const result = await service.getReleasableResults(mockTenantId, mockBranchId);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('APPROVED');
      expect(prisma.labResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
          }),
        }),
      );
    });

    it('should return empty array when no releasable results', async () => {
      prisma.labResult.findMany.mockResolvedValue([]);
      const result = await service.getReleasableResults(mockTenantId, mockBranchId);
      expect(result).toHaveLength(0);
    });
  });

  describe('releaseResult', () => {
    it('should release an APPROVED result', async () => {
      prisma.labResult.findFirst.mockResolvedValue(mockResult);
      prisma.labResult.update.mockResolvedValue({ ...mockResult, status: 'RELEASED', lockedAt: new Date() });
      prisma.labResultSignature.create.mockResolvedValue({ id: 'sig-1' });
      prisma.notificationOutbox.create.mockResolvedValue({});
      prisma.order.update.mockResolvedValue({});
      prisma.$transaction.mockImplementation((cb: any) => cb(prisma));

      const result = await service.releaseResult(mockTenantId, mockUserId, mockBranchId, mockResultId);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventKey: 'LAB_RESULT_RELEASED' }),
        expect.anything(),
        expect.anything(),
      );
      expect(prisma.labResultSignature.create).toHaveBeenCalled();
      expect(prisma.notificationOutbox.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if already released', async () => {
      prisma.labResult.findFirst.mockResolvedValue({ ...mockResult, status: 'RELEASED' });
      await expect(
        service.releaseResult(mockTenantId, mockUserId, mockBranchId, mockResultId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if not APPROVED', async () => {
      prisma.labResult.findFirst.mockResolvedValue({ ...mockResult, status: 'ENCODED' });
      await expect(
        service.releaseResult(mockTenantId, mockUserId, mockBranchId, mockResultId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCriticalResults', () => {
    it('should return critical results scoped to tenant/branch', async () => {
      const mockCritical = { ...mockResult, isCritical: true, criticalStatus: 'OPEN' };
      prisma.labResult.findMany.mockResolvedValue([mockCritical]);
      const result = await service.getCriticalResults(mockTenantId, mockBranchId);
      expect(result).toHaveLength(1);
      expect(result[0].isCritical).toBe(true);
      expect(result[0].criticalStatus).toBe('OPEN');
      expect(prisma.labResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isCritical: true,
            order: expect.objectContaining({ tenantId: mockTenantId, branchId: mockBranchId }),
          }),
        }),
      );
    });

    it('should filter by criticalStatus when provided', async () => {
      const mockCritical = { ...mockResult, isCritical: true, criticalStatus: 'ACKNOWLEDGED' };
      prisma.labResult.findMany.mockResolvedValue([mockCritical]);
      const result = await service.getCriticalResults(mockTenantId, mockBranchId, 'ACKNOWLEDGED');
      expect(result).toHaveLength(1);
      expect(result[0].criticalStatus).toBe('ACKNOWLEDGED');
    });

    it('should return empty array when no critical results', async () => {
      prisma.labResult.findMany.mockResolvedValue([]);
      const result = await service.getCriticalResults(mockTenantId, mockBranchId);
      expect(result).toHaveLength(0);
    });
  });

  describe('markResultAsCritical', () => {
    it('should mark an APPROVED result as critical', async () => {
      prisma.labResult.findFirst.mockResolvedValue(mockResult);
      prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
      prisma.notificationOutbox.create.mockResolvedValue({});
      prisma.labResult.findMany.mockResolvedValue([{ ...mockResult, isCritical: true, criticalStatus: 'OPEN' }]);

      const result = await service.markResultAsCritical(mockTenantId, mockUserId, mockBranchId, mockResultId);
      expect(prisma.labResult.updateMany).toHaveBeenCalled();
      expect(prisma.notificationOutbox.create).toHaveBeenCalled();
      expect(prisma.labResult.findMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException if result is not APPROVED or RELEASED', async () => {
      prisma.labResult.findFirst.mockResolvedValue({ ...mockResult, status: 'ENCODED' });
      await expect(
        service.markResultAsCritical(mockTenantId, mockUserId, mockBranchId, mockResultId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when result not found', async () => {
      prisma.labResult.findFirst.mockRejectedValue(new NotFoundException());
      await expect(
        service.markResultAsCritical(mockTenantId, mockUserId, mockBranchId, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('acknowledgeCriticalResult', () => {
    const criticalResult = { ...mockResult, isCritical: true, criticalStatus: 'OPEN' };

    it('should acknowledge an OPEN critical result', async () => {
      prisma.labResult.findFirst.mockResolvedValue(criticalResult);
      prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
      prisma.labResult.findMany.mockResolvedValue([{ ...criticalResult, criticalStatus: 'ACKNOWLEDGED' }]);

      const result = await service.acknowledgeCriticalResult(mockTenantId, mockUserId, mockBranchId, mockResultId);
      expect(prisma.labResult.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            criticalStatus: 'ACKNOWLEDGED',
            criticalAcknowledgedById: mockUserId,
          }),
        }),
      );
      expect(result[0].criticalStatus).toBe('ACKNOWLEDGED');
    });

    it('should throw BadRequestException if result is not critical', async () => {
      prisma.labResult.findFirst.mockResolvedValue({ ...mockResult, isCritical: false });
      await expect(
        service.acknowledgeCriticalResult(mockTenantId, mockUserId, mockBranchId, mockResultId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if already resolved', async () => {
      prisma.labResult.findFirst.mockResolvedValue({ ...criticalResult, criticalStatus: 'RESOLVED' });
      await expect(
        service.acknowledgeCriticalResult(mockTenantId, mockUserId, mockBranchId, mockResultId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('escalateCriticalResult', () => {
    const criticalResult = { ...mockResult, isCritical: true, criticalStatus: 'OPEN' };

    it('should escalate an OPEN critical result', async () => {
      prisma.labResult.findFirst.mockResolvedValue(criticalResult);
      prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
      prisma.labResult.findMany.mockResolvedValue([{ ...criticalResult, criticalStatus: 'ESCALATED' }]);

      const result = await service.escalateCriticalResult(mockTenantId, mockUserId, mockBranchId, mockResultId, 'Physician not reachable');
      expect(result[0].criticalStatus).toBe('ESCALATED');
    });

    it('should throw BadRequestException if result is not critical', async () => {
      prisma.labResult.findFirst.mockResolvedValue({ ...mockResult, isCritical: false });
      await expect(
        service.escalateCriticalResult(mockTenantId, mockUserId, mockBranchId, mockResultId, 'notes'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if already resolved', async () => {
      prisma.labResult.findFirst.mockResolvedValue({ ...criticalResult, criticalStatus: 'RESOLVED' });
      await expect(
        service.escalateCriticalResult(mockTenantId, mockUserId, mockBranchId, mockResultId, 'notes'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('resolveCriticalResult', () => {
    const criticalResult = { ...mockResult, isCritical: true, criticalStatus: 'ACKNOWLEDGED' };

    it('should resolve an ACKNOWLEDGED critical result', async () => {
      prisma.labResult.findFirst.mockResolvedValue(criticalResult);
      prisma.labResult.updateMany.mockResolvedValue({ count: 1 });
      prisma.labResult.findMany.mockResolvedValue([{ ...criticalResult, criticalStatus: 'RESOLVED' }]);

      const result = await service.resolveCriticalResult(mockTenantId, mockUserId, mockBranchId, mockResultId, 'Physician contacted, action taken');
      expect(result[0].criticalStatus).toBe('RESOLVED');
    });

    it('should throw BadRequestException if not critical', async () => {
      prisma.labResult.findFirst.mockResolvedValue({ ...mockResult, isCritical: false });
      await expect(
        service.resolveCriticalResult(mockTenantId, mockUserId, mockBranchId, mockResultId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
