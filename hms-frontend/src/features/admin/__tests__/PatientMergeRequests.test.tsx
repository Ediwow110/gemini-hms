import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PatientMergeRequests } from '../PatientMergeRequests';
import { apiClient } from '../../../lib/api';
import { AuthContext } from '../../../hooks/use-user';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockUser = {
  id: 'U123',
  email: 'admin@hms.com',
  tenantId: 'T123',
  branchId: 'B123',
  roles: ['Super Admin'],
  permissions: ['patient.merge.request', 'patient.merge.approve'],
};

const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isLoading: false, logout: vi.fn(), refetchUser: vi.fn() }}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

const sampleRequest = {
  id: 'MRG-1',
  sourcePatientId: 'S1',
  targetPatientId: 'T1',
  status: 'PENDING',
  requesterId: 'U-other',
  reason: 'Duplicate chart',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  sourcePatient: { patientNumber: 'P1', firstName: 'S', lastName: 'S', dob: '1990-01-01' },
  targetPatient: { patientNumber: 'P2', firstName: 'T', lastName: 'T', dob: '1990-01-01' },
};

describe('PatientMergeRequests Contract Honesty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'prompt').mockImplementation(() => '');
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('fetches the merge request list from the real backend endpoint family', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [], total: 0 } });
    renderWithAuth(<PatientMergeRequests />);
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/patients/merge-requests');
    });
    expect(apiClient.get).not.toHaveBeenCalledWith('/v1/admin/patient-merges');
  });

  it('approves a pending merge request by calling the real approve endpoint with remarks', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: [sampleRequest], total: 1 },
    });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'MRG-1', status: 'APPROVED' } });

    renderWithAuth(<PatientMergeRequests />);
    const requestBtn = await screen.findByText(/Merge: S/i);
    fireEvent.click(requestBtn);

    const approveBtn = screen.getByRole('button', { name: /Approve Merge/i });
    expect(approveBtn).not.toBeDisabled();
    fireEvent.click(approveBtn);

    const remarksInput = await screen.findByPlaceholderText(/remarks/i);
    fireEvent.change(remarksInput, { target: { value: 'Verified duplicate' } });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Approve/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/patients/merge-requests/MRG-1/approve',
        { remarks: 'Verified duplicate' }
      );
    });
  });

  it('rejects a pending merge request by calling the real reject endpoint with reason', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: [sampleRequest], total: 1 },
    });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'MRG-1', status: 'REJECTED' } });

    renderWithAuth(<PatientMergeRequests />);
    const requestBtn = await screen.findByText(/Merge: S/i);
    fireEvent.click(requestBtn);

    const rejectBtn = screen.getByRole('button', { name: /Reject Merge/i });
    expect(rejectBtn).not.toBeDisabled();
    fireEvent.click(rejectBtn);

    const reasonInput = await screen.findByPlaceholderText(/reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Not a duplicate' } });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Reject/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/patients/merge-requests/MRG-1/reject',
        { reason: 'Not a duplicate' }
      );
    });
  });

  it('rejects with required reason — empty reason is not submitted', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: [sampleRequest], total: 1 },
    });

    renderWithAuth(<PatientMergeRequests />);
    const requestBtn = await screen.findByText(/Merge: S/i);
    fireEvent.click(requestBtn);

    fireEvent.click(screen.getByRole('button', { name: /Reject Merge/i }));
    const reasonInput = await screen.findByPlaceholderText(/reason/i);
    fireEvent.change(reasonInput, { target: { value: '   ' } });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Reject/i });
    expect(confirmBtn).toBeDisabled();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('does not present an irreversible cascade merge execution UI', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: [sampleRequest], total: 1 },
    });

    renderWithAuth(<PatientMergeRequests />);
    const requestBtn = await screen.findByText(/Merge: S/i);
    fireEvent.click(requestBtn);

    expect(screen.queryByText(/Execute Merge/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CRITICAL: Confirm Permanent Cascade Merge/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Type "MERGE" to authorize/i)).not.toBeInTheDocument();
  });

  it('does not call window.alert or window.prompt in the approve flow', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: [sampleRequest], total: 1 },
    });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'MRG-1', status: 'APPROVED' } });

    renderWithAuth(<PatientMergeRequests />);
    const requestBtn = await screen.findByText(/Merge: S/i);
    fireEvent.click(requestBtn);

    fireEvent.click(screen.getByRole('button', { name: /Approve Merge/i }));
    const remarksInput = await screen.findByPlaceholderText(/remarks/i);
    fireEvent.change(remarksInput, { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirm Approve/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });
    expect(window.alert).not.toHaveBeenCalled();
    expect(window.prompt).not.toHaveBeenCalled();
  });

  it('shows the honest banner about approve/reject being live and cascade execution not yet implemented', async () => {
    renderWithAuth(<PatientMergeRequests />);
    expect(screen.getByText(/Approve and reject are live/i)).toBeInTheDocument();
    expect(screen.getByText(/irreversible cascade merge execution is not yet implemented/i)).toBeInTheDocument();
  });

  it('does not show mock data when API fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));

    renderWithAuth(<PatientMergeRequests />);

    await waitFor(() => {
      expect(screen.getByText(/No pending deduplication requests found/i)).toBeInTheDocument();
    });
  });
});
