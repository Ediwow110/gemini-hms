import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NursePatientIntakePage } from '../NursePatientIntakePage';
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
    id: 'user-1',
    email: 'nurse@hospital.com',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Branch Admin'],
    permissions: ['patient.view', 'patient.create', 'queue.manage'],
  }),
}));

vi.mock('../../../lib/autodraft/useAutoDraft', () => ({
  useAutoDraft: () => ({
    draftId: 'draft-1',
    recoveredDraft: null,
    discardDraft: vi.fn(),
    clearRecoveredDraft: vi.fn(),
  }),
}));

vi.mock('../../../lib/autodraft/indexedDbDraftStore', () => ({
  safeDeleteAutoDraft: vi.fn().mockResolvedValue(undefined),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/nurse/intake']}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

const fillRequiredDemographics = () => {
  fireEvent.change(screen.getByPlaceholderText(/^e\.g\. John$/i), { target: { value: 'Jane' } });
  fireEvent.change(screen.getByPlaceholderText(/^e\.g\. Doe$/i), { target: { value: 'Doe' } });
  const dobInput = document.querySelector('input[type="date"]') as HTMLInputElement;
  fireEvent.change(dobInput, { target: { value: '1990-05-15' } });
  const genderSelect = document.querySelectorAll('select')[0] as HTMLSelectElement;
  fireEvent.change(genderSelect, { target: { value: 'Female' } });
  fireEvent.change(screen.getByPlaceholderText(/^e\.g\. 555-0199$/), { target: { value: '555-0199' } });
  fireEvent.change(screen.getByPlaceholderText(/^Street, City/i), { target: { value: '123 Main St' } });
  fireEvent.change(screen.getByPlaceholderText(/^Brief description/i), { target: { value: 'Annual checkup' } });
  const deptSelect = document.querySelectorAll('select')[1] as HTMLSelectElement;
  fireEvent.change(deptSelect, { target: { value: 'opd' } });
};

describe('NursePatientIntakePage — real wiring (no fake success)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /v1/patients with the DTO fields on submit', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'P123' } });

    render(<NursePatientIntakePage />, { wrapper: createWrapper() });
    fillRequiredDemographics();

    fireEvent.click(screen.getByRole('button', { name: /Enroll.*Patient/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/patients',
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          dob: '1990-05-15',
          gender: 'Female',
          contactNumber: '555-0199',
          address: '123 Main St',
        })
      );
    });
  });

  it('shows a real success message that does not claim queue routing', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'P123' } });

    render(<NursePatientIntakePage />, { wrapper: createWrapper() });
    fillRequiredDemographics();

    fireEvent.click(screen.getByRole('button', { name: /Enroll.*Patient/i }));

    await waitFor(() => {
      expect(screen.getByText(/Patient Registered/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/routed to the triage queues/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Patient Checked In Successfully/i)).not.toBeInTheDocument();
  });

  it('discloses that insurance/emergency/routing fields are not persisted to the patient record', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'P123' } });

    render(<NursePatientIntakePage />, { wrapper: createWrapper() });
    fillRequiredDemographics();

    fireEvent.click(screen.getByRole('button', { name: /Enroll.*Patient/i }));

    await waitFor(() => {
      expect(screen.getByText(/not.*saved to the patient record/i)).toBeInTheDocument();
    });
  });

  it('surfaces real server error when API returns 4xx (no fake success on failure)', async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { message: 'permission_denied' } },
    });

    render(<NursePatientIntakePage />, { wrapper: createWrapper() });
    fillRequiredDemographics();

    fireEvent.click(screen.getByRole('button', { name: /Enroll.*Patient/i }));

    await waitFor(() => {
      expect(screen.getByText(/permission_denied|Access Restricted|Forbidden/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Patient Checked In Successfully/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Patient Registered/i)).not.toBeInTheDocument();
  });

  it('surfaces real server error message on 5xx failures', async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      isAxiosError: true,
      response: { status: 500, data: { message: 'Database unavailable' } },
    });

    render(<NursePatientIntakePage />, { wrapper: createWrapper() });
    fillRequiredDemographics();

    fireEvent.click(screen.getByRole('button', { name: /Enroll.*Patient/i }));

    await waitFor(() => {
      expect(screen.getByText(/Database unavailable|server error|System Error/i)).toBeInTheDocument();
    });
  });

  it('does not call window.alert on submit (no fake-success alerts)', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'P123' } });

    render(<NursePatientIntakePage />, { wrapper: createWrapper() });
    fillRequiredDemographics();

    fireEvent.click(screen.getByRole('button', { name: /Enroll.*Patient/i }));

    await waitFor(() => {
      expect(screen.getByText(/Patient Registered/i)).toBeInTheDocument();
    });

    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('shows loading state while the request is in flight', async () => {
    let resolvePost: (value: { data: { id: string } }) => void = () => {};
    vi.mocked(apiClient.post).mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      })
    );

    render(<NursePatientIntakePage />, { wrapper: createWrapper() });
    fillRequiredDemographics();

    fireEvent.click(screen.getByRole('button', { name: /Enroll.*Patient/i }));

    await waitFor(() => {
      expect(screen.getByText(/Registering\.\.\./i)).toBeInTheDocument();
    });

    resolvePost({ data: { id: 'P123' } });

    await waitFor(() => {
      expect(screen.getByText(/Patient Registered/i)).toBeInTheDocument();
    });
  });

  it('returns to a fresh form when Start New Registration is clicked after success', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'P123' } });

    render(<NursePatientIntakePage />, { wrapper: createWrapper() });
    fillRequiredDemographics();

    fireEvent.click(screen.getByRole('button', { name: /Enroll.*Patient/i }));

    await waitFor(() => {
      expect(screen.getByText(/Patient Registered/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Start New Registration/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/^e\.g\. John$/i)).toHaveValue('');
    });
  });
});
