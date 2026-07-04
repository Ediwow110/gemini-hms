import { apiClient } from '../lib/api';

export interface RevenueData {
  totalRevenue: number;
  period: string;
}

export interface DiagnosisData {
  diagnosis: string;
  count: number;
}

export interface OccupancyData {
  branch: string;
  occupancyRate: number;
}

export interface WaitTimeData {
  department: string;
  avgWaitMinutes: number;
}

export interface ClaimRateData {
  period: string;
  rate: number;
}

export const analyticsService = {
  async getRevenue(tenantId?: string): Promise<RevenueData> {
    const res = await apiClient.get('/v1/analytics/revenue', { params: tenantId ? { tenantId } : {} });
    return res.data;
  },

  async getTopDiagnoses(): Promise<DiagnosisData[]> {
    const res = await apiClient.get('/v1/analytics/diagnoses');
    return res.data;
  },

  async getBedOccupancy(): Promise<OccupancyData[]> {
    const res = await apiClient.get('/v1/analytics/occupancy');
    return res.data;
  },

  async getWaitTime(): Promise<WaitTimeData[]> {
    const res = await apiClient.get('/v1/analytics/wait-time');
    return res.data;
  },

  async getClaimRate(): Promise<ClaimRateData> {
    const res = await apiClient.get('/v1/analytics/claim-rate');
    return res.data;
  },

  async getHrMetrics(): Promise<Record<string, unknown>> {
    const res = await apiClient.get('/v1/analytics/hr-metrics');
    return res.data;
  },

  async getItMetrics(): Promise<Record<string, unknown>> {
    const res = await apiClient.get('/v1/analytics/it-metrics');
    return res.data;
  },

  async getComplianceMetrics(): Promise<Record<string, unknown>> {
    const res = await apiClient.get('/v1/analytics/compliance-metrics');
    return res.data;
  },
};
