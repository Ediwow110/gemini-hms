import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ApprovalsService write isolation', () => {
  let service: ApprovalsService;
  let prisma: any;
  let audit: { log: jest.Mock };

  const tenantId = 'tenant-1';
  const otherTenantId = 'tenant-2';
  const requestId = 'req-uuid';
  const userId = 'approver-user';

  beforeEach(async () => {
    audit = { log: jest.fn() };
    prisma = {
      approvalRequest: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb: any) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
  });

  it('should reject process when request belongs to another tenant', async () => {
    prisma.approvalRequest.findFirst.mockResolvedValue(null);

    await expect(
      service.processRequest(tenantId, userId, requestId, 'APPROVED', {
        remarks: 'ok',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.approvalRequest.updateMany).not.toHaveBeenCalled();
  });

  it('should use tenant-scoped optimistic lock on process', async () => {
    prisma.approvalRequest.findFirst.mockResolvedValue({
      id: requestId,
      tenantId,
      status: 'PENDING',
      requesterId: 'other-maker',
    });
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.processRequest(tenantId, userId, requestId, 'APPROVED', {
        remarks: 'ok',
      }),
    ).rejects.toThrow(ConflictException);

    expect(prisma.approvalRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: requestId,
        tenantId,
        status: 'PENDING',
      },
      data: expect.objectContaining({
        status: 'APPROVED',
        approverId: userId,
      }),
    });
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('should reject process when request belongs to another branch', async () => {
    prisma.approvalRequest.findFirst.mockResolvedValue({
      id: requestId,
      tenantId,
      status: 'PENDING',
      requesterId: 'other-maker',
      details: { branchId: 'branch-a' },
    });

    await expect(
      service.processRequest(
        tenantId,
        userId,
        requestId,
        'APPROVED',
        { remarks: 'ok' },
        'branch-b',
      ),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.approvalRequest.updateMany).not.toHaveBeenCalled();
  });

  it('persists approval row when tenant matches and row is still PENDING', async () => {
    const pending = {
      id: requestId,
      tenantId,
      status: 'PENDING',
      requesterId: 'other-maker',
      details: { branchId: 'branch-a' },
    };
    const processed = {
      ...pending,
      status: 'APPROVED',
      approverId: userId,
      remarks: 'ok',
    };

    prisma.approvalRequest.findFirst
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(processed);

    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });

    await service.processRequest(
      tenantId,
      userId,
      requestId,
      'APPROVED',
      {
        remarks: 'ok',
      },
      'branch-a',
    );

    expect(prisma.approvalRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: requestId, tenantId, status: 'PENDING' },
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventKey: 'APPROVAL_APPROVED' }),
      expect.anything(),
      'branch-a',
    );
  });

  it('findFirst pre-check is filtered by tenant id (not only row id)', async () => {
    prisma.approvalRequest.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.processRequest(otherTenantId, userId, requestId, 'APPROVED', {
        remarks: 'x',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.approvalRequest.findFirst).toHaveBeenCalledWith({
      where: { id: requestId, tenantId: otherTenantId },
    });
  });

  it('propagates branchId from request details into audit and persisted row when creating requests', async () => {
    prisma.approvalRequest.create.mockResolvedValue({
      id: requestId,
      tenantId,
      branchId: 'branch-a',
      requesterId: userId,
      type: 'REFUND',
      riskLevel: 'HIGH',
      recordId: 'payment-1',
      status: 'PENDING',
      details: { branchId: 'branch-a' },
    });

    await service.createRequest(tenantId, userId, {
      type: 'REFUND',
      riskLevel: 'HIGH',
      recordId: 'payment-1',
      reason: 'Need approval',
      details: { branchId: 'branch-a' },
    });

    expect(prisma.approvalRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ branchId: 'branch-a' }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventKey: 'APPROVAL_REQUESTED' }),
      undefined,
      'branch-a',
    );
  });

  it('filters request listings by branch for branch-scoped users', async () => {
    prisma.approvalRequest.findMany = jest.fn().mockResolvedValue([]);

    await service.getRequests(tenantId, 'branch-a', false);

    expect(prisma.approvalRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId,
          branchId: 'branch-a',
        },
      }),
    );
  });

  it('omits branch filter for Super Admin request listings', async () => {
    prisma.approvalRequest.findMany = jest.fn().mockResolvedValue([]);

    await service.getRequests(tenantId, undefined, true);

    expect(prisma.approvalRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId,
          branchId: undefined,
        },
      }),
    );
  });
});
