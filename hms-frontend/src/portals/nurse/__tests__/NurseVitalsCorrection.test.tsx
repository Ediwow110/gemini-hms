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

const mockVitals = [
  {
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
    recordedBy: 'nurse-1',
    status: 'ACTIVE',
    accessLabel: 'Clinical Vitals',
    isReadOnly: true,
  },
];

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

function queryTextWithIcons(text: string) {
  return screen.queryByText((_content, element) => {
    return element?.textContent?.trim().includes(text) ?? false;
  });
}

describe('NurseVitalsPage Correction Workflow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('opens error modal when Mark Error is clicked and submits successfully', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({ data: mockPatientSummary });
      }
      if (url.includes('/vitals')) {
        return Promise.resolve({ data: mockVitals });
      }
      return Promise.resolve({ data: [] });
    });

    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

    render(<NurseVitalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText('Mark Error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Mark Error'));

    // Use role matcher to find the heading in the modal
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Mark Vitals as Error/i })).toBeInTheDocument();
    });

    const reasonInput = await screen.findByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Faulty equipment' } });

    fireEvent.click(screen.getByText('Confirm Error'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/entered-in-error'),
        expect.objectContaining({ reason: 'Faulty equipment' })
      );
    });

    await waitFor(() => {
      expect(queryTextWithIcons('Mark Vitals as Error')).not.toBeInTheDocument();
    });
  });

  it('shows error message in modal when correction fails', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/summary')) return Promise.resolve({ data: mockPatientSummary });
      if (url.includes('/vitals')) return Promise.resolve({ data: mockVitals });
      return Promise.resolve({ data: [] });
    });

    const error = Object.assign(new Error('Forbidden'), {
      isAxiosError: true,
      response: { status: 403, data: { message: 'access_denied' } },
    });
    vi.mocked(apiClient.post).mockRejectedValue(error);

    render(<NurseVitalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText('Mark Error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Mark Error'));

    const reasonInput = await screen.findByLabelText(/Reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Test error' } });
    fireEvent.click(screen.getByText('Confirm Error'));

    // For 403 errors, the component shows "Access Restricted" text
    await waitFor(() => {
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    });
  });

  it('shows strikethrough for entered-in-error vitals', async () => {
    const errorVitals = [
      {
        ...mockVitals[0],
        status: 'ENTERED_IN_ERROR',
      },
    ];

    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({ data: mockPatientSummary });
      }
      if (url.includes('/vitals')) {
        return Promise.resolve({ data: errorVitals });
      }
      return Promise.resolve({ data: [] });
    });

    render(<NurseVitalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Entered in Error')).toBeInTheDocument();
    });

    expect(screen.queryByText('Mark Error')).not.toBeInTheDocument();
  });
});
