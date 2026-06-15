import { apiClient } from "../lib/api";

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
  userId?: string;
  recordType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class ComplianceService {
  private auditBase = "/v1/audit";
  private complianceBase = "/v1/compliance";

  async getAuditEvents(
    params?: AuditSearchParams,
  ): Promise<{
    data: AuditLogEntry[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const res = await apiClient.get(`${this.auditBase}/events`, { params });
    return res.data;
  }

  async getMyAuditEvents(
    params?: AuditSearchParams,
  ): Promise<{
    data: AuditLogEntry[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const res = await apiClient.get(`${this.auditBase}/events/self`, {
      params,
    });
    return res.data;
  }

  async getMyAuditEvent(id: string): Promise<AuditLogEntry> {
    const res = await apiClient.get(`${this.auditBase}/events/self/${id}`);
    return res.data;
  }

  async getEntityAuditEvents(
    recordType: string,
    recordId: string,
    params?: AuditSearchParams,
  ): Promise<{
    data: AuditLogEntry[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const res = await apiClient.get(
      `${this.auditBase}/events/entity/${recordType}/${recordId}`,
      { params },
    );
    return res.data;
  }

  async getAuditEvent(id: string): Promise<AuditLogEntry> {
    const res = await apiClient.get(`${this.auditBase}/events/${id}`);
    return res.data;
  }

  async verifyAuditChain(): Promise<{
    isValid: boolean;
    corruptedLogIds: string[];
  }> {
    const res = await apiClient.get(`${this.auditBase}/verify`);
    return res.data;
  }

  async verifyAuditChainWithSignatures(): Promise<{
    isValid: boolean;
    truncated: boolean;
    verificationCount: number;
    corruptedLogIds: string[];
    signatureErrors: string[];
  }> {
    const res = await apiClient.post(`${this.auditBase}/verify/signatures`);
    return res.data;
  }

  async exportAuditEvents(
    params?: AuditSearchParams & { format?: "csv" | "json" },
  ): Promise<{
    data: Record<string, unknown>[];
    exportedCount: number;
    totalAvailable: number;
    truncated: boolean;
    format: string;
  }> {
    const res = await apiClient.get(`${this.auditBase}/export`, { params });
    return res.data;
  }

  async exportMyAuditEvents(
    params?: AuditSearchParams & { format?: "csv" | "json" },
  ): Promise<{
    data: Record<string, unknown>[];
    exportedCount: number;
    totalAvailable: number;
    truncated: boolean;
    format: string;
  }> {
    const res = await apiClient.get(`${this.auditBase}/export/self`, {
      params,
    });
    return res.data;
  }

  async getEphiAudit(from?: string, to?: string) {
    const res = await apiClient.get(`${this.complianceBase}/hipaa/ephi-audit`, {
      params: { from, to },
    });
    return res.data;
  }

  async getAccessReviewReport() {
    const res = await apiClient.get(
      `${this.complianceBase}/soc2/access-review`,
    );
    return res.data;
  }

  async getStaleAccounts() {
    const res = await apiClient.get(
      `${this.complianceBase}/soc2/stale-accounts`,
    );
    return res.data;
  }

  async getUnauthorizedAccessDetections() {
    const res = await apiClient.get(`${this.complianceBase}/hipaa/anomalies`);
    return Array.isArray(res.data) ? res.data : [];
  }

  async getRetentionStatus() {
    const res = await apiClient.get(`${this.complianceBase}/retention/status`);
    return res.data;
  }

  async getChangeLog(from?: string, to?: string) {
    const res = await apiClient.get(`${this.complianceBase}/soc2/change-log`, {
      params: { from, to },
    });
    return res.data;
  }

  async getBreachReport(incidentId: string) {
    const res = await apiClient.get(
      `${this.complianceBase}/hipaa/breach-report/${incidentId}`,
    );
    return res.data;
  }
}

export const complianceService = new ComplianceService();
