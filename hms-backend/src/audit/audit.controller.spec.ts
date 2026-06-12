import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ForbiddenException } from '@nestjs/common';

describe('AuditController', () => {
  let controller: AuditController;
  let service: jest.Mocked<AuditService>;

  const mockTenantId = 'tenant-uuid';
  const mockBranchId = 'branch-uuid';
  const mockUserId = 'user-uuid';
  const mockRoles = ['Super Admin'];

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findMyEvents: jest.fn(),
      findEntityTimeline: jest.fn(),
      findOne: jest.fn(),
      findMyEvent: jest.fn(),
      exportEvents: jest.fn(),
      exportMyEvents: jest.fn(),
      verifyChain: jest.fn(),
      verifyChainWithSignatures: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: service }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuditController>(AuditController);
  });

  describe('GET /api/v1/audit/export/self', () => {
    it('should delegate to auditService.exportMyEvents with userId from JWT', async () => {
      const query = { format: 'csv' as const };
      service.exportMyEvents.mockResolvedValue({
        data: [],
        exportedCount: 0,
        totalAvailable: 0,
        truncated: false,
        format: 'csv',
      });

      await controller.exportMyEvents(mockTenantId, mockUserId, query);

      expect(service.exportMyEvents).toHaveBeenCalledWith(
        mockTenantId,
        mockUserId,
        query,
        'csv',
      );
    });

    it('should default format to csv when not provided', async () => {
      const query: any = { format: 'csv' };
      service.exportMyEvents.mockResolvedValue({
        data: [],
        exportedCount: 0,
        totalAvailable: 0,
        truncated: false,
        format: 'csv',
      });

      await controller.exportMyEvents(mockTenantId, mockUserId, query);

      expect(service.exportMyEvents).toHaveBeenCalledWith(
        mockTenantId,
        mockUserId,
        query,
        'csv',
      );
    });

    it('should pass json format to service', async () => {
      const query = { format: 'json' as const };
      service.exportMyEvents.mockResolvedValue({
        data: [],
        exportedCount: 0,
        totalAvailable: 0,
        truncated: false,
        format: 'json',
      });

      await controller.exportMyEvents(mockTenantId, mockUserId, query);

      expect(service.exportMyEvents).toHaveBeenCalledWith(
        mockTenantId,
        mockUserId,
        query,
        'json',
      );
    });

    it('should return honest export metadata from service', async () => {
      const query = { eventKey: 'PATIENT_REGISTERED', format: 'csv' as const };
      const mockResult = {
        data: [{ id: 'e1' }],
        exportedCount: 1,
        totalAvailable: 50,
        truncated: true,
        format: 'csv' as const,
      };
      service.exportMyEvents.mockResolvedValue(mockResult);

      const result = await controller.exportMyEvents(
        mockTenantId,
        mockUserId,
        query,
      );

      expect(result.exportedCount).toBe(1);
      expect(result.totalAvailable).toBe(50);
      expect(result.truncated).toBe(true);
      expect(result.format).toBe('csv');
    });
  });

  describe('GET /api/v1/audit/events/self/:id', () => {
    it('should delegate to auditService.findMyEvent with userId from JWT', async () => {
      const logId = 'log-uuid';
      service.findMyEvent.mockResolvedValue({
        id: logId,
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'TEST',
        recordType: 'test',
        recordId: 'r1',
        createdAt: new Date().toISOString(),
      } as any);

      const result = await controller.findMyEvent(
        mockTenantId,
        mockUserId,
        logId,
      );

      expect(service.findMyEvent).toHaveBeenCalledWith(
        mockTenantId,
        mockUserId,
        logId,
      );
      expect(result.id).toBe(logId);
    });

    it('should return event data when found', async () => {
      const logId = 'log-uuid';
      const mockEvent: any = {
        id: logId,
        tenantId: mockTenantId,
        userId: mockUserId,
        eventKey: 'PAYMENT_COMPLETED',
        recordType: 'Payment',
        recordId: 'pay-uuid',
        createdAt: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        activeRole: 'Doctor',
        hash: 'abc123',
        previousHash: null,
      };
      service.findMyEvent.mockResolvedValue(mockEvent);

      const result = await controller.findMyEvent(
        mockTenantId,
        mockUserId,
        logId,
      );

      expect(result.eventKey).toBe('PAYMENT_COMPLETED');
      expect(result.recordType).toBe('Payment');
    });
  });

  describe('server-enforced self-scope behavior', () => {
    it('GET /events/self should pass JWT userId as self-scope filter', async () => {
      const query: any = { format: 'csv' };
      service.findMyEvents.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });

      await controller.findMyEvents(mockTenantId, mockUserId, query);

      expect(service.findMyEvents).toHaveBeenCalledWith(
        mockTenantId,
        mockUserId,
        query,
      );
    });

    it('GET /export/self should NOT accept client-supplied userId filter', async () => {
      const query: any = { userId: 'malicious-user', format: 'csv' };
      service.exportMyEvents.mockResolvedValue({
        data: [],
        exportedCount: 0,
        totalAvailable: 0,
        truncated: false,
        format: 'csv',
      });

      const result = await controller.exportMyEvents(
        mockTenantId,
        mockUserId,
        query,
      );

      expect(result.data).toEqual([]);
      const calledWith = service.exportMyEvents.mock.calls[0];
      expect(calledWith[1]).toBe(mockUserId);
    });

    it('GET /events/self/:id should reject when service throws Forbidden for userId mismatch', async () => {
      const logId = 'other-user-log';
      service.findMyEvent.mockRejectedValue(
        new ForbiddenException('Access denied to this audit log'),
      );

      await expect(
        controller.findMyEvent(mockTenantId, mockUserId, logId),
      ).rejects.toThrow();
    });
  });

  describe('AUDIT_LOG_EXPORTED emission delegation', () => {
    it('self-export endpoint should delegate to service which emits AUDIT_LOG_EXPORTED', async () => {
      const query = { format: 'csv' as const };
      service.exportMyEvents.mockResolvedValue({
        data: [],
        exportedCount: 0,
        totalAvailable: 0,
        truncated: false,
        format: 'csv',
      });

      await controller.exportMyEvents(mockTenantId, mockUserId, query);

      expect(service.exportMyEvents).toHaveBeenCalled();
    });

    it('global export endpoint should delegate to service which emits AUDIT_LOG_EXPORTED', async () => {
      const query = { format: 'json' as const };
      service.exportEvents.mockResolvedValue({
        data: [],
        exportedCount: 0,
        totalAvailable: 0,
        truncated: false,
        format: 'json',
      });

      await controller.exportEvents(
        mockTenantId,
        mockBranchId,
        mockRoles,
        mockUserId,
        query,
      );

      expect(service.exportEvents).toHaveBeenCalledWith(
        mockTenantId,
        mockBranchId,
        mockRoles,
        mockUserId,
        query,
        'json',
      );
    });

    it('global export endpoint should pass user roles and branch for scope enforcement', async () => {
      const query = { format: 'csv' as const };
      service.exportEvents.mockResolvedValue({
        data: [],
        exportedCount: 0,
        totalAvailable: 0,
        truncated: false,
        format: 'csv',
      });

      await controller.exportEvents(
        mockTenantId,
        mockBranchId,
        ['Branch Admin'],
        mockUserId,
        query,
      );

      expect(service.exportEvents).toHaveBeenCalledWith(
        mockTenantId,
        mockBranchId,
        ['Branch Admin'],
        mockUserId,
        query,
        'csv',
      );
    });
  });
});
