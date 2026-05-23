import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NurseVitalsPage } from '../NurseVitalsPage';
import { apiClient } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
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
    permissions: ['record_vitals'],
  }),
}));

const mockPatientSummary = {
  id: 'pat-1',
  patientId: 'pat-1',
  patientName: 'John Doe',
  patientNumber: 'MRN-001',
  dob: new Date('1990-01-01'),
  gender: 'Male',
  recentEncounters: 2,
  activePrescriptions: 1,
  pendingLabResults: 0,
  status: 'ACTIVE',
  timestamp: new Date(),
  accessLabel: 'Clinical Summary',
  isReadOnly: true,
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/nurse/vitals?patientId=pat-1']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('NurseVitalsPage Save Mutation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows Access Restricted when save returns 403 Forbidden', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({ data: mockPatientSummary });
      }
      return Promise.resolve({ data: [] });
    });

    const error = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Forbidden',
      response: { status: 403, data: { message: 'Forbidden' } },
    };
    vi.mocked(apiClient.post).mockRejectedValue(error);

    render(<NurseVitalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Update Physiological Parameters/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Commit Vital Signs'));

    await waitFor(() => {
      expect(screen.getByText(/Access Restricted/)).toBeInTheDocument();
    });

    expect(screen.queryByText('Forbidden')).not.toBeInTheDocument();
  });

  it('displays validation error safely when backend returns 400', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({ data: mockPatientSummary });
      }
      return Promise.resolve({ data: [] });
    });

    const error = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Bad Request',
      response: {
        status: 400,
        data: { message: 'validation_error: at_least_one_vital_required' },
      },
    };
    vi.mocked(apiClient.post).mockRejectedValue(error);

    render(<NurseVitalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Update Physiological Parameters/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Commit Vital Signs'));

    await waitFor(() => {
      expect(screen.getByText(/Validation error/)).toBeInTheDocument();
    });

    expect(screen.queryByText('validation_error: at_least_one_vital_required')).not.toBeInTheDocument();
  });

  it('displays network error safely when connection fails', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({ data: mockPatientSummary });
      }
      return Promise.resolve({ data: [] });
    });

    const error = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Network Error',
      response: undefined,
    };
    vi.mocked(apiClient.post).mockRejectedValue(error);

    render(<NurseVitalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Update Physiological Parameters/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Commit Vital Signs'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to save vitals/)).toBeInTheDocument();
    });
  });

  it('shows success state when vitals saved successfully', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({ data: mockPatientSummary });
      }
      return Promise.resolve({ data: [] });
    });

    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        id: 'vitals-1',
        encounterId: 'enc-1',
        patientId: 'pat-1',
        systolicBp: 120,
        diastolicBp: 80,
        temperature: 36.6,
        heartRate: 72,
        respiratoryRate: 16,
        recordedAt: new Date(),
        timestamp: new Date(),
        status: 'RECORDED',
        accessLabel: 'Clinical Vitals',
        isReadOnly: true,
      },
    });

    render(<NurseVitalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Update Physiological Parameters/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Commit Vital Signs'));

    await waitFor(() => {
      expect(screen.getByText('Vitals Recorded Successfully')).toBeInTheDocument();
    });
  });
});
