import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ApprovalCenter } from '../ApprovalCenter';
import { AuthContext } from '../../../hooks/use-user';
import { approvalService, type ApprovalRequest } from '../../../services/approval.service';

vi.mock('../../../services/approval.service', () => ({
  approvalService: {
    getRequests: vi.fn(),
    approveRequest: vi.fn(),
    rejectRequest: vi.fn(),
  },
}));

const mockUser = {
  id: 'U-approver',
  email: 'approver@hms.test',
  tenantId: 'T-1',
  branchId: 'B-1',
  roles: ['Approver'],
  permissions: ['approval.request.process'],
};

const sampleRequest: ApprovalRequest = {
  id: 'APR-1',
  type: 'ADMIN_PRIVILEGED_USER_ACTIVATE',
  riskLevel: 'HIGH',
  requesterId: 'U-requester',
  requester: {
    id: 'U-requester',
    email: 'requester@hms.test',
  },
  recordId: 'REC-1',
  status: 'PENDING',
  reason: 'Access restoration required',
  details: { targetUserId: 'U-target' },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const renderWithAuth = () => {
  return render(
    <AuthContext.Provider value={{ user: mockUser, isLoading: false, logout: vi.fn(), refetchUser: vi.fn() }}>
      <BrowserRouter>
        <ApprovalCenter />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

const openSelectedRequest = async () => {
  renderWithAuth();

  const requestType = await screen.findByText(/ADMIN PRIVILEGED USER ACTIVATE/i);
  fireEvent.click(requestType.closest('tr') as HTMLElement);
};

const openApproveModal = async () => {
  await openSelectedRequest();
  fireEvent.click(screen.getByRole('button', { name: /^Approve$/i }));
  await screen.findByRole('heading', { name: /Approve Request/i });
};

describe('ApprovalCenter approval confirmation enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(approvalService.getRequests).mockResolvedValue([sampleRequest]);
    vi.mocked(approvalService.approveRequest).mockResolvedValue({});
    vi.mocked(approvalService.rejectRequest).mockResolvedValue({});
  });

  it('does not approve while the policy authorization checkbox is unchecked', async () => {
    await openApproveModal();

    fireEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));

    expect(approvalService.approveRequest).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/confirm policy authorization/i);
  });

  it('approves only after the policy authorization checkbox is checked', async () => {
    await openApproveModal();

    fireEvent.click(screen.getByRole('checkbox', { name: /I confirm I have verified/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));

    await waitFor(() => {
      expect(approvalService.approveRequest).toHaveBeenCalledWith(
        sampleRequest.id,
        sampleRequest.type,
        'Approved per policy',
        sampleRequest.details
      );
    });
  });

  it('resets the policy authorization checkbox after the modal closes and reopens', async () => {
    await openApproveModal();

    const checkbox = screen.getByRole('checkbox', { name: /I confirm I have verified/i });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Approve$/i }));

    const reopenedCheckbox = await screen.findByRole('checkbox', { name: /I confirm I have verified/i });
    expect(reopenedCheckbox).not.toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));
    expect(approvalService.approveRequest).not.toHaveBeenCalled();
  });

  it('keeps the reject flow independent of approval checkbox enforcement', async () => {
    await openSelectedRequest();

    fireEvent.click(screen.getByRole('button', { name: /^Reject$/i }));
    fireEvent.change(await screen.findByPlaceholderText(/Enter your reason/i), {
      target: { value: 'Insufficient policy basis' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));

    await waitFor(() => {
      expect(approvalService.rejectRequest).toHaveBeenCalledWith(
        sampleRequest.id,
        sampleRequest.type,
        'Insufficient policy basis',
        sampleRequest.details
      );
    });
    expect(approvalService.approveRequest).not.toHaveBeenCalled();
  });

  it('shows inline approval failure feedback without calling window.alert', async () => {
    vi.mocked(approvalService.approveRequest).mockRejectedValue({
      response: { data: { message: 'Approval service unavailable' } },
    });

    await openApproveModal();

    fireEvent.click(screen.getByRole('checkbox', { name: /I confirm I have verified/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Approval service unavailable/i);
    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /Approve Request/i })).toBeInTheDocument();
  });

  it('shows inline rejection failure feedback without calling window.alert', async () => {
    vi.mocked(approvalService.rejectRequest).mockRejectedValue({
      response: { data: { message: 'Rejection service unavailable' } },
    });

    await openSelectedRequest();

    fireEvent.click(screen.getByRole('button', { name: /^Reject$/i }));
    fireEvent.change(await screen.findByPlaceholderText(/Enter your reason/i), {
      target: { value: 'Insufficient policy basis' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Rejection service unavailable/i);
    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /Reject Request/i })).toBeInTheDocument();
  });
});
