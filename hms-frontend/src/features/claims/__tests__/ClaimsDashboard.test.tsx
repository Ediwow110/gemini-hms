/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ClaimsDashboard } from '../ClaimsDashboard';
import { apiClient } from '../../../lib/api';
import { AuthContext } from '../../../hooks/use-user';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockUser = {
  id: 'U123',
  email: 'cashier@hms.com',
  tenantId: 'T123',
  branchId: 'B123',
  roles: ['Cashier'],
  permissions: ['billing.claim.view', 'billing.claim.process'],
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

const partnerFixture = [
  { id: 'p-1', name: 'Maxicare', code: 'MAX', status: 'ACTIVE' },
  { id: 'p-2', name: 'PhilHealth', code: 'PHIC', status: 'ACTIVE' },
];

const submittedClaimFixture = [
  {
    id: 'c-1',
    claimNumber: 'CLM-000001',
    loaNumber: 'LOA-12345',
    amountClaimed: '1000.00',
    amountApproved: null,
    status: 'SUBMITTED',
    remarks: null,
    invoice: {
      id: 'inv-1',
      order: { patient: { firstName: 'Patient', lastName: '001' } },
    },
  },
];

const pendingClaimFixture = [
  {
    id: 'c-2',
    claimNumber: 'CLM-000002',
    loaNumber: null,
    amountClaimed: '500.00',
    amountApproved: null,
    status: 'PENDING',
    remarks: null,
    invoice: {
      id: 'inv-2',
      order: { patient: { firstName: 'Patient', lastName: '002' } },
    },
  },
];

describe('ClaimsDashboard — real /v1/claims/* contract (post-route-fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches partners and claims from the real /v1/claims/* route family', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: partnerFixture })
      .mockResolvedValueOnce({ data: submittedClaimFixture });

    renderWithAuth(<ClaimsDashboard />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/claims/partners');
    });
    expect(apiClient.get).toHaveBeenCalledWith('/v1/claims');
  });

  it('does NOT call the non-existent /v1/insurance/* path family', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    renderWithAuth(<ClaimsDashboard />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });

    const calledUrls = (apiClient.get as any).mock.calls.map((c: unknown[]) => c[0]);
    expect(calledUrls).not.toContain('/v1/insurance/partners');
    expect(calledUrls).not.toContain('/v1/insurance/claims');
  });

  it('discloses the live /v1/claims/* contract in the page banner', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    renderWithAuth(<ClaimsDashboard />);

    expect(screen.getByText(/Live backend contract/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\/v1\/claims\/partners/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\/v1\/claims\/:id\/status/).length).toBeGreaterThan(0);
  });

  it('does NOT contain stale false-disclosure text about /v1/insurance/* being unimplemented', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    renderWithAuth(<ClaimsDashboard />);

    expect(screen.queryByText(/no backend implementation yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not implemented in the current backend release/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/read-only mode/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/HTTP 404/i)).not.toBeInTheDocument();
  });

  it('does NOT introduce fabricated partner or claim data when API fails', async () => {
    (apiClient.get as any).mockRejectedValue(new Error('Network Error'));
    renderWithAuth(<ClaimsDashboard />);
    expect(await screen.findByText(/Failed to fetch claims data/i)).toBeInTheDocument();
    expect(screen.queryByText(/Maxicare/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CLM-FAKE-/i)).not.toBeInTheDocument();
  });

  it('does NOT call window.alert() during normal page render or on fetch failure', async () => {
    (apiClient.get as any).mockRejectedValue(new Error('Network Error'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithAuth(<ClaimsDashboard />);
    await screen.findByText(/Failed to fetch claims data/i);
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('Save Reconciliation is now FUNCTIONAL (not disabled) and wires to PATCH /v1/claims/:id/status', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: partnerFixture })
      .mockResolvedValueOnce({ data: submittedClaimFixture });
    (apiClient.patch as any).mockResolvedValue({ data: { status: 'APPROVED' } });

    renderWithAuth(<ClaimsDashboard />);

    const reconcileButton = await screen.findByRole('button', { name: /reconcile/i });
    fireEvent.click(reconcileButton);

    const saveButton = await screen.findByTestId('save-reconciliation');
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/v1/claims/c-1/status',
        expect.objectContaining({ status: 'APPROVED', amountApproved: expect.any(Number) }),
      );
    });
  });

  it('Save Reconciliation uses PATCH /v1/claims/:id/status with the correct backend DTO (no client-trusted tenantId, amountApproved key)', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: partnerFixture })
      .mockResolvedValueOnce({ data: submittedClaimFixture });
    (apiClient.patch as any).mockResolvedValue({ data: {} });

    renderWithAuth(<ClaimsDashboard />);

    fireEvent.click(await screen.findByRole('button', { name: /reconcile/i }));

    const amountInput = await screen.findByTestId('approved-amount-input');
    fireEvent.change(amountInput, { target: { value: '750' } });

    fireEvent.click(screen.getByTestId('save-reconciliation'));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalled();
    });

    const patchCall = (apiClient.patch as any).mock.calls[0];
    const [url, body] = patchCall;
    expect(url).toBe('/v1/claims/c-1/status');
    expect(body).toHaveProperty('amountApproved');
    expect(body).toHaveProperty('status');
    expect(body).not.toHaveProperty('approvedValue');
    expect(body).not.toHaveProperty('tenantId');
  });

  it('chains PENDING → SUBMITTED → APPROVED transitions when reconciling a PENDING claim with approvedAmount > 0', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: partnerFixture })
      .mockResolvedValueOnce({ data: pendingClaimFixture });
    (apiClient.patch as any).mockResolvedValue({ data: {} });

    renderWithAuth(<ClaimsDashboard />);

    fireEvent.click(await screen.findByRole('button', { name: /reconcile/i }));

    const amountInput = await screen.findByTestId('approved-amount-input');
    fireEvent.change(amountInput, { target: { value: '500' } });

    fireEvent.click(screen.getByTestId('save-reconciliation'));

    await waitFor(() => {
      expect((apiClient.patch as any).mock.calls.length).toBe(2);
    });

    const firstCall = (apiClient.patch as any).mock.calls[0];
    const secondCall = (apiClient.patch as any).mock.calls[1];
    expect(firstCall[0]).toBe('/v1/claims/c-2/status');
    expect(firstCall[1]).toMatchObject({ status: 'SUBMITTED' });
    expect(secondCall[0]).toBe('/v1/claims/c-2/status');
    expect(secondCall[1]).toMatchObject({ status: 'APPROVED', amountApproved: 500 });
  });

  it('sends a single DENIED transition when reconciling a PENDING claim with approvedAmount = 0', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: partnerFixture })
      .mockResolvedValueOnce({ data: pendingClaimFixture });
    (apiClient.patch as any).mockResolvedValue({ data: {} });

    renderWithAuth(<ClaimsDashboard />);

    fireEvent.click(await screen.findByRole('button', { name: /reconcile/i }));

    const amountInput = await screen.findByTestId('approved-amount-input');
    fireEvent.change(amountInput, { target: { value: '0' } });

    fireEvent.click(screen.getByTestId('save-reconciliation'));

    await waitFor(() => {
      expect((apiClient.patch as any).mock.calls.length).toBe(1);
    });

    const call = (apiClient.patch as any).mock.calls[0];
    expect(call[0]).toBe('/v1/claims/c-2/status');
    expect(call[1]).toMatchObject({ status: 'DENIED' });
    expect(call[1]).not.toHaveProperty('amountApproved');
  });

  it('surfaces backend rejection errors inline (no window.alert on save failure)', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: partnerFixture })
      .mockResolvedValueOnce({ data: submittedClaimFixture });
    (apiClient.patch as any).mockRejectedValue({
      response: { data: { message: 'invalid_claim_status_transition' } },
    });

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithAuth(<ClaimsDashboard />);

    fireEvent.click(await screen.findByRole('button', { name: /reconcile/i }));
    fireEvent.click(screen.getByTestId('save-reconciliation'));

    const errNode = await screen.findByTestId('update-error');
    expect(errNode).toHaveTextContent(/invalid_claim_status_transition/);
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
