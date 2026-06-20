import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationBridgesService } from './integration.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { AuditService } from '../audit/audit.service';

describe('IntegrationBridgesService — thin wrappers', () => {
  let service: IntegrationBridgesService;
  let notifications: { listNotifications: jest.Mock };
  let approvals: { getRequests: jest.Mock };
  let audit: { findAll: jest.Mock };

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const otherTenantId = '00000000-0000-0000-0000-000000000002';
  const userId = '00000000-0000-0000-0000-000000000003';

  const baseUser = {
    tenantId,
    userId,
    branchId: undefined,
    roles: ['HR Manager'],
    permissions: [],
  };

  beforeEach(async () => {
    notifications = { listNotifications: jest.fn() };
    approvals = { getRequests: jest.fn() };
    audit = { findAll: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationBridgesService,
        { provide: NotificationsService, useValue: notifications },
        { provide: ApprovalsService, useValue: approvals },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<IntegrationBridgesService>(IntegrationBridgesService);
  });

  describe('listNotifications', () => {
    it('re-uses NotificationsService.listNotifications with the authenticated user', async () => {
      notifications.listNotifications.mockResolvedValueOnce([]);
      await service.listNotifications(baseUser);
      expect(notifications.listNotifications).toHaveBeenCalledWith(
        tenantId,
        userId,
      );
    });

    it('maps Prisma Notification rows to integration DTOs (no fabrication)', async () => {
      const created = new Date('2026-05-20T08:00:00.000Z');
      const readAt = new Date('2026-05-21T09:00:00.000Z');
      notifications.listNotifications.mockResolvedValueOnce([
        {
          id: 'n-1',
          tenantId,
          userId,
          patientId: null,
          type: 'IN_APP',
          status: 'SENT',
          recipient: 'user@example.com',
          subject: 'Test subject',
          content: 'Test content body',
          templateKey: null,
          category: 'SYSTEM',
          priority: 'NORMAL',
          attempts: 0,
          lastError: null,
          sentAt: null,
          readAt,
          createdAt: created,
        },
      ]);

      const result = await service.listNotifications(baseUser);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'n-1',
        sourceDomain: 'NOTIFICATION',
        recordType: 'Notification',
        recordId: 'n-1',
        title: 'Test subject',
        severity: 'NORMAL',
        status: 'READ',
        timestamp: created.toISOString(),
        actor: 'user@example.com',
        tenantId,
        branchId: null,
        isMock: false,
        isShell: false,
      });
      expect(result[0].summary).toBe('Test content body');
      expect(result[0].accessLabel).toBe('Notification: SYSTEM/IN_APP');
    });

    it('maps PENDING status to UNREAD and READ status to READ', async () => {
      notifications.listNotifications.mockResolvedValueOnce([
        {
          id: 'n-pending',
          tenantId,
          userId,
          patientId: null,
          type: 'EMAIL',
          status: 'PENDING',
          recipient: 'a@example.com',
          subject: 's1',
          content: 'c1',
          templateKey: null,
          category: 'ALERT',
          priority: 'HIGH',
          attempts: 0,
          lastError: null,
          sentAt: null,
          readAt: null,
          createdAt: new Date('2026-05-20T08:00:00.000Z'),
        },
        {
          id: 'n-read',
          tenantId,
          userId,
          patientId: null,
          type: 'IN_APP',
          status: 'READ',
          recipient: 'b@example.com',
          subject: 's2',
          content: 'c2',
          templateKey: null,
          category: 'SECURITY',
          priority: 'CRITICAL',
          attempts: 0,
          lastError: null,
          sentAt: null,
          readAt: new Date('2026-05-20T09:00:00.000Z'),
          createdAt: new Date('2026-05-20T08:00:00.000Z'),
        },
      ]);

      const result = await service.listNotifications(baseUser);
      expect(result[0].status).toBe('UNREAD');
      expect(result[1].status).toBe('READ');
      expect(result[0].severity).toBe('HIGH');
      expect(result[1].severity).toBe('CRITICAL');
    });

    it('passes the user tenantId to the underlying service (no client-trusted tenant)', async () => {
      notifications.listNotifications.mockResolvedValueOnce([]);
      const crossTenantUser = {
        ...baseUser,
        tenantId: otherTenantId,
      };
      await service.listNotifications(crossTenantUser);
      expect(notifications.listNotifications).toHaveBeenCalledWith(
        otherTenantId,
        userId,
      );
    });
  });

  describe('listApprovals', () => {
    it('re-uses ApprovalsService.getRequests with the authenticated user', async () => {
      approvals.getRequests.mockResolvedValueOnce([]);
      await service.listApprovals(baseUser);
      expect(approvals.getRequests).toHaveBeenCalledWith(
        tenantId,
        undefined,
        false,
        false,
        1,
        50,
      );
    });

    it('passes isSuperAdmin=true and isTenantWide=true based on user roles', async () => {
      approvals.getRequests.mockResolvedValueOnce([]);
      const superAdminUser = {
        ...baseUser,
        roles: ['Super Admin'],
      };
      await service.listApprovals(superAdminUser);
      expect(approvals.getRequests).toHaveBeenCalledWith(
        tenantId,
        undefined,
        true,
        true,
        1,
        50,
      );
    });

    it('passes isTenantWide=true for Compliance Officer or Tenant Admin', async () => {
      approvals.getRequests.mockResolvedValueOnce([]);
      const complianceUser = {
        ...baseUser,
        roles: ['Compliance Officer'],
      };
      await service.listApprovals(complianceUser);
      expect(approvals.getRequests).toHaveBeenCalledWith(
        tenantId,
        undefined,
        false,
        true,
        1,
        50,
      );
    });

    it('maps Prisma ApprovalRequest rows to integration DTOs (no fabrication)', async () => {
      const created = new Date('2026-05-20T08:00:00.000Z');
      approvals.getRequests.mockResolvedValueOnce([
        {
          id: 'a-1',
          tenantId,
          branchId: null,
          requesterId: 'requester-1',
          approverId: null,
          type: 'REFUND',
          riskLevel: 'HIGH',
          recordId: 'rec-1',
          status: 'PENDING',
          reason: 'Duplicate charge',
          remarks: null,
          details: null,
          createdAt: created,
          updatedAt: created,
          requester: { id: 'requester-1', email: 'req@example.com' },
        },
      ]);

      const result = await service.listApprovals(baseUser);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'a-1',
        sourceDomain: 'APPROVAL',
        recordType: 'REFUND',
        recordId: 'a-1',
        title: 'REFUND (HIGH)',
        riskLevel: 'HIGH',
        status: 'PENDING',
        requester: 'req@example.com',
        tenantId,
        branchId: null,
        isMock: false,
        isShell: false,
      });
      expect(result[0].summary).toBe('Duplicate charge');
      expect(result[0].accessLabel).toBe('Approval: REFUND');
    });

    it('falls back to requesterId when requester email is not included', async () => {
      approvals.getRequests.mockResolvedValueOnce([
        {
          id: 'a-2',
          tenantId,
          branchId: null,
          requesterId: 'requester-2',
          approverId: null,
          type: 'ROLE_CHANGE',
          riskLevel: 'LOW',
          recordId: 'rec-2',
          status: 'APPROVED',
          reason: null,
          remarks: null,
          details: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          requester: null,
        },
      ]);

      const result = await service.listApprovals(baseUser);
      expect(result[0].requester).toBe('requester-2');
    });

    it('passes the user tenantId to the underlying service (no client-trusted tenant)', async () => {
      approvals.getRequests.mockResolvedValueOnce([]);
      const crossTenantUser = {
        ...baseUser,
        tenantId: otherTenantId,
      };
      await service.listApprovals(crossTenantUser);
      expect(approvals.getRequests).toHaveBeenCalledWith(
        otherTenantId,
        undefined,
        false,
        false,
        1,
        50,
      );
    });
  });

  describe('listActivityAudit', () => {
    it('re-uses AuditService.findAll with JWT-derived tenant and roles', async () => {
      audit.findAll.mockResolvedValueOnce({
        data: [],
        total: 0,
        page: 1,
        pageSize: 50,
      });
      await service.listActivityAudit(baseUser);
      expect(audit.findAll).toHaveBeenCalledWith(
        tenantId,
        undefined,
        ['HR Manager'],
        { pageSize: 50 },
      );
    });

    it('maps audit rows to integration activity DTOs without mock/shell flags', async () => {
      const createdAt = new Date('2026-06-01T12:00:00.000Z');
      audit.findAll.mockResolvedValueOnce({
        data: [
          {
            id: 'audit-1',
            tenantId,
            branchId: 'branch-1',
            userId: 'actor-1',
            eventKey: 'SECURITY_BREACH_DETECTED',
            recordType: 'Patient',
            recordId: 'patient-1',
            createdAt,
            activeRole: 'Doctor',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 50,
      });

      const result = await service.listActivityAudit(baseUser);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'audit-1',
        actor: 'actor-1',
        role: 'Doctor',
        recordType: 'Patient',
        recordId: 'patient-1',
        eventType: 'SECURITY_BREACH_DETECTED',
        risk: 'CRITICAL',
        isMock: false,
        isShell: false,
      });
      expect(result[0].timestamp).toBe(createdAt.toISOString());
    });

    it('returns empty array when audit log has no rows', async () => {
      audit.findAll.mockResolvedValueOnce({
        data: [],
        total: 0,
        page: 1,
        pageSize: 50,
      });
      await expect(service.listActivityAudit(baseUser)).resolves.toEqual([]);
    });
  });
});
