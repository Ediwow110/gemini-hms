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
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not contain pop-culture patient names (Eleanor Vance, Arthur Pendleton, Victor Frankenstein)', async () => {
    render(<DoctorEMRPage />, { wrapper: createWrapper('/doctor/emr?patientId=P-101') });

    // Wait for the patient data to load (350ms timeout in useEffect)
    // The PatientSafetyHeader renders "LastName, FirstName" => "001, Patient"
    await waitFor(() => {
      expect(screen.getByText(/001, Patient/)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Assert pop-culture names are absent
    expect(screen.queryByText(/Eleanor Vance/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Arthur Pendleton/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Victor Frankenstein/i)).not.toBeInTheDocument();
  });

  it('renders neutral Patient 001 identifier for P-101 in LastName, FirstName format', async () => {
    render(<DoctorEMRPage />, { wrapper: createWrapper('/doctor/emr?patientId=P-101') });

    await waitFor(() => {
      expect(screen.getByText(/001, Patient/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
