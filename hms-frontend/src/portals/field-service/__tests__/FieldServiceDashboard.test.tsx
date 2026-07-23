import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FieldServiceDashboard } from '../FieldServiceDashboard';
import { useFieldServiceAdminJobs, useFieldServiceJobs } from '../../../hooks/use-field-service';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Legend: () => <div />,
}));

vi.mock('../../../hooks/use-field-service', () => ({
  useFieldServiceJobs: vi.fn(),
  useFieldServiceAdminJobs: vi.fn(),
}));

vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({ permissions: ['field_service.job.view'] }),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

const queryResult = (overrides: Record<string, unknown> = {}) => ({
  data: undefined,
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
  ...overrides,
});

describe('FieldServiceDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
    vi.mocked(useFieldServiceAdminJobs).mockReturnValue(
      queryResult() as unknown as ReturnType<typeof useFieldServiceAdminJobs>,
    );
  });

  it('renders loading state while fetching jobs', () => {
    vi.mocked(useFieldServiceJobs).mockReturnValue(
      queryResult({ isLoading: true, isFetching: true }) as unknown as ReturnType<typeof useFieldServiceJobs>,
    );

    render(<FieldServiceDashboard />, { wrapper });
    expect(screen.getByText('My Field Work')).toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders live operational jobs before supporting analytics', async () => {
    vi.mocked(useFieldServiceJobs).mockReturnValue(
      queryResult({
        data: {
          deliveries: [{ id: 'del-1', customer: 'Hospital A', address: '123 St', status: 'IN_PROGRESS', shipmentId: 'ship-1', orderId: 'order-1' }],
          installations: [{ id: 'ins-1', customer: 'Hospital B', address: '456 Rd', status: 'ASSIGNED', assetId: 'asset-1', assetModel: 'MRI' }],
        },
      }) as unknown as ReturnType<typeof useFieldServiceJobs>,
    );

    render(<FieldServiceDashboard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Hospital A')).toBeInTheDocument();
      expect(screen.getByText('Completed jobs')).toBeInTheDocument();
      expect(screen.getByText('Current job mix')).toBeInTheDocument();
      expect(screen.getByText('SLA performance by work type')).toBeInTheDocument();
    });
  });

  it('shows a truthful retry-oriented error state', () => {
    vi.mocked(useFieldServiceJobs).mockReturnValue(
      queryResult({ error: new Error('Network error') }) as unknown as ReturnType<typeof useFieldServiceJobs>,
    );

    render(<FieldServiceDashboard />, { wrapper });
    expect(screen.getByText(/Field service jobs could not be loaded/i)).toBeInTheDocument();
  });

  it('labels synthetic trend context explicitly', () => {
    vi.mocked(useFieldServiceJobs).mockReturnValue(
      queryResult({ data: { deliveries: [], installations: [] } }) as unknown as ReturnType<typeof useFieldServiceJobs>,
    );

    render(<FieldServiceDashboard />, { wrapper });
    expect(screen.getByText('Live jobs + synthetic trends')).toBeInTheDocument();
    expect(screen.getByText('No active jobs')).toBeInTheDocument();
  });
});
