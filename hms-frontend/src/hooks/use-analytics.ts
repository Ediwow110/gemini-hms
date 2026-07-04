import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export interface HrMetrics {
  headcount: number;
  pendingLeave: number;
  expiredLicenses: number;
  staffingGap: number;
}

export interface ItMetrics {
  activeSessions: number;
  healthyIntegrations: number;
  backupFailures: number;
  systemLatencyMs: number;
}

export interface MarketplaceMetrics {
  gmv: number;
  totalOrders: number;
  approvedListings: number;
  revenue: number;
}

export interface ComplianceMetrics {
  totalAuditEvents: number;
  securityAlerts: number;
  complianceScore: number;
}

export const useAnalytics = () => {
  const { data: revenue, isLoading: revLoading, error: revError } = useQuery({
    queryKey: ['analytics-revenue'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/revenue');
      return res.data;
    },
    retry: false,
  });

  const { data: hr, isLoading: hrLoading, error: hrError } = useQuery({
    queryKey: ['analytics-hr'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/hr-metrics');
      return res.data as HrMetrics;
    },
    retry: false,
  });

  const { data: it, isLoading: itLoading, error: itError } = useQuery({
    queryKey: ['analytics-it'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/it-metrics');
      return res.data as ItMetrics;
    },
    retry: false,
  });

  const { data: marketplace, isLoading: mpLoading, error: mpError } = useQuery({
    queryKey: ['analytics-marketplace'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/marketplace-metrics');
      return res.data as MarketplaceMetrics;
    },
    retry: false,
  });

  const { data: compliance, isLoading: compLoading, error: compError } = useQuery({
    queryKey: ['analytics-compliance'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/compliance-metrics');
      return res.data as ComplianceMetrics;
    },
    retry: false,
  });

  return {
    revenue: revenue || [],
    hr: hr || { headcount: 0, pendingLeave: 0, expiredLicenses: 0, staffingGap: 0 },
    it: it || { activeSessions: 0, healthyIntegrations: 0, backupFailures: 0, systemLatencyMs: 0 },
    marketplace: marketplace || { gmv: 0, totalOrders: 0, approvedListings: 0, revenue: 0 },
    compliance: compliance || { totalAuditEvents: 0, securityAlerts: 0, complianceScore: 0 },
    isLoading: revLoading || hrLoading || itLoading || mpLoading || compLoading,
    errors: { revError, hrError, itError, mpError, compError },
  };
};
