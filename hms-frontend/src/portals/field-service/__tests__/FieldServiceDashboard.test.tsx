import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FieldServiceDashboard } from '../FieldServiceDashboard';
import { useFieldServiceJobs } from '../../../hooks/use-field-service';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
}));

vi.mock('../../../hooks/use-field-service', () => ({
  useFieldServiceJobs: vi.fn(),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('FieldServiceDashboard Phase 14-B', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
  });

  it('renders loading skeleton while fetching', () => {
    vi.mocked(useFieldServiceJobs).mockReturnValue({ data: undefined, isLoading: true, error: null } as unknown as ReturnType<typeof useFieldServiceJobs>);

    render(<FieldServiceDashboard />, { wrapper });
    expect(screen.getByText('Field Service Dashboard')).toBeInTheDocument();
  });

  it('renders with real data from hook', async () => {
    vi.mocked(useFieldServiceJobs).mockReturnValue({
      data: {
        deliveries: [{ id: 'del-1', customer: 'Hospital A', address: '123 St', status: 'IN_PROGRESS' as const }],
        installations: [{ id: 'ins-1', customer: 'Hospital B', address: '456 Rd', status: 'PENDING' as const }],
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFieldServiceJobs>);

    render(<FieldServiceDashboard />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Field Service Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Job Completion Timeline')).toBeInTheDocument();
      expect(screen.getByText('SLA Response / Aging')).toBeInTheDocument();
      expect(screen.getByText('Handover Sync Posture')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    vi.mocked(useFieldServiceJobs).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    } as unknown as ReturnType<typeof useFieldServiceJobs>);

    render(<FieldServiceDashboard />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Failed to load field service jobs.')).toBeInTheDocument();
    });
  });

  it('always shows demo analytics charts with DEMO labels', async () => {
    vi.mocked(useFieldServiceJobs).mockReturnValue({
      data: { deliveries: [], installations: [] },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFieldServiceJobs>);

    render(<FieldServiceDashboard />, { wrapper });
    await waitFor(() => {
      const demos = screen.getAllByText('DEMO');
      expect(demos.length).toBeGreaterThanOrEqual(3);
    });
  });
});
