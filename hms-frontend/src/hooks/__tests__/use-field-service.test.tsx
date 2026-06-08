import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFieldServiceJobs,
  useFieldServiceInstallations,
  useFieldServiceShipments,
  useUpdateInstallationStatus,
  useFieldServicePreventiveMaintenance,
} from '../use-field-service';
import { fieldServiceService } from '../../services/field-service.service';

vi.mock('../../services/field-service.service', () => ({
  fieldServiceService: {
    getTechnicianJobs: vi.fn(),
    getInstallations: vi.fn(),
    getShipments: vi.fn(),
    updateInstallationStatus: vi.fn(),
  },
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useFieldServiceJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('calls getTechnicianJobs and returns data', async () => {
    const mockData = {
      deliveries: [{ id: '1', customer: 'Client A', address: 'Site 1', status: 'IN_PROGRESS' as const }],
      installations: [{ id: '2', customer: 'Client B', address: 'Site 2', status: 'PENDING' as const }],
    };
    vi.mocked(fieldServiceService.getTechnicianJobs).mockResolvedValue(mockData);

    const Probe = () => {
      const { data, isLoading } = useFieldServiceJobs();
      if (isLoading) return <div>loading</div>;
      return <div data-testid="data">{data ? `${data.deliveries.length} deliveries, ${data.installations.length} installations` : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('data')).toHaveTextContent('1 deliveries, 1 installations'));
  });
});

describe('useFieldServiceInstallations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('calls getInstallations and returns data', async () => {
    const mockData = [{ id: 'inst-1', asset: { model: 'GE V10', serialNumber: 'SN-001' }, status: 'ASSIGNED' as const }];
    vi.mocked(fieldServiceService.getInstallations).mockResolvedValue(mockData);

    const Probe = () => {
      const { data, isLoading } = useFieldServiceInstallations();
      if (isLoading) return <div>loading</div>;
      return <div data-testid="data">{data ? `${data.length} installations` : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('data')).toHaveTextContent('1 installations'));
  });
});

describe('useFieldServiceShipments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('calls getShipments and returns data', async () => {
    const mockData = [{ id: 'ship-1', trackingNumber: 'TRK-001', salesOrder: { id: 'SO-001' }, status: 'IN_TRANSIT' as const, carrier: 'FastLog' }];
    vi.mocked(fieldServiceService.getShipments).mockResolvedValue(mockData);

    const Probe = () => {
      const { data, isLoading } = useFieldServiceShipments();
      if (isLoading) return <div>loading</div>;
      return <div data-testid="data">{data ? `${data.length} shipments` : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('data')).toHaveTextContent('1 shipments'));
  });
});

describe('useUpdateInstallationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('calls updateInstallationStatus with correct args', async () => {
    vi.mocked(fieldServiceService.updateInstallationStatus).mockResolvedValue(undefined);

    const Probe = () => {
      const { mutate, isSuccess } = useUpdateInstallationStatus();
      return (
        <div>
          <button onClick={() => mutate({ id: 'inst-1', status: 'IN_PROGRESS' })}>mutate</button>
          {isSuccess && <div data-testid="success">done</div>}
        </div>
      );
    };

    render(<Probe />, { wrapper });
    screen.getByText('mutate').click();
    await waitFor(() => expect(fieldServiceService.updateInstallationStatus).toHaveBeenCalledWith('inst-1', 'IN_PROGRESS'));
  });

  it('invalidates installations and technician-jobs cache on success', async () => {
    vi.mocked(fieldServiceService.updateInstallationStatus).mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const Probe = () => {
      const { mutate, isSuccess } = useUpdateInstallationStatus();
      return (
        <div>
          <button onClick={() => mutate({ id: 'inst-1', status: 'IN_PROGRESS' })}>mutate</button>
          {isSuccess && <div data-testid="success">done</div>}
        </div>
      );
    };

    render(<Probe />, { wrapper });
    screen.getByText('mutate').click();
    await waitFor(() => expect(screen.getByTestId('success')).toHaveTextContent('done'));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['field-service', 'installations'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['field-service', 'technician-jobs'] });
    invalidateSpy.mockRestore();
  });
});

describe('useFieldServicePreventiveMaintenance (mock hook)', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('returns hardcoded mock data without calling any service', async () => {
    const Probe = () => {
      const { data, isLoading } = useFieldServicePreventiveMaintenance();
      if (isLoading) return <div>loading</div>;
      return <div data-testid="data">{data ? `${data.length} PM jobs` : 'empty'}</div>;
    };

    render(<Probe />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('data')).toHaveTextContent('2 PM jobs'));
  });
});
