import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ApprovalQueuePanel } from '../ApprovalQueuePanel';

vi.mock('../../../../hooks/use-billing', () => ({
  useApproveVoid: vi.fn(),
  useRejectVoid: vi.fn(),
  useApproveRefund: vi.fn(),
  useRejectRefund: vi.fn(),
}));

import {
  useApproveVoid,
  useRejectVoid,
  useApproveRefund,
  useRejectRefund,
} from '../../../../hooks/use-billing';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (ui: React.ReactElement) =>
  render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    ),
  });

const baseApproval = {
  id: 'APP-1',
  sourceDomain: 'billing',
  recordType: 'PAYMENT_REVERSAL',
  recordId: 'PR-1',
  title: 'Refund request PR-1',
  summary: 'A refund for review',
  riskLevel: 'HIGH' as const,
  status: 'PENDING' as const,
  timestamp: '2026-01-01T00:00:00Z',
  requester: 'cashier@hms.com',
  tenantId: 'T1',
  branchId: 'B1',
  accessLabel: 'billing',
  isMock: false,
  isShell: false,
};

describe('ApprovalQueuePanel UX Honesty', () => {
  let approveVoid: ReturnType<typeof vi.fn>;
  let rejectVoid: ReturnType<typeof vi.fn>;
  let approveRefund: ReturnType<typeof vi.fn>;
  let rejectRefund: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'prompt').mockImplementation(() => '');
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    approveVoid = vi.fn().mockResolvedValue({ ok: true });
    rejectVoid = vi.fn().mockResolvedValue({ ok: true });
    approveRefund = vi.fn().mockResolvedValue({ ok: true });
    rejectRefund = vi.fn().mockResolvedValue({ ok: true });

    vi.mocked(useApproveVoid).mockReturnValue({ approveVoid, loading: false, error: null } as unknown as ReturnType<typeof useApproveVoid>);
    vi.mocked(useRejectVoid).mockReturnValue({ rejectVoid, loading: false, error: null } as unknown as ReturnType<typeof useRejectVoid>);
    vi.mocked(useApproveRefund).mockReturnValue({ approveRefund, loading: false, error: null } as unknown as ReturnType<typeof useApproveRefund>);
    vi.mocked(useRejectRefund).mockReturnValue({ rejectRefund, loading: false, error: null } as unknown as ReturnType<typeof useRejectRefund>);
  });

  it('renders the queue from the provided approvals', () => {
    renderWithProviders(
      <ApprovalQueuePanel approvals={[baseApproval]} isLoading={false} error={null} />
    );
    expect(screen.getByText(/Refund request PR-1/i)).toBeInTheDocument();
  });

  it('does not call window.prompt when approving a billing refund', async () => {
    renderWithProviders(
      <ApprovalQueuePanel approvals={[baseApproval]} isLoading={false} error={null} />
    );

    const approveBtn = screen.getByRole('button', { name: /^approve$/i });
    fireEvent.click(approveBtn);

    const remarks = screen.getByLabelText(/Remarks/i);
    fireEvent.change(remarks, { target: { value: 'Verified' } });

    const submitBtn = screen.getByRole('button', { name: /confirm approve/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(approveRefund).toHaveBeenCalledWith('APP-1', 'Verified');
    });
    expect(window.prompt).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('does not call window.prompt when rejecting a billing refund', async () => {
    renderWithProviders(
      <ApprovalQueuePanel approvals={[baseApproval]} isLoading={false} error={null} />
    );

    const rejectBtn = screen.getByRole('button', { name: /^reject$/i });
    fireEvent.click(rejectBtn);

    const remarks = screen.getByLabelText(/Remarks/i);
    fireEvent.change(remarks, { target: { value: 'Not justified' } });

    const submitBtn = screen.getByRole('button', { name: /confirm reject/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(rejectRefund).toHaveBeenCalledWith('APP-1', 'Not justified');
    });
    expect(window.prompt).not.toHaveBeenCalled();
  });

  it('shows in-component success feedback when approve succeeds', async () => {
    renderWithProviders(
      <ApprovalQueuePanel approvals={[baseApproval]} isLoading={false} error={null} />
    );

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));
    const remarks = screen.getByLabelText(/Remarks/i);
    fireEvent.change(remarks, { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm approve/i }));

    await waitFor(() => {
      expect(screen.getByTestId('approval-feedback')).toBeInTheDocument();
      expect(screen.getByTestId('approval-feedback').textContent).toMatch(/approved/i);
    });
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('shows in-component error feedback when approve fails', async () => {
    approveRefund.mockRejectedValueOnce(new Error('Backend rejected'));

    renderWithProviders(
      <ApprovalQueuePanel approvals={[baseApproval]} isLoading={false} error={null} />
    );

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));
    const remarks = screen.getByLabelText(/Remarks/i);
    fireEvent.change(remarks, { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm approve/i }));

    await waitFor(() => {
      expect(screen.getByTestId('approval-feedback')).toBeInTheDocument();
      expect(screen.getByTestId('approval-feedback').textContent).toMatch(/Backend rejected/i);
    });
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('shows honest shell notice for non-billing domains without using alert', async () => {
    const nonBilling = { ...baseApproval, sourceDomain: 'clinical' };
    renderWithProviders(
      <ApprovalQueuePanel approvals={[nonBilling]} isLoading={false} error={null} />
    );

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('approval-feedback')).toBeInTheDocument();
      expect(screen.getByTestId('approval-feedback').textContent).toMatch(/not yet implemented/i);
    });
    expect(window.alert).not.toHaveBeenCalled();
    expect(approveRefund).not.toHaveBeenCalled();
    expect(approveVoid).not.toHaveBeenCalled();
  });

  it('routes refund recordType to useApproveRefund/useRejectRefund', async () => {
    const refund = { ...baseApproval, recordType: 'PAYMENT_REFUND', title: 'Refund X' };
    renderWithProviders(
      <ApprovalQueuePanel approvals={[refund]} isLoading={false} error={null} />
    );

    fireEvent.click(screen.getByRole('button', { name: /^reject$/i }));
    const remarks = screen.getByLabelText(/Remarks/i);
    fireEvent.change(remarks, { target: { value: 'no' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm reject/i }));

    await waitFor(() => {
      expect(rejectRefund).toHaveBeenCalledWith('APP-1', 'no');
    });
    expect(rejectVoid).not.toHaveBeenCalled();
  });

  it('routes non-refund billing recordType to useApproveVoid/useRejectVoid', async () => {
    const voidReq = { ...baseApproval, recordType: 'PAYMENT_VOID', title: 'Void X' };
    renderWithProviders(
      <ApprovalQueuePanel approvals={[voidReq]} isLoading={false} error={null} />
    );

    fireEvent.click(screen.getByRole('button', { name: /^approve$/i }));
    const remarks = screen.getByLabelText(/Remarks/i);
    fireEvent.change(remarks, { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm approve/i }));

    await waitFor(() => {
      expect(approveVoid).toHaveBeenCalledWith('APP-1', 'ok');
    });
    expect(approveRefund).not.toHaveBeenCalled();
  });
});
