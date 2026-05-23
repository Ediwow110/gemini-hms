import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NurseTriageQueuePage } from '../NurseTriageQueuePage';
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
    serviceType: 'DOCTOR',
    status: 'WAITING',
    waitTimeMinutes: 10,
    timestamp: new Date(),
    branchId: 'branch-1',
    tenantId: 'tenant-1',
  },
];

const mockPatientSummary = {
  id: 'pat-1',
  patientId: 'pat-1',
  patientName: 'John Doe',
  patientNumber: 'MRN-001',
  dob: new Date('1990-01-01'),
  gender: 'Male',
  status: 'ACTIVE',
  allergies: ['Peanuts'],
};

const mockTriageActive = [
  {
    id: 'triage-1',
    patientId: 'pat-1',
    acuityLevel: 'YELLOW',
    chiefComplaintSummary: 'Previous headache',
    arrivalMode: 'WALK_IN',
    status: 'ACTIVE',
    recordedAt: new Date().toISOString(),
    infectiousRiskFlag: false,
    fallRiskFlag: false,
    pregnancyFlag: false,
  },
];

const mockTriageMixed = [
  {
    id: 'triage-1',
    patientId: 'pat-1',
    acuityLevel: 'YELLOW',
    chiefComplaintSummary: 'Previous headache',
    arrivalMode: 'WALK_IN',
    status: 'ACTIVE',
    recordedAt: new Date().toISOString(),
    infectiousRiskFlag: false,
    fallRiskFlag: false,
    pregnancyFlag: false,
  },
  {
    id: 'triage-2',
    patientId: 'pat-1',
    acuityLevel: 'RED',
    chiefComplaintSummary: 'Errored record',
    arrivalMode: 'AMBULANCE',
    status: 'ENTERED_IN_ERROR',
    recordedAt: new Date().toISOString(),
    infectiousRiskFlag: false,
    fallRiskFlag: false,
    pregnancyFlag: false,
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/nurse/triage?patientId=pat-1']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const setupGetMock = (triageData: Record<string, unknown>[] = []) => {
  vi.mocked(apiClient.get).mockImplementation((url: string) => {
    if (url.includes('/work-queue')) return Promise.resolve({ data: mockQueueData });
    if (url.includes('/summary')) return Promise.resolve({ data: mockPatientSummary });
    if (url.includes('/triage')) return Promise.resolve({ data: triageData });
    return Promise.resolve({ data: [] });
  });
};

describe('NurseTriageQueuePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders triage workstation and allows successful submission', async () => {
    setupGetMock();
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    const complaintInput = screen.getByPlaceholderText(/Brief summary/);
    fireEvent.change(complaintInput, { target: { value: 'Severe headache' } });

    const allergyCheck = screen.getByLabelText(/I confirm/);
    fireEvent.click(allergyCheck);

    const submitBtn = screen.getByText('Complete Triage Assessment');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/triage'),
        expect.objectContaining({
          chiefComplaintSummary: 'Severe headache',
          acuityLevel: 'YELLOW',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Triage Completed Successfully')).toBeInTheDocument();
    });
  });

  it('renders Access Restricted when 403 error occurs', async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403 }
    });

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });
  });

  it('disables submit button if form is invalid', async () => {
    setupGetMock();

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    const submitBtn = screen.getByText('Complete Triage Assessment');
    expect(submitBtn).toBeDisabled();
  });

  // --- Correction-specific tests ---

  it('shows Mark Error button only for ACTIVE triage records', async () => {
    setupGetMock(mockTriageMixed);

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Previous headache/)).toBeInTheDocument();
    });

    // Only 1 Mark Error button for the ACTIVE record, not for ENTERED_IN_ERROR
    const markErrorBtns = screen.getAllByText('Mark Error');
    expect(markErrorBtns).toHaveLength(1);
  });

  it('hides Mark Error for ENTERED_IN_ERROR records and shows label', async () => {
    setupGetMock(mockTriageMixed);

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Errored record/)).toBeInTheDocument();
    });

    expect(screen.getByText('Entered in Error')).toBeInTheDocument();
  });

  it('requires reason before submitting correction', async () => {
    setupGetMock(mockTriageActive);
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Mark Error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Mark Error'));

    await waitFor(() => {
      expect(screen.getByText('Mark Triage as Error')).toBeInTheDocument();
    });

    // Confirm Error button should be disabled when reason is empty
    const confirmBtn = screen.getByText('Confirm Error');
    expect(confirmBtn).toBeDisabled();
  });

  it('displays historical triage records and allows marking as error', async () => {
    setupGetMock(mockTriageActive);
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Previous headache/)).toBeInTheDocument();
    });

    const markErrorBtn = screen.getByText('Mark Error');
    fireEvent.click(markErrorBtn);

    await waitFor(() => {
      expect(screen.getByText('Mark Triage as Error')).toBeInTheDocument();
    });

    const reasonInput = screen.getByPlaceholderText(/Wrong patient/);
    fireEvent.change(reasonInput, { target: { value: 'Wrong record' } });

    const confirmBtn = screen.getByText('Confirm Error');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/triage/triage-1/entered-in-error'),
        expect.objectContaining({ reason: 'Wrong record' })
      );
    });
  });

  it('renders 403 error safely when correction is rejected', async () => {
    setupGetMock(mockTriageActive);
    vi.mocked(apiClient.post).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403 },
    });

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Mark Error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Mark Error'));

    await waitFor(() => {
      expect(screen.getByText('Mark Triage as Error')).toBeInTheDocument();
    });

    const reasonInput = screen.getByPlaceholderText(/Wrong patient/);
    fireEvent.change(reasonInput, { target: { value: 'Test reason' } });

    fireEvent.click(screen.getByText('Confirm Error'));

    await waitFor(() => {
      expect(screen.getByText(/Access Restricted/)).toBeInTheDocument();
    });
  });

  it('renders network error safely when correction fails', async () => {
    setupGetMock(mockTriageActive);
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network Error'));

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Mark Error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Mark Error'));

    await waitFor(() => {
      expect(screen.getByText('Mark Triage as Error')).toBeInTheDocument();
    });

    const reasonInput = screen.getByPlaceholderText(/Wrong patient/);
    fireEvent.change(reasonInput, { target: { value: 'Test reason' } });

    fireEvent.click(screen.getByText('Confirm Error'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to mark error/)).toBeInTheDocument();
    });
  });

  it('does not use mock fallback after failed correction', async () => {
    setupGetMock(mockTriageActive);
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network Error'));

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Mark Error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Mark Error'));

    await waitFor(() => {
      expect(screen.getByText('Mark Triage as Error')).toBeInTheDocument();
    });

    const reasonInput = screen.getByPlaceholderText(/Wrong patient/);
    fireEvent.change(reasonInput, { target: { value: 'Test reason' } });

    fireEvent.click(screen.getByText('Confirm Error'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to mark error/)).toBeInTheDocument();
    });

    // Modal should still be open - no mock fallback, no auto-close on error
    expect(screen.getByText('Mark Triage as Error')).toBeInTheDocument();
  });
});
