/** @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DoctorSOAPEditor } from '../components/DoctorSOAPEditor';
import { TestWrapper } from '../../../test/test-utils';
import { apiClient } from '../../../lib/api';
import { AxiosError, AxiosResponse } from 'axios';

// Mock the apiClient
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

// Mock the useUser hook
vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({
    id: 'doc-1',
    email: 'doctor@example.com',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Doctor'],
    permissions: ['edit_soap_notes'],
  }),
}));

describe('DoctorSOAPEditor Component Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', async () => {
    // Return a promise that does not resolve immediately
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    render(
      <TestWrapper>
        <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
      </TestWrapper>
    );

    // Wait a tick for the query to register as pending
    await waitFor(() => {
      expect(screen.getByText('Loading SOAP draft...')).toBeInTheDocument();
    });
  });

  it('renders empty draft content when no draft exists', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: null,
    });

    render(
      <TestWrapper>
        <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading SOAP draft...')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('Patient complains of...')).toHaveValue('');
      expect(screen.getByPlaceholderText('Vitals reviewed. Heart sounds normal...')).toHaveValue('');
      expect(screen.getByPlaceholderText('Impression: Primary hypertension, stable...')).toHaveValue('');
      expect(screen.getByPlaceholderText('Rx: Amlodipine 5mg OD. Recheck BP in 2 weeks...')).toHaveValue('');
    });
  });

  it('renders preloaded draft notes correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        id: 'note-1',
        encounterId: 'encounter-1',
        patientId: 'patient-1',
        subjective: 'History of chronic headaches',
        objective: 'Neurological exam normal',
        assessment: 'Tension headache',
        plan: 'Prescribed Ibuprofen as needed',
        noteType: 'SOAP',
        status: 'DRAFT',
      },
    });

    render(
      <TestWrapper>
        <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading SOAP draft...')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('Patient complains of...')).toHaveValue('History of chronic headaches');
      expect(screen.getByPlaceholderText('Vitals reviewed. Heart sounds normal...')).toHaveValue('Neurological exam normal');
      expect(screen.getByPlaceholderText('Impression: Primary hypertension, stable...')).toHaveValue('Tension headache');
      expect(screen.getByPlaceholderText('Rx: Amlodipine 5mg OD. Recheck BP in 2 weeks...')).toHaveValue('Prescribed Ibuprofen as needed');
    });
  });

  it('disables save button when all fields are empty', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: null,
    });

    render(
      <TestWrapper>
        <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading SOAP draft...')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /Draft Save/i });
    expect(saveButton).toBeDisabled();
  });

  it('disables save button and displays warning when encounterId is missing', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: null,
    });

    render(
      <TestWrapper>
        <DoctorSOAPEditor patientId="patient-1" encounterId={undefined} isLocked={false} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading SOAP draft...')).not.toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /Draft Save/i });
    expect(saveButton).toBeDisabled();
    expect(screen.getByText('No Active Encounter Found')).toBeInTheDocument();
  });

  it('triggers save mutation successfully and renders success notification', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: null });
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        id: 'note-1',
        encounterId: 'encounter-1',
        patientId: 'patient-1',
        subjective: 'Experiencing back pain',
        objective: 'LBP diagnosed',
        assessment: 'Lumbago',
        plan: 'Physical therapy referral',
        noteType: 'SOAP',
        status: 'DRAFT',
      },
    });

    render(
      <TestWrapper>
        <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading SOAP draft...')).not.toBeInTheDocument();
    });

    const subjectiveInput = screen.getByPlaceholderText('Patient complains of...');
    fireEvent.change(subjectiveInput, { target: { value: 'Experiencing back pain' } });

    const saveButton = screen.getByRole('button', { name: /Draft Save/i });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/clinical-workflow/patients/patient-1/encounters/encounter-1/soap-draft',
        expect.objectContaining({ subjective: 'Experiencing back pain' })
      );
    });

    // Success message uses a different element - check for the success text
    expect(screen.getByText('SOAP progress notes successfully saved as draft.')).toBeInTheDocument();
  });

  it('renders Access Restricted when 403 error is returned on fetch and does not leak raw details', async () => {
    const error = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Forbidden Access Error',
      response: {
        status: 403,
        data: {
          secretErrorCode: 'ERR_403_DB_INTERNAL_LEAK',
          details: 'Internal clinical read-only policy violation at backend',
        },
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;

    vi.mocked(apiClient.get).mockRejectedValueOnce(error);

    render(
      <TestWrapper>
        <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    });

    expect(screen.queryByText('ERR_403_DB_INTERNAL_LEAK')).not.toBeInTheDocument();
    expect(screen.queryByText('Internal clinical read-only policy violation')).not.toBeInTheDocument();
  });

  // ==========================================
  // SIGN SOAP TESTS (14 scenarios)
  // ==========================================
  describe('Sign SOAP', () => {
    it('renders Sign SOAP button when note is unlocked', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'DRAFT',
          lockedAt: null,
        },
      });

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Sign SOAP/i)).toBeInTheDocument();
      });
    });

    it('shows SOAP Signed & Finalized badge when note is locked', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'SIGNED',
          lockedAt: '2026-05-22T10:00:00Z',
          lockedBy: 'doc-1',
        },
      });

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SOAP Signed & Finalized/i)).toBeInTheDocument();
      });
    });

    it('opens confirmation modal when Sign SOAP is clicked', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'DRAFT',
          lockedAt: null,
        },
      });

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Sign SOAP/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sign SOAP/i));

      await waitFor(() => {
        expect(screen.getByText('Finalize & Sign SOAP Notes')).toBeInTheDocument();
      });
    });

    it('displays permanent warning in confirmation modal', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'DRAFT',
          lockedAt: null,
        },
      });

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Sign SOAP/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sign SOAP/i));

      await waitFor(() => {
        expect(screen.getByText('This action is permanent and cannot be undone.')).toBeInTheDocument();
      });
    });

    it('modal has Cancel button that closes the modal', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'DRAFT',
          lockedAt: null,
        },
      });

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Sign SOAP/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sign SOAP/i));
      await waitFor(() => {
        expect(screen.getByText('Finalize & Sign SOAP Notes')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(() => {
        expect(screen.queryByText('Finalize & Sign SOAP Notes')).not.toBeInTheDocument();
      });
    });

    it('closing modal by clicking backdrop also dismisses it', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'DRAFT',
          lockedAt: null,
        },
      });

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Sign SOAP/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sign SOAP/i));
      await waitFor(() => {
        expect(screen.getByText('Finalize & Sign SOAP Notes')).toBeInTheDocument();
      });

      const overlay = document.querySelector('.fixed.inset-0');
      if (overlay) {
        fireEvent.click(overlay);
        await waitFor(() => {
          expect(screen.queryByText('Finalize & Sign SOAP Notes')).not.toBeInTheDocument();
        });
      }
    });

    it('triggers signSOAP mutation and shows success notification on confirm', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'DRAFT',
          lockedAt: null,
        },
      });

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'SIGNED',
          lockedAt: '2026-05-22T10:00:00Z',
          lockedBy: 'doc-1',
        },
      });

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Sign SOAP/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sign SOAP/i));
      await waitFor(() => {
        expect(screen.getByText('Finalize & Sign SOAP Notes')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Confirm Sign'));

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/v1/clinical-workflow/patients/patient-1/encounters/encounter-1/soap-sign',
          expect.any(Object)
        );
      });
    });

    it('hides Draft Save button and shows signed badge after signing', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'SIGNED',
          lockedAt: '2026-05-22T10:00:00Z',
          lockedBy: 'doc-1',
        },
      });

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SOAP Signed & Finalized/i)).toBeInTheDocument();
      });

      expect(screen.queryByText('Draft Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign SOAP')).not.toBeInTheDocument();
    });

    it('Sign SOAP button is disabled when encounterId is missing', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: null });

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId={undefined} isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading SOAP draft...')).not.toBeInTheDocument();
      });

      const signButton = screen.getByText(/Sign SOAP/i);
      expect(signButton).toBeDisabled();
    });

    it('shows error banner when sign mutation fails with 400', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'DRAFT',
          lockedAt: null,
        },
      });

      const error = {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Bad Request',
        response: {
          status: 400,
          data: { message: 'validation_error: no_draft_soap_to_sign' },
        } as unknown as AxiosResponse,
      } as unknown as AxiosError;

      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Sign SOAP/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sign SOAP/i));

      // The modal shows Confirm Sign button, which closes the modal and triggers mutation
      await waitFor(() => {
        expect(screen.getByText('Finalize & Sign SOAP Notes')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Confirm Sign'));

      await waitFor(() => {
        expect(screen.getByText('Error Saving Draft')).toBeInTheDocument();
      });
    });

    it('shows Access Restricted when sign fails with 403', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'DRAFT',
          lockedAt: null,
        },
      });

      const error = {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Forbidden',
        response: {
          status: 403,
          data: { message: 'access_denied: unauthorized_role' },
        } as unknown as AxiosResponse,
      } as unknown as AxiosError;

      vi.mocked(apiClient.post).mockRejectedValueOnce(error);

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Sign SOAP/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Sign SOAP/i));

      await waitFor(() => {
        expect(screen.getByText('Finalize & Sign SOAP Notes')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Confirm Sign'));

      await waitFor(() => {
        expect(screen.getByText('Access Restricted')).toBeInTheDocument();
      });
    });

    it('Sign SOAP button is disabled when note is already signed', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Test',
          objective: 'Test',
          assessment: 'Test',
          plan: 'Test',
          noteType: 'SOAP',
          status: 'SIGNED',
          lockedAt: '2026-05-22T10:00:00Z',
          lockedBy: 'doc-1',
        },
      });

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/SOAP Signed & Finalized/i)).toBeInTheDocument();
      });

      expect(screen.queryByText('Sign SOAP')).not.toBeInTheDocument();
    });

    it('textarea fields are disabled when note is signed', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'note-1',
          encounterId: 'encounter-1',
          patientId: 'patient-1',
          subjective: 'Final diagnosis',
          objective: 'All clear',
          assessment: 'Healthy',
          plan: 'Discharge',
          noteType: 'SOAP',
          status: 'SIGNED',
          lockedAt: '2026-05-22T10:00:00Z',
          lockedBy: 'doc-1',
        },
      });

      render(
        <TestWrapper>
          <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading SOAP draft...')).not.toBeInTheDocument();
      });

      const textareas = screen.getAllByRole('textbox');
      textareas.forEach((ta) => {
        expect(ta).toBeDisabled();
      });
    });
  });

  it('renders Error Saving Draft when post request fails', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: null });
    const error = {
      isAxiosError: true,
      name: 'AxiosError',
      message: 'Bad Request',
      response: {
        status: 400,
        data: {
          message: 'Plan field is too long',
        },
      } as unknown as AxiosResponse,
    } as unknown as AxiosError;

    vi.mocked(apiClient.post).mockRejectedValueOnce(error);

    render(
      <TestWrapper>
        <DoctorSOAPEditor patientId="patient-1" encounterId="encounter-1" isLocked={false} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading SOAP draft...')).not.toBeInTheDocument();
    });

    const subjectiveInput = screen.getByPlaceholderText('Patient complains of...');
    fireEvent.change(subjectiveInput, { target: { value: 'Experiencing back pain' } });

    const saveButton = screen.getByRole('button', { name: /Draft Save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Error Saving Draft')).toBeInTheDocument();
    });

    expect(screen.getByText('Plan field is too long')).toBeInTheDocument();
  });
});
