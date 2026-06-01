import { apiClient } from '../lib/api';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  branchId?: string;
  userId: string;
  eventKey: string;
  recordType: string;
  recordId: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  activeRole?: string;
  hash?: string;
  previousHash?: string;
}

export interface AuditSearchParams {
  eventKey?: string;
  recordType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export class ComplianceService {
  private auditBase = '/audit';
  private complianceBase = '/v1/compliance';

  async getAuditEvents(params?: AuditSearchParams): Promise<{ data: AuditLogEntry[]; total: number; page: number; pageSize: number }> {
    const res = await apiClient.get(`${this.auditBase}/events`, { params });
    return res.data;
  }

  async getAuditEvent(id: string): Promise<AuditLogEntry> {
    const res = await apiClient.get(`${this.auditBase}/events/${id}`);
    return res.data;
  }

  async verifyAuditChain(): Promise<{ isValid: boolean; corruptedLogIds: string[] }> {
    const res = await apiClient.get(`${this.auditBase}/verify`);
    return res.data;
  }

  async getEphiAudit(from?: string, to?: string) {
    const res = await apiClient.get(`${this.complianceBase}/hipaa/ephi-audit`, { params: { from, to } });
    return res.data;
  }

  async getAccessReviewReport() {
    const res = await apiClient.get(`${this.complianceBase}/soc2/access-review`);
    return res.data;
  }

  async getStaleAccounts() {
    const res = await apiClient.get(`${this.complianceBase}/soc2/stale-accounts`);
    return res.data;
  }

  async getRetentionStatus() {
    const res = await apiClient.get(`${this.complianceBase}/retention/status`);
    return res.data;
  }

  async getChangeLog(from?: string, to?: string) {
    const res = await apiClient.get(`${this.complianceBase}/soc2/change-log`, { params: { from, to } });
    return res.data;
  }

  async getBreachReport(incidentId: string) {
    const res = await apiClient.get(`${this.complianceBase}/hipaa/breach-report/${incidentId}`);
    return res.data;
  }
}

export const complianceService = new ComplianceService();
