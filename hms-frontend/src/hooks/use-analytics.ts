import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import {
  dashboardDemoConfig,
  demoComplianceDashboard,
  demoHrDashboard,
  demoItDashboard,
  demoMarketplaceDashboard,
  shouldUseDashboardDemo,
} from '../data/dashboard-demo';

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

export type AnalyticsScope =
  | 'revenue'
  | 'hr'
  | 'it'
  | 'marketplace'
  | 'compliance';

const EMPTY_HR: HrMetrics = {
  headcount: 0,
  pendingLeave: 0,
  expiredLicenses: 0,
  staffingGap: 0,
};

const EMPTY_IT: ItMetrics = {
  activeSessions: 0,
  healthyIntegrations: 0,
  backupFailures: 0,
  systemLatencyMs: 0,
};

const EMPTY_MARKETPLACE: MarketplaceMetrics = {
  gmv: 0,
  totalOrders: 0,
  approvedListings: 0,
  revenue: 0,
};

const EMPTY_COMPLIANCE: ComplianceMetrics = {
  totalAuditEvents: 0,
  securityAlerts: 0,
  complianceScore: 0,
};

export const useAnalytics = (
  requestedScopes: AnalyticsScope | AnalyticsScope[] = 'revenue',
) => {
  const scopes = Array.isArray(requestedScopes)
    ? requestedScopes
    : [requestedScopes];
  const includes = (scope: AnalyticsScope) => scopes.includes(scope);
  const canFetchLive = dashboardDemoConfig.mode !== 'force';

  const revenueQuery = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/analytics/revenue');
      return response.data as Array<{ date: string; total: number }>;
    },
    enabled: includes('revenue') && canFetchLive,
    retry: false,
  });

  const hrQuery = useQuery({
    queryKey: ['analytics', 'hr'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/analytics/hr-metrics');
      return response.data as HrMetrics;
    },
    enabled: includes('hr') && canFetchLive,
    retry: false,
  });

  const itQuery = useQuery({
    queryKey: ['analytics', 'it'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/analytics/it-metrics');
      return response.data as ItMetrics;
    },
    enabled: includes('it') && canFetchLive,
    retry: false,
  });

  const marketplaceQuery = useQuery({
    queryKey: ['analytics', 'marketplace'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/analytics/marketplace-metrics');
      return response.data as MarketplaceMetrics;
    },
    enabled: includes('marketplace') && canFetchLive,
    retry: false,
  });

  const complianceQuery = useQuery({
    queryKey: ['analytics', 'compliance'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/analytics/compliance-metrics');
      return response.data as ComplianceMetrics;
    },
    enabled: includes('compliance') && canFetchLive,
    retry: false,
  });

  const hrHasLiveData = Boolean(
    hrQuery.data && Object.values(hrQuery.data).some((value) => value > 0),
  );
  const itHasLiveData = Boolean(
    itQuery.data && Object.values(itQuery.data).some((value) => value > 0),
  );
  const marketplaceHasLiveData = Boolean(
    marketplaceQuery.data &&
      Object.values(marketplaceQuery.data).some((value) => value > 0),
  );
  const complianceHasLiveData = Boolean(
    complianceQuery.data &&
      Object.values(complianceQuery.data).some((value) => value > 0),
  );

  const hrIsDemo =
    includes('hr') &&
    shouldUseDashboardDemo(hrHasLiveData, Boolean(hrQuery.error));
  const itIsDemo =
    includes('it') &&
    shouldUseDashboardDemo(itHasLiveData, Boolean(itQuery.error));
  const marketplaceIsDemo =
    includes('marketplace') &&
    shouldUseDashboardDemo(
      marketplaceHasLiveData,
      Boolean(marketplaceQuery.error),
    );
  const complianceIsDemo =
    includes('compliance') &&
    shouldUseDashboardDemo(
      complianceHasLiveData,
      Boolean(complianceQuery.error),
    );

  const selectedQueries = [
    includes('revenue') ? revenueQuery : null,
    includes('hr') ? hrQuery : null,
    includes('it') ? itQuery : null,
    includes('marketplace') ? marketplaceQuery : null,
    includes('compliance') ? complianceQuery : null,
  ].filter(Boolean);

  return {
    revenue: revenueQuery.data ?? [],
    hr: hrIsDemo ? demoHrDashboard.metrics : (hrQuery.data ?? EMPTY_HR),
    it: itIsDemo ? demoItDashboard.metrics : (itQuery.data ?? EMPTY_IT),
    marketplace: marketplaceIsDemo
      ? demoMarketplaceDashboard.metrics
      : (marketplaceQuery.data ?? EMPTY_MARKETPLACE),
    compliance: complianceIsDemo
      ? demoComplianceDashboard.metrics
      : (complianceQuery.data ?? EMPTY_COMPLIANCE),
    isLoading: selectedQueries.some((query) => query?.isLoading),
    isFetching: selectedQueries.some((query) => query?.isFetching),
    isDemo: hrIsDemo || itIsDemo || marketplaceIsDemo || complianceIsDemo,
    demoByScope: {
      hr: hrIsDemo,
      it: itIsDemo,
      marketplace: marketplaceIsDemo,
      compliance: complianceIsDemo,
    },
    errors: {
      revenue: revenueQuery.error,
      hr: hrQuery.error,
      it: itQuery.error,
      marketplace: marketplaceQuery.error,
      compliance: complianceQuery.error,
    },
    refetchAll: async () => {
      await Promise.all(
        selectedQueries.map((query) => query?.refetch()),
      );
    },
  };
};
