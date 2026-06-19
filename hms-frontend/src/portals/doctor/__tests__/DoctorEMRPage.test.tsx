import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../../hooks/use-user';
import DoctorEMRPage from '../DoctorEMRPage';
import { apiClient } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockUser = {
  id: 'U123',
  email: 'doctor@hms.com',
  tenantId: 'T123',
  branchId: 'B123',
  roles: ['Doctor'],
  permissions: ['clinical.encounter.write'],
};

const patientSummaryFixture = {
  id: 'summary-1',
  patientId: 'P-101',
  patientName: 'Patient 001',
  patientNumber: 'MRN-2026-0091',
  dob: '1988-11-24T00:00:00.000Z',
  gender: 'Female',
  recentEncounters: 1,
  activePrescriptions: 0,
  pendingLabResults: 0,
  allergies: ['Penicillin', 'Strawberries'],
  status: 'ACTIVE',
  timestamp: '2026-06-20T00:00:00.000Z',
  accessLabel: 'FULL',
  isReadOnly: false,
};

const setupApiGetMocks = () => {
  vi.mocked(apiClient.get).mockImplementation((url: string) => {
    if (url === '/v1/clinical-workflow/patients/P-101/summary') {
      return Promise.resolve({ data: patientSummaryFixture });
    }
    if (url === '/v1/clinical-workflow/patients/P-101/encounters') {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: [] });
  });
};

const createWrapper = (initialUrl = '/doctor/emr?patientId=P-101') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user: mockUser, isLoading: false, logout: vi.fn(), refetchUser: vi.fn() }}>
        <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe('DoctorEMRPage — pop-culture name cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupApiGetMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not contain pop-culture patient names (Eleanor Vance, Arthur Pendleton, Victor Frankenstein)', async () => {
    render(<DoctorEMRPage />, { wrapper: createWrapper('/doctor/emr?patientId=P-101') });

    await waitFor(() => {
      expect(screen.getByText(/001, Patient/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Eleanor Vance/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Arthur Pendleton/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Victor Frankenstein/i)).not.toBeInTheDocument();
  });

  it('renders neutral Patient 001 identifier for P-101 in LastName, FirstName format', async () => {
    render(<DoctorEMRPage />, { wrapper: createWrapper('/doctor/emr?patientId=P-101') });

    await waitFor(() => {
      expect(screen.getByText(/001, Patient/)).toBeInTheDocument();
    });
  });

  it('fetches patient summary from clinical workflow API when patientId is set', async () => {
    render(<DoctorEMRPage />, { wrapper: createWrapper('/doctor/emr?patientId=P-101') });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/clinical-workflow/patients/P-101/summary');
    });
  });

  it('shows error when patient summary fetch fails', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === '/v1/clinical-workflow/patients/P-101/summary') {
        return Promise.reject({ response: { data: { message: 'Patient not found' } } });
      }
      if (url === '/v1/clinical-workflow/patients/P-101/encounters') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    render(<DoctorEMRPage />, { wrapper: createWrapper('/doctor/emr?patientId=P-101') });

    await waitFor(() => {
      expect(screen.getByText(/Patient not found/i)).toBeInTheDocument();
    });
  });
});