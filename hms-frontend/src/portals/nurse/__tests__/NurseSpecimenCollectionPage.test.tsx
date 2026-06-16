import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NurseSpecimenCollectionPage } from '../NurseSpecimenCollectionPage';
import { apiClient } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({
    id: 'nurse-1',
    email: 'nurse@hospital.com',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Nurse'],
    permissions: ['record_vitals', 'record_triage'],
  }),
}));

const mockQueueData = [
  {
    id: 'q-1',
    patientId: 'pat-1',
    patientName: 'John Doe',
    patientNumber: 'MRN-001',
    queueNumber: 'A001',
    category: 'REGULAR',
    serviceType: 'LABORATORY',
    status: 'WAITING',
    waitTimeMinutes: 10,
    timestamp: new Date().toISOString(),
    branchId: 'branch-1',
    tenantId: 'tenant-1',
  },
];

const mockLabResults = [
  {
    id: 'res-1',
    orderId: 'order-1',
    orderNumber: 'ORD-001',
    patientId: 'pat-1',
    status: 'PENDING',
    isReleased: false,
    timestamp: new Date().toISOString(),
  },
];

const createWrapper = (initialUrl = '/nurse/specimens?patientId=pat-1') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

const setupApiMock = () => {
  vi.mocked(apiClient.get).mockImplementation((url: string) => {
    if (url.includes('/work-queue')) return Promise.resolve({ data: mockQueueData });
    if (url.includes('/lab-results')) return Promise.resolve({ data: mockLabResults });
    return Promise.resolve({ data: [] });
  });
  vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
  vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
};

describe('NurseSpecimenCollectionPage — honesty hardening', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('does not call window.alert on render or interaction (no fake-success alerts)', async () => {
    setupApiMock();

    render(<NurseSpecimenCollectionPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Queue Ref: A001/)).toBeInTheDocument();
    });

    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('does not surface hardcoded "(Default)" mock fields for specimen metadata', async () => {
    setupApiMock();

    render(<NurseSpecimenCollectionPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Queue Ref: A001/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Default/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dr\. Frankenstein/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lavender Top/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Whole Blood/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Complete Blood Count/)).not.toBeInTheDocument();
  });

  it('marks unavailable fields as "Data unavailable" rather than fake values', async () => {
    setupApiMock();

    render(<NurseSpecimenCollectionPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Queue Ref: A001/)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Data unavailable/).length).toBeGreaterThanOrEqual(3);
  });

  it('disables Print Label button with disclosure title (no mock barcode dispatch)', async () => {
    setupApiMock();

    render(<NurseSpecimenCollectionPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('nursespecimen-print-label-disabled')).toBeInTheDocument();
    });

    const printBtn = screen.getByTestId('nursespecimen-print-label-disabled');
    expect(printBtn).toBeDisabled();
    expect(printBtn.getAttribute('title')).toMatch(/barcode printing/i);

    fireEvent.click(printBtn);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('disables Confirm Sample Collected button with chain-of-custody disclosure (no fake success)', async () => {
    setupApiMock();

    render(<NurseSpecimenCollectionPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('nursespecimen-confirm-collection-disabled')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByTestId('nursespecimen-confirm-collection-disabled');
    expect(confirmBtn).toBeDisabled();
    expect(confirmBtn.getAttribute('title')).toMatch(/chain-of-custody|backend endpoint/i);

    fireEvent.click(confirmBtn);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('disables the label-confirmation checkbox', async () => {
    setupApiMock();

    render(<NurseSpecimenCollectionPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('nursespecimen-confirm-label-disabled')).toBeInTheDocument();
    });

    const checkbox = screen.getByTestId('nursespecimen-confirm-label-disabled') as HTMLInputElement;
    expect(checkbox).toBeDisabled();
    expect(checkbox.checked).toBe(false);
  });

  it('does not POST or PATCH to any specimen-collection endpoint on click (no fake wiring)', async () => {
    setupApiMock();

    render(<NurseSpecimenCollectionPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('nursespecimen-confirm-collection-disabled')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nursespecimen-print-label-disabled'));
    fireEvent.click(screen.getByTestId('nursespecimen-confirm-collection-disabled'));

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(apiClient.patch).not.toHaveBeenCalled();
    expect(apiClient.put).not.toHaveBeenCalled();
  });

  it('still loads and renders the real work-queue and lab-results read-only data', async () => {
    setupApiMock();

    render(<NurseSpecimenCollectionPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Queue Ref: A001/)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/John Doe/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Order: A001/)).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/work-queue'),
      expect.anything()
    );
  });

  it('renders Access Restricted when 403 error occurs', async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403 },
    });

    render(<NurseSpecimenCollectionPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });
});
