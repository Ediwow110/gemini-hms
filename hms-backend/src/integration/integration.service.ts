import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { RequestUser } from '../common/types/authenticated-request.type';

export interface IntegrationNotificationDto {
  id: string;
  sourceDomain: 'NOTIFICATION';
  recordType: 'Notification';
  recordId: string;
  title: string | null;
  summary: string;
  severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'UNREAD' | 'READ';
  timestamp: string;
  actor: string;
  tenantId: string;
  branchId: string | null;
  accessLabel: string;
  isMock: false;
  isShell: false;
}

export interface IntegrationApprovalDto {
  id: string;
  sourceDomain: 'APPROVAL';
  recordType: string;
  recordId: string;
  title: string;
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';
  timestamp: string;
  requester: string;
  tenantId: string;
  branchId: string | null;
  accessLabel: string;
  isMock: false;
  isShell: false;
}

const NOTIFICATION_STATUS_TO_FRONTEND: Record<string, 'UNREAD' | 'READ'> = {
  PENDING: 'UNREAD',
  SENT: 'READ',
  FAILED: 'READ',
  READ: 'READ',
  CANCELLED: 'READ',
};

@Injectable()
export class IntegrationBridgesService {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly approvalsService: ApprovalsService,
  ) {}

  async listNotifications(user: RequestUser): Promise<IntegrationNotificationDto[]> {
    const rows = await this.notificationsService.listNotifications(
      user.tenantId,
      user.userId ?? '',
    );

    return rows.map((n) => this.toIntegrationNotification(n));
  }

  async listApprovals(user: RequestUser): Promise<IntegrationApprovalDto[]> {
    const roles = user.roles ?? [];
    const isSuperAdmin = roles.includes('Super Admin');
    const isTenantWide = roles.some((r) =>
      ['Super Admin', 'Compliance Officer', 'Tenant Admin'].includes(r),
    );

    const rows = await this.approvalsService.getRequests(
      user.tenantId,
      user.branchId,
      isSuperAdmin,
      isTenantWide,
    );

    return rows.map((r) => this.toIntegrationApproval(r));
  }

  private toIntegrationNotification(n: {
    id: string;
    tenantId: string;
    userId: string | null;
    patientId: string | null;
    type: string;
    status: string;
    recipient: string;
    subject: string | null;
    content: string;
    templateKey: string | null;
    category: string;
    priority: string;
    sentAt: Date | null;
    readAt: Date | null;
    createdAt: Date;
  }): IntegrationNotificationDto {
    const priority = n.priority as IntegrationNotificationDto['severity'];
    const status =
      NOTIFICATION_STATUS_TO_FRONTEND[n.status] ??
      (n.readAt ? 'READ' : 'UNREAD');

    const summary = n.content?.slice(0, 200) ?? '';
    const accessLabel = `Notification: ${n.category}/${n.type}`;

    return {
      id: n.id,
      sourceDomain: 'NOTIFICATION',
      recordType: 'Notification',
      recordId: n.id,
      title: n.subject,
      summary,
      severity: priority,
      status,
      timestamp: n.createdAt.toISOString(),
      actor: n.recipient,
      tenantId: n.tenantId,
      branchId: null,
      accessLabel,
      isMock: false,
      isShell: false,
    };
  }

  private toIntegrationApproval(r: {
    id: string;
    tenantId: string;
    branchId: string | null;
    requesterId: string;
    approverId: string | null;
    type: string;
    riskLevel: string;
    recordId: string;
    status: string;
    reason: string | null;
    remarks: string | null;
    details: unknown;
    createdAt: Date;
    updatedAt: Date;
    requester?: { id: string; email: string } | null;
  }): IntegrationApprovalDto {
    const risk = r.riskLevel as IntegrationApprovalDto['riskLevel'];
    const status = r.status as IntegrationApprovalDto['status'];

    const title = `${r.type} (${r.riskLevel})`;
    const summaryParts = [r.reason, r.remarks].filter(
      (s): s is string => typeof s === 'string' && s.length > 0,
    );
    const summary =
      summaryParts.length > 0
        ? summaryParts.join(' — ').slice(0, 200)
        : `${r.type} request for record ${r.recordId}`;

    return {
      id: r.id,
      sourceDomain: 'APPROVAL',
      recordType: r.type,
      recordId: r.id,
      title,
      summary,
      riskLevel: risk,
      status,
      timestamp: r.createdAt.toISOString(),
      requester: r.requester?.email ?? r.requesterId,
      tenantId: r.tenantId,
      branchId: r.branchId ?? null,
      accessLabel: `Approval: ${r.type}`,
      isMock: false,
      isShell: false,
    };
  }
}
