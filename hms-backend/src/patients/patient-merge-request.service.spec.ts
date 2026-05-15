import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PatientMergeRequestService } from './patient-merge-request.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatientMergeRequestDto } from './dto/patient-merge.dto';
import { Prisma } from '@prisma/client';

describe('PatientMergeRequestService', () => {
  let service: PatientMergeRequestService;
  let prisma: any;
  let auditService: any;

  // Test fixtures
  const tenantId = 'tenant-uuid-1';
  const otherTenantId = 'tenant-uuid-2';
  const userId = 'user-uuid-1';
  const approverId = 'user-uuid-2';
  const sourcePatientId = 'patient-uuid-1';
  const targetPatientId = 'patient-uuid-2';
  const mergeRequestId = 'merge-request-uuid-1';
  const branchId = 'branch-uuid-1';

  const mockActivePatient = (id: string, tenantId: string) => ({
    id,
    tenantId,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    status: 'ACTIVE',
    createdAt: new Date(),
  });

  const mockInactivePatient = (id: string, tenantId: string) => ({
    ...mockActivePatient(id, tenantId),
    status: 'INACTIVE',
  });

  const mockMergeRequest = (overrides = {}) => ({
    id: mergeRequestId,
    tenantId,
    branchId,
    requesterId: userId,
    sourcePatientId,
    targetPatientId,
    status: 'PENDING',
    reason: 'Duplicate patient found during registration',
    remarks: null,
    approverId: null,
    createdAt: new Date('2026-05-13T10:00:00Z'),
    updatedAt: new Date('2026-05-13T10:00:00Z'),
    ...overrides,
  });

  beforeEach(async () => {
    // Mock Prisma Service
    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(prisma)),
      patient: {
        findFirst: jest.fn(),
      },
      patientMergeRequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    // Mock Audit Service
    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientMergeRequestService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<PatientMergeRequestService>(
      PatientMergeRequestService,
    );
  });

  describe('createMergeRequest', () => {
    it('should create merge request with valid patients', async () => {
      const sourcePatient = mockActivePatient(sourcePatientId, tenantId);
      const targetPatient = mockActivePatient(targetPatientId, tenantId);
      const reason = 'Duplicate patient found during registration';
      const createDto = {
        sourcePatientId,
        targetPatientId,
        reason,
      };

      prisma.patient.findFirst
        .mockResolvedValueOnce(sourcePatient)
        .mockResolvedValueOnce(targetPatient);

      const createdRequest = mockMergeRequest({ reason });
      prisma.patientMergeRequest.create.mockResolvedValue(createdRequest);

      const result = await service.createMergeRequest(
        tenantId,
        userId,
        branchId,
        createDto,
      );

      expect(result.status).toBe('PENDING');
      expect(result.sourcePatientId).toBe(sourcePatientId);
      expect(result.targetPatientId).toBe(targetPatientId);
      expect(result.reason).toBe(reason);
      expect(result.requesterId).toBe(userId);

      expect(prisma.patientMergeRequest.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          branchId,
          requesterId: userId,
          sourcePatientId,
          targetPatientId,
          status: 'PENDING',
          reason,
        },
      });

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'PATIENT_MERGE_REQUESTED',
          recordType: 'PatientMergeRequest',
          tenantId,
          userId,
          newValues: expect.objectContaining({
            status: 'PENDING',
            sourcePatientId,
            targetPatientId,
          }),
        }),
        expect.objectContaining({
          patient: prisma.patient,
          patientMergeRequest: prisma.patientMergeRequest,
        }),
        branchId,
      );

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }),
      );
    });

    it('should throw ConflictException if a pending merge request already exists for these patients', async () => {
      const sourcePatient = mockActivePatient(sourcePatientId, tenantId);
      const targetPatient = mockActivePatient(targetPatientId, tenantId);

      prisma.patient.findFirst
        .mockResolvedValueOnce(sourcePatient)
        .mockResolvedValueOnce(targetPatient);

      // Simulate existing pending request
      prisma.patientMergeRequest.findFirst.mockResolvedValue({
        id: 'existing-req-id',
        status: 'PENDING',
      });

      const createDto: CreatePatientMergeRequestDto = {
        sourcePatientId,
        targetPatientId,
        reason: 'duplicate test',
      };

      await expect(
        service.createMergeRequest(tenantId, userId, branchId, createDto),
      ).rejects.toThrow(
        'A pending merge request already exists for these patients',
      );

      expect(prisma.patientMergeRequest.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId,
          status: 'PENDING',
          OR: [
            { sourcePatientId, targetPatientId },
            {
              sourcePatientId: targetPatientId,
              targetPatientId: sourcePatientId,
            },
          ],
        },
      });
      expect(prisma.patientMergeRequest.create).not.toHaveBeenCalled();
    });

    it('should block a reverse-direction pending merge request for the same pair', async () => {
      const sourcePatient = mockActivePatient(sourcePatientId, tenantId);
      const targetPatient = mockActivePatient(targetPatientId, tenantId);

      prisma.patient.findFirst
        .mockResolvedValueOnce(sourcePatient)
        .mockResolvedValueOnce(targetPatient);

      prisma.patientMergeRequest.findFirst.mockResolvedValue({
        id: 'existing-req-id',
        sourcePatientId: targetPatientId,
        targetPatientId: sourcePatientId,
        status: 'PENDING',
      });

      const createDto: CreatePatientMergeRequestDto = {
        sourcePatientId,
        targetPatientId,
        reason: 'duplicate test',
      };

      await expect(
        service.createMergeRequest(tenantId, userId, branchId, createDto),
      ).rejects.toThrow(
        'A pending merge request already exists for these patients',
      );

      expect(prisma.patientMergeRequest.create).not.toHaveBeenCalled();
    });

    it('should block a pending merge request when creating the reverse direction', async () => {
      const sourcePatient = mockActivePatient(targetPatientId, tenantId);
      const targetPatient = mockActivePatient(sourcePatientId, tenantId);

      prisma.patient.findFirst
        .mockResolvedValueOnce(sourcePatient)
        .mockResolvedValueOnce(targetPatient);

      prisma.patientMergeRequest.findFirst.mockResolvedValue({
        id: 'existing-req-id',
        sourcePatientId,
        targetPatientId,
        status: 'PENDING',
      });

      const createDto: CreatePatientMergeRequestDto = {
        sourcePatientId: targetPatientId,
        targetPatientId: sourcePatientId,
        reason: 'duplicate test',
      };

      await expect(
        service.createMergeRequest(tenantId, userId, branchId, createDto),
      ).rejects.toThrow(
        'A pending merge request already exists for these patients',
      );

      expect(prisma.patientMergeRequest.create).not.toHaveBeenCalled();
    });

    it('should allow a new request when the reverse-direction request is terminal', async () => {
      const sourcePatient = mockActivePatient(sourcePatientId, tenantId);
      const targetPatient = mockActivePatient(targetPatientId, tenantId);
      const createDto: CreatePatientMergeRequestDto = {
        sourcePatientId,
        targetPatientId,
        reason: 'duplicate test',
      };

      prisma.patient.findFirst
        .mockResolvedValueOnce(sourcePatient)
        .mockResolvedValueOnce(targetPatient);
      prisma.patientMergeRequest.findFirst.mockResolvedValue(null);
      prisma.patientMergeRequest.create.mockResolvedValue(mockMergeRequest());

      const result = await service.createMergeRequest(
        tenantId,
        userId,
        branchId,
        createDto,
      );

      expect(result.status).toBe('PENDING');
      expect(prisma.patientMergeRequest.create).toHaveBeenCalled();
    });

    it('should translate serializable transaction conflicts to ConflictException', async () => {
      prisma.$transaction.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('transaction conflict', {
          clientVersion: 'test',
          code: 'P2034',
        }),
      );

      const createDto: CreatePatientMergeRequestDto = {
        sourcePatientId,
        targetPatientId,
        reason: 'duplicate test',
      };

      await expect(
        service.createMergeRequest(tenantId, userId, branchId, createDto),
      ).rejects.toThrow(
        'A pending merge request is already being created for these patients',
      );

      expect(prisma.patientMergeRequest.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should prevent merge when source and target are same', async () => {
      const createDto = {
        sourcePatientId,
        targetPatientId: sourcePatientId, // Same as source
        reason: 'Duplicate found',
      };

      await expect(
        service.createMergeRequest(tenantId, userId, branchId, createDto),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.patient.findFirst).not.toHaveBeenCalled();
      expect(prisma.patientMergeRequest.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should prevent merge when source patient not found', async () => {
      const targetPatient = mockActivePatient(targetPatientId, tenantId);
      const createDto = {
        sourcePatientId,
        targetPatientId,
        reason: 'Duplicate found',
      };

      prisma.patient.findFirst
        .mockResolvedValueOnce(null) // source not found
        .mockResolvedValueOnce(targetPatient);

      await expect(
        service.createMergeRequest(tenantId, userId, branchId, createDto),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.patientMergeRequest.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should prevent merge when target patient not found', async () => {
      const sourcePatient = mockActivePatient(sourcePatientId, tenantId);
      const createDto = {
        sourcePatientId,
        targetPatientId,
        reason: 'Duplicate found',
      };

      prisma.patient.findFirst
        .mockResolvedValueOnce(sourcePatient)
        .mockResolvedValueOnce(null); // target not found

      await expect(
        service.createMergeRequest(tenantId, userId, branchId, createDto),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.patientMergeRequest.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should prevent merge when patients in different tenants', async () => {
      const sourcePatient = mockActivePatient(sourcePatientId, tenantId);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _targetPatient = mockActivePatient(targetPatientId, otherTenantId);
      const createDto = {
        sourcePatientId,
        targetPatientId,
        reason: 'Duplicate found',
      };

      prisma.patient.findFirst
        .mockResolvedValueOnce(sourcePatient)
        .mockResolvedValueOnce(null); // target not found for this tenant

      await expect(
        service.createMergeRequest(tenantId, userId, branchId, createDto),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.patientMergeRequest.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should prevent merge when source patient is INACTIVE', async () => {
      const sourcePatient = mockInactivePatient(sourcePatientId, tenantId);
      const targetPatient = mockActivePatient(targetPatientId, tenantId);
      const createDto = {
        sourcePatientId,
        targetPatientId,
        reason: 'Duplicate found',
      };

      prisma.patient.findFirst
        .mockResolvedValueOnce(sourcePatient)
        .mockResolvedValueOnce(targetPatient);

      await expect(
        service.createMergeRequest(tenantId, userId, branchId, createDto),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.patientMergeRequest.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should prevent merge when target patient is INACTIVE', async () => {
      const sourcePatient = mockActivePatient(sourcePatientId, tenantId);
      const targetPatient = mockInactivePatient(targetPatientId, tenantId);
      const createDto = {
        sourcePatientId,
        targetPatientId,
        reason: 'Duplicate found',
      };

      prisma.patient.findFirst
        .mockResolvedValueOnce(sourcePatient)
        .mockResolvedValueOnce(targetPatient);

      await expect(
        service.createMergeRequest(tenantId, userId, branchId, createDto),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.patientMergeRequest.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should store reason in merge request', async () => {
      const sourcePatient = mockActivePatient(sourcePatientId, tenantId);
      const targetPatient = mockActivePatient(targetPatientId, tenantId);
      const reason = 'Duplicate found during registration';
      const createDto = {
        sourcePatientId,
        targetPatientId,
        reason,
      };

      prisma.patient.findFirst
        .mockResolvedValueOnce(sourcePatient)
        .mockResolvedValueOnce(targetPatient);

      const createdRequest = mockMergeRequest({ reason });
      prisma.patientMergeRequest.create.mockResolvedValue(createdRequest);

      const result = await service.createMergeRequest(
        tenantId,
        userId,
        branchId,
        createDto,
      );

      expect(result.reason).toBe(reason);
    });
  });

  describe('approveMergeRequest', () => {
    it('should approve PENDING merge request transactionally', async () => {
      const pendingRequest = mockMergeRequest({ status: 'PENDING' });
      const approveDto = { remarks: 'Approved - Records consolidated' };
      const approvedRequest = mockMergeRequest({
        status: 'APPROVED',
        approverId,
        remarks: approveDto.remarks,
      });

      prisma.patientMergeRequest.findFirst.mockResolvedValue(pendingRequest);
      prisma.patientMergeRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.patientMergeRequest.findUnique.mockResolvedValue(approvedRequest);

      const result = await service.approveMergeRequest(
        tenantId,
        approverId,
        mergeRequestId,
        approveDto,
      );

      expect(result.status).toBe('APPROVED');
      expect(result.approverId).toBe(approverId);
      expect(result.remarks).toBe(approveDto.remarks);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.patientMergeRequest.updateMany).toHaveBeenCalledWith({
        where: { id: mergeRequestId, tenantId, status: 'PENDING' },
        data: expect.objectContaining({
          status: 'APPROVED',
          approverId,
          remarks: approveDto.remarks,
        }),
      });

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'PATIENT_MERGE_APPROVED',
          recordType: 'PatientMergeRequest',
          tenantId,
          userId: approverId,
          recordId: mergeRequestId,
          newValues: expect.objectContaining({
            status: 'APPROVED',
            approverId,
          }),
        }),
        prisma,
      );
    });

    it('should rollback if audit logging fails during approval', async () => {
      const pendingRequest = mockMergeRequest({ status: 'PENDING' });
      prisma.patientMergeRequest.findFirst.mockResolvedValue(pendingRequest);
      prisma.patientMergeRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.patientMergeRequest.findUnique.mockResolvedValue({
        ...pendingRequest,
        status: 'APPROVED',
      });

      auditService.log.mockRejectedValue(new Error('Audit failure'));

      await expect(
        service.approveMergeRequest(tenantId, approverId, mergeRequestId, {
          remarks: 'Approved',
        }),
      ).rejects.toThrow('Audit failure');
    });

    it('should prevent self-approval', async () => {
      const pendingRequest = mockMergeRequest({
        status: 'PENDING',
        requesterId: userId,
      });

      prisma.patientMergeRequest.findFirst.mockResolvedValue(pendingRequest);

      const approveDto = { remarks: 'Approved' };

      await expect(
        service.approveMergeRequest(
          tenantId,
          userId, // Same as requester
          mergeRequestId,
          approveDto,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.patientMergeRequest.updateMany).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should prevent approval when request not PENDING', async () => {
      const rejectedRequest = mockMergeRequest({
        status: 'REJECTED',
        requesterId: userId,
      });

      prisma.patientMergeRequest.findFirst.mockResolvedValue(rejectedRequest);

      const approveDto = { remarks: 'Approved' };

      await expect(
        service.approveMergeRequest(
          tenantId,
          approverId,
          mergeRequestId,
          approveDto,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.patientMergeRequest.updateMany).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should fail if request was modified between check and update', async () => {
      const pendingRequest = mockMergeRequest({ status: 'PENDING' });
      prisma.patientMergeRequest.findFirst.mockResolvedValue(pendingRequest);
      // Simulate race condition: updateMany finds 0 records because status is no longer PENDING
      prisma.patientMergeRequest.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.approveMergeRequest(tenantId, approverId, mergeRequestId, {
          remarks: 'Approved',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectMergeRequest', () => {
    it('should reject PENDING merge request transactionally', async () => {
      const pendingRequest = mockMergeRequest({ status: 'PENDING' });
      const rejectDto = { reason: 'Not a duplicate - insufficient evidence' };
      const rejectedRequest = mockMergeRequest({
        status: 'REJECTED',
        approverId,
        remarks: rejectDto.reason,
      });

      prisma.patientMergeRequest.findFirst.mockResolvedValue(pendingRequest);
      prisma.patientMergeRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.patientMergeRequest.findUnique.mockResolvedValue(rejectedRequest);

      const result = await service.rejectMergeRequest(
        tenantId,
        approverId,
        mergeRequestId,
        rejectDto,
      );

      expect(result.status).toBe('REJECTED');
      expect(result.approverId).toBe(approverId);
      expect(result.remarks).toBe(rejectDto.reason);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.patientMergeRequest.updateMany).toHaveBeenCalledWith({
        where: { id: mergeRequestId, tenantId, status: 'PENDING' },
        data: expect.objectContaining({
          status: 'REJECTED',
          approverId,
          remarks: rejectDto.reason,
        }),
      });

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'PATIENT_MERGE_REJECTED',
          recordType: 'PatientMergeRequest',
          tenantId,
          userId: approverId,
          recordId: mergeRequestId,
          newValues: expect.objectContaining({
            status: 'REJECTED',
            approverId,
          }),
        }),
        prisma,
      );
    });

    it('should rollback if audit logging fails during rejection', async () => {
      const pendingRequest = mockMergeRequest({ status: 'PENDING' });
      prisma.patientMergeRequest.findFirst.mockResolvedValue(pendingRequest);
      prisma.patientMergeRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.patientMergeRequest.findUnique.mockResolvedValue({
        ...pendingRequest,
        status: 'REJECTED',
      });

      auditService.log.mockRejectedValue(new Error('Audit failure'));

      await expect(
        service.rejectMergeRequest(tenantId, approverId, mergeRequestId, {
          reason: 'Reject',
        }),
      ).rejects.toThrow('Audit failure');
    });

    it('should prevent self-rejection', async () => {
      const pendingRequest = mockMergeRequest({
        status: 'PENDING',
        requesterId: userId,
      });

      prisma.patientMergeRequest.findFirst.mockResolvedValue(pendingRequest);

      const rejectDto = { reason: 'Not a duplicate' };

      await expect(
        service.rejectMergeRequest(
          tenantId,
          userId, // Same as requester
          mergeRequestId,
          rejectDto,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.patientMergeRequest.updateMany).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should prevent rejection when request not PENDING', async () => {
      const approvedRequest = mockMergeRequest({
        status: 'APPROVED',
        requesterId: userId,
      });

      prisma.patientMergeRequest.findFirst.mockResolvedValue(approvedRequest);

      const rejectDto = { reason: 'Not a duplicate' };

      await expect(
        service.rejectMergeRequest(
          tenantId,
          approverId,
          mergeRequestId,
          rejectDto,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.patientMergeRequest.updateMany).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('getMergeRequest', () => {
    it('should return merge request by ID', async () => {
      const request = mockMergeRequest();
      prisma.patientMergeRequest.findFirst.mockResolvedValue(request);

      const result = await service.getMergeRequest(tenantId, mergeRequestId);

      expect(result).toEqual(request);
      expect(result.id).toBe(mergeRequestId);
      expect(result.sourcePatientId).toBe(sourcePatientId);
      expect(result.targetPatientId).toBe(targetPatientId);

      expect(prisma.patientMergeRequest.findFirst).toHaveBeenCalledWith({
        where: { id: mergeRequestId, tenantId },
      });
    });

    it('should enforce tenant scope', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _request = mockMergeRequest({ tenantId: otherTenantId });
      prisma.patientMergeRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.getMergeRequest(tenantId, mergeRequestId),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.patientMergeRequest.findFirst).toHaveBeenCalledWith({
        where: { id: mergeRequestId, tenantId },
      });
    });

    it('should throw for non-existent request', async () => {
      prisma.patientMergeRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.getMergeRequest(tenantId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listMergeRequests', () => {
    it('should list all merge requests for tenant', async () => {
      const requests = [
        mockMergeRequest({ id: 'req-1' }),
        mockMergeRequest({ id: 'req-2' }),
        mockMergeRequest({ id: 'req-3' }),
      ];

      prisma.patientMergeRequest.findMany.mockResolvedValue(requests);
      prisma.patientMergeRequest.count.mockResolvedValue(3);

      const result = await service.listMergeRequests(tenantId, {});

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);

      expect(prisma.patientMergeRequest.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status', async () => {
      const pendingRequests = [
        mockMergeRequest({ id: 'req-1', status: 'PENDING' }),
        mockMergeRequest({ id: 'req-2', status: 'PENDING' }),
      ];

      prisma.patientMergeRequest.findMany.mockResolvedValue(pendingRequests);
      prisma.patientMergeRequest.count.mockResolvedValue(2);

      const result = await service.listMergeRequests(tenantId, {
        status: 'PENDING',
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0].status).toBe('PENDING');
      expect(result.data[1].status).toBe('PENDING');

      expect(prisma.patientMergeRequest.findMany).toHaveBeenCalledWith({
        where: { tenantId, status: 'PENDING' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should support pagination', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        mockMergeRequest({ id: `req-${i}` }),
      );

      // First page
      prisma.patientMergeRequest.findMany.mockResolvedValueOnce(
        requests.slice(0, 5),
      );
      prisma.patientMergeRequest.count.mockResolvedValueOnce(10);

      const page1 = await service.listMergeRequests(tenantId, {
        skip: 0,
        take: 5,
      });

      expect(page1.data).toHaveLength(5);
      expect(page1.total).toBe(10);

      // Second page
      prisma.patientMergeRequest.findMany.mockResolvedValueOnce(
        requests.slice(5, 10),
      );
      prisma.patientMergeRequest.count.mockResolvedValueOnce(10);

      const page2 = await service.listMergeRequests(tenantId, {
        skip: 5,
        take: 5,
      });

      expect(page2.data).toHaveLength(5);
      expect(page2.total).toBe(10);

      expect(prisma.patientMergeRequest.findMany).toHaveBeenNthCalledWith(1, {
        where: { tenantId },
        skip: 0,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      expect(prisma.patientMergeRequest.findMany).toHaveBeenNthCalledWith(2, {
        where: { tenantId },
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should order by createdAt DESC', async () => {
      const createdAtA = new Date('2026-05-13T10:00:00Z');
      const createdAtB = new Date('2026-05-13T11:00:00Z');
      const createdAtC = new Date('2026-05-13T12:00:00Z');

      const requests = [
        mockMergeRequest({ id: 'req-c', createdAt: createdAtC }),
        mockMergeRequest({ id: 'req-b', createdAt: createdAtB }),
        mockMergeRequest({ id: 'req-a', createdAt: createdAtA }),
      ];

      prisma.patientMergeRequest.findMany.mockResolvedValue(requests);
      prisma.patientMergeRequest.count.mockResolvedValue(3);

      const result = await service.listMergeRequests(tenantId, {});

      expect(result.data[0].id).toBe('req-c'); // Most recent
      expect(result.data[1].id).toBe('req-b');
      expect(result.data[2].id).toBe('req-a'); // Oldest

      expect(prisma.patientMergeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should return total count', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        mockMergeRequest({ id: `req-${i}` }),
      );

      prisma.patientMergeRequest.findMany.mockResolvedValue(requests);
      prisma.patientMergeRequest.count.mockResolvedValue(10);

      const result = await service.listMergeRequests(tenantId, {
        take: 10,
      });

      expect(result.total).toBe(10);
    });
  });

  describe('No destructive operations', () => {
    it('should not delete patient records on approval', async () => {
      const pendingRequest = mockMergeRequest();
      const approvedRequest = mockMergeRequest({
        status: 'APPROVED',
        approverId,
      });

      prisma.patientMergeRequest.findFirst.mockResolvedValue(pendingRequest);
      prisma.patientMergeRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.patientMergeRequest.findUnique.mockResolvedValue(approvedRequest);

      await service.approveMergeRequest(tenantId, approverId, mergeRequestId, {
        remarks: 'Approved',
      });

      // Verify no patient deletion occurred
      expect(prisma.patient.findFirst).not.toHaveBeenCalled();
      expect(prisma.patient.deleteMany).not.toBeDefined();
      expect(prisma.patient.delete).not.toBeDefined();
    });

    it('should not modify patient data during merge request creation', async () => {
      const sourcePatient = mockActivePatient(sourcePatientId, tenantId);
      const targetPatient = mockActivePatient(targetPatientId, tenantId);
      const createDto = {
        sourcePatientId,
        targetPatientId,
        reason: 'Duplicate found',
      };

      prisma.patient.findFirst
        .mockResolvedValueOnce(sourcePatient)
        .mockResolvedValueOnce(targetPatient);

      prisma.patientMergeRequest.create.mockResolvedValue(mockMergeRequest());

      await service.createMergeRequest(tenantId, userId, branchId, createDto);

      // Verify findFirst was called (to check existence)
      // but no update methods were called
      expect(prisma.patient.findFirst).toHaveBeenCalledTimes(2);
      expect(prisma.patient.update).not.toBeDefined();
      expect(prisma.patient.updateMany).not.toBeDefined();
    });

    it('should not execute actual merge on approval', async () => {
      const pendingRequest = mockMergeRequest();
      const approvedRequest = mockMergeRequest({
        status: 'APPROVED',
        approverId,
      });
      prisma.patientMergeRequest.findFirst.mockResolvedValue(pendingRequest);
      prisma.patientMergeRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.patientMergeRequest.findUnique.mockResolvedValue(approvedRequest);

      await service.approveMergeRequest(tenantId, approverId, mergeRequestId, {
        remarks: 'Approved',
      });

      // Verify merge-related operations don't occur
      expect(prisma.patientMergeRequest.updateMany).toHaveBeenCalled();
      expect(prisma.patient.findFirst).not.toHaveBeenCalled();
      expect(prisma.patient.update).not.toBeDefined();
      expect(prisma.patient.delete).not.toBeDefined();

      // Verify only status changed
      const updateCall = prisma.patientMergeRequest.updateMany.mock.calls[0][0];
      expect(updateCall.data).toEqual(
        expect.objectContaining({
          status: 'APPROVED',
          approverId,
        }),
      );
      expect(updateCall.data).not.toHaveProperty('mergedAtDate');
      expect(updateCall.data).not.toHaveProperty('sourcePatientId');
    });
  });

  describe('Audit logging', () => {
    describe('PATIENT_MERGE_REQUESTED', () => {
      it('should log with metadata only, no PHI', async () => {
        const sourcePatient = mockActivePatient(sourcePatientId, tenantId);
        const targetPatient = mockActivePatient(targetPatientId, tenantId);
        const reason = 'Duplicate patient found during registration';
        const createDto = {
          sourcePatientId,
          targetPatientId,
          reason,
        };

        prisma.patient.findFirst
          .mockResolvedValueOnce(sourcePatient)
          .mockResolvedValueOnce(targetPatient);

        const createdRequest = mockMergeRequest({ reason });
        prisma.patientMergeRequest.create.mockResolvedValue(createdRequest);

        await service.createMergeRequest(tenantId, userId, branchId, createDto);

        const auditCall = auditService.log.mock.calls[0][0];

        // Verify no PHI in audit log
        expect(JSON.stringify(auditCall)).not.toMatch(/John|Doe|1990/);

        // Verify required metadata is present
        expect(auditCall).toEqual(
          expect.objectContaining({
            eventKey: 'PATIENT_MERGE_REQUESTED',
            recordType: 'PatientMergeRequest',
            tenantId,
            userId,
            recordId: mergeRequestId,
            newValues: expect.objectContaining({
              id: mergeRequestId,
              status: 'PENDING',
              sourcePatientId,
              targetPatientId,
            }),
          }),
        );

        // Verify no clinical data in newValues
        const newValues = auditCall.newValues;
        expect(newValues).not.toHaveProperty('firstName');
        expect(newValues).not.toHaveProperty('lastName');
        expect(newValues).not.toHaveProperty('clinicalNotes');
        expect(newValues).not.toHaveProperty('results');
        expect(newValues).not.toHaveProperty('billing');
      });
    });

    describe('PATIENT_MERGE_APPROVED', () => {
      it('should log with metadata only, no PHI', async () => {
        const pendingRequest = mockMergeRequest();
        const approvedRequest = mockMergeRequest({
          status: 'APPROVED',
          approverId,
        });

        prisma.patientMergeRequest.findFirst.mockResolvedValue(pendingRequest);
        prisma.patientMergeRequest.updateMany.mockResolvedValue({ count: 1 });
        prisma.patientMergeRequest.findUnique.mockResolvedValue(
          approvedRequest,
        );

        await service.approveMergeRequest(
          tenantId,
          approverId,
          mergeRequestId,
          { remarks: 'Approved' },
        );

        const auditCall = auditService.log.mock.calls[0][0];

        // Verify no PHI in audit log
        expect(JSON.stringify(auditCall)).not.toMatch(/John|Doe|1990/);

        // Verify required metadata is present
        expect(auditCall).toEqual(
          expect.objectContaining({
            eventKey: 'PATIENT_MERGE_APPROVED',
            recordType: 'PatientMergeRequest',
            tenantId,
            userId: approverId,
            recordId: mergeRequestId,
            newValues: expect.objectContaining({
              id: mergeRequestId,
              status: 'APPROVED',
              approverId,
            }),
          }),
        );

        // Verify no clinical data in newValues
        const newValues = auditCall.newValues;
        expect(newValues).not.toHaveProperty('firstName');
        expect(newValues).not.toHaveProperty('lastName');
        expect(newValues).not.toHaveProperty('clinicalNotes');
        expect(newValues).not.toHaveProperty('results');
        expect(newValues).not.toHaveProperty('billing');
      });
    });

    describe('PATIENT_MERGE_REJECTED', () => {
      it('should log with metadata only, no PHI', async () => {
        const pendingRequest = mockMergeRequest();
        const rejectedRequest = mockMergeRequest({
          status: 'REJECTED',
          approverId,
          remarks: 'Not sufficient evidence',
        });

        prisma.patientMergeRequest.findFirst.mockResolvedValue(pendingRequest);
        prisma.patientMergeRequest.updateMany.mockResolvedValue({ count: 1 });
        prisma.patientMergeRequest.findUnique.mockResolvedValue(
          rejectedRequest,
        );

        await service.rejectMergeRequest(tenantId, approverId, mergeRequestId, {
          reason: 'Not sufficient evidence',
        });

        const auditCall = auditService.log.mock.calls[0][0];

        // Verify no PHI in audit log
        expect(JSON.stringify(auditCall)).not.toMatch(/John|Doe|1990/);

        // Verify required metadata is present
        expect(auditCall).toEqual(
          expect.objectContaining({
            eventKey: 'PATIENT_MERGE_REJECTED',
            recordType: 'PatientMergeRequest',
            tenantId,
            userId: approverId,
            recordId: mergeRequestId,
            newValues: expect.objectContaining({
              id: mergeRequestId,
              status: 'REJECTED',
              approverId,
            }),
          }),
        );

        // Verify no clinical data in newValues
        const newValues = auditCall.newValues;
        expect(newValues).not.toHaveProperty('firstName');
        expect(newValues).not.toHaveProperty('lastName');
        expect(newValues).not.toHaveProperty('clinicalNotes');
        expect(newValues).not.toHaveProperty('results');
        expect(newValues).not.toHaveProperty('billing');
      });
    });
  });
});
