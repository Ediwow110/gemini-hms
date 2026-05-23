import { apiClient } from '../lib/api';

export interface ActivityAuditEventDto {
  id: string;
  actor: string;
  role: string;
  tenantBranch: string;
  recordType: string;
  recordId: string;
  eventType: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  accessLabel: string;
  isMock: boolean;
  isShell: boolean;
}

export interface ApprovalRequestDto {
  id: string;
  sourceDomain: string;
  recordType: string;
  recordId: string;
  title: string;
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';
  timestamp: string;
  requester: string;
  tenantId: string;
  branchId?: string;
  accessLabel: string;
  isMock: boolean;
  isShell: boolean;
}

export interface AssetTimelineEventDto {
  id: string;
  sourceDomain: string;
  recordType: string;
  recordId: string;
  title: string;
  summary: string;
  eventType:
    | 'QUOTE'
    | 'ORDER'
    | 'DELIVERY'
    | 'INSTALLATION'
    | 'HANDOVER'
    | 'WARRANTY'
    | 'MAINTENANCE'
    | 'SERVICE_TICKET';
  timestamp: string;
  actor: string;
  accessLabel: string;
  isMock: boolean;
  isShell: boolean;
}

export interface GlobalSearchResultDto {
  id: string;
  sourceDomain: string;
  recordType: string;
  recordId: string;
  title: string;
  summary: string;
  relevanceScore: number;
  accessLabel: string;
  timestamp: string;
  isMock: boolean;
  isShell: boolean;
}

export interface NotificationEventDto {
  id: string;
  sourceDomain: string;
  recordType: string;
  recordId: string;
  title: string;
  summary: string;
  severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'UNREAD' | 'READ';
  timestamp: string;
  actor: string;
  tenantId: string;
  branchId?: string;
  accessLabel: string;
  isMock: boolean;
  isShell: boolean;
}

export interface PatientTimelineEventDto {
  id: string;
  sourceDomain: string;
  recordType: string;
  recordId: string;
  title: string;
  summary: string;
  eventType:
    | 'ENCOUNTER'
    | 'VITALS'
    | 'LAB'
    | 'PRESCRIPTION'
    | 'BILLING'
    | 'MESSAGE'
    | 'INTERNAL_NOTE';
  timestamp: string;
  actor: string;
  isRestricted: boolean;
  accessLabel: string;
  isMock: boolean;
  isShell: boolean;
}

export interface ReconciliationIssueDto {
  id: string;
  domainPair: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  suggestedResolution: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  timestamp: string;
  accessLabel: string;
  isMock: boolean;
  isShell: boolean;
}

export const integrationService = {
  getNotifications: async (): Promise<NotificationEventDto[]> => {
    const response = await apiClient.get('/v1/integration/notifications');
    return response.data;
  },
  getApprovals: async (): Promise<ApprovalRequestDto[]> => {
    const response = await apiClient.get('/v1/integration/approvals');
    return response.data;
  },
  globalSearch: async (query: string): Promise<GlobalSearchResultDto[]> => {
    if (!query) return [];
    const response = await apiClient.get('/v1/integration/global-search', { params: { q: query } });
    return response.data;
  },
  getPatientTimeline: async (patientId: string): Promise<PatientTimelineEventDto[]> => {
    if (!patientId) return [];
    const response = await apiClient.get('/v1/integration/patient-timeline', { params: { patientId } });
    return response.data;
  },
  getAssetTimeline: async (assetId: string): Promise<AssetTimelineEventDto[]> => {
    if (!assetId) return [];
    const response = await apiClient.get('/v1/integration/asset-timeline', { params: { assetId } });
    return response.data;
  },
  getReconciliationIssues: async (): Promise<ReconciliationIssueDto[]> => {
    const response = await apiClient.get('/v1/integration/reconciliation');
    return response.data;
  },
  getActivityAudit: async (): Promise<ActivityAuditEventDto[]> => {
    const response = await apiClient.get('/v1/integration/activity-audit');
    return response.data;
  }
};
