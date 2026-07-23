import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAnalytics, type AnalyticsScope } from '../use-analytics';
import { apiClient } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return {
    queryClient,
    Wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
};

const AnalyticsProbe = ({ scope }: { scope: AnalyticsScope | AnalyticsScope[] }) => {
  const result = useAnalytics(scope);
  return (
    <div>
      <span data-testid="loading">{String(result.isLoading)}</span>
      <span data-testid="demo">{String(result.isDemo)}</span>
      <span data-testid="hr-headcount">{result.hr.headcount}</span>
      <span data-testid="it-sessions">{result.it.activeSessions}</span>
      <span data-testid="marketplace-orders">{result.marketplace.totalOrders}</span>
      <span data-testid="compliance-events">{result.compliance.totalAuditEvents}</span>
    </div>
  );
};

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the versioned analytics endpoint and requests only the selected scope', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        headcount: 48,
        pendingLeave: 3,
        expiredLicenses: 1,
        staffingGap: 2,
      },
    });
    const { Wrapper } = createWrapper();

    render(<AnalyticsProbe scope="hr" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    );

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/v1/analytics/hr-metrics');
    expect(screen.getByTestId('hr-headcount')).toHaveTextContent('48');
    expect(screen.getByTestId('demo')).toHaveTextContent('false');
  });

  it('does not request unrelated analytics endpoints for a restricted workspace', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        activeSessions: 12,
        healthyIntegrations: 4,
        backupFailures: 0,
        systemLatencyMs: 0,
      },
    });
    const { Wrapper } = createWrapper();

    render(<AnalyticsProbe scope="it" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    );

    const urls = vi.mocked(apiClient.get).mock.calls.map(([url]) => url);
    expect(urls).toEqual(['/v1/analytics/it-metrics']);
    expect(urls).not.toContain('/v1/analytics/hr-metrics');
    expect(urls).not.toContain('/v1/analytics/marketplace-metrics');
    expect(urls).not.toContain('/v1/analytics/compliance-metrics');
  });

  it('uses deterministic fallback data when the selected live metric set is empty in development', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        gmv: 0,
        totalOrders: 0,
        approvedListings: 0,
        revenue: 0,
      },
    });
    const { Wrapper } = createWrapper();

    render(<AnalyticsProbe scope="marketplace" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    );

    expect(screen.getByTestId('demo')).toHaveTextContent('true');
    expect(
      Number(screen.getByTestId('marketplace-orders').textContent),
    ).toBeGreaterThan(0);
  });

  it('uses deterministic fallback data when the selected endpoint fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('network unavailable'));
    const { Wrapper } = createWrapper();

    render(<AnalyticsProbe scope="compliance" />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    );

    expect(screen.getByTestId('demo')).toHaveTextContent('true');
    expect(
      Number(screen.getByTestId('compliance-events').textContent),
    ).toBeGreaterThan(0);
  });

  it('requests multiple explicitly authorized scopes without enabling every analytics query', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/v1/analytics/hr-metrics') {
        return {
          data: {
            headcount: 31,
            pendingLeave: 2,
            expiredLicenses: 0,
            staffingGap: 0,
          },
        };
      }
      return {
        data: {
          activeSessions: 9,
          healthyIntegrations: 3,
          backupFailures: 0,
          systemLatencyMs: 0,
        },
      };
    });
    const { Wrapper } = createWrapper();

    render(<AnalyticsProbe scope={['hr', 'it']} />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    );

    const urls = vi.mocked(apiClient.get).mock.calls.map(([url]) => url).sort();
    expect(urls).toEqual([
      '/v1/analytics/hr-metrics',
      '/v1/analytics/it-metrics',
    ]);
  });
});
