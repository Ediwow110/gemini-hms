import { render, screen } from '@testing-library/react';
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
  permissions: ['insurance.claims.view'],
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

describe('ClaimsDashboard Honesty Tests (post-truth-gap fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the read-only banner', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockRejectedValue(new Error('API Error'));
    renderWithAuth(<ClaimsDashboard />);
    expect(screen.getByText(/This module is currently in read-only mode/i)).toBeInTheDocument();
  });

  it('states that /v1/insurance/partners and /v1/insurance/claims are not implemented in the backend', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockRejectedValue(new Error('API Error'));
    renderWithAuth(<ClaimsDashboard />);
    expect(screen.getByText(/no backend implementation yet/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\/v1\/insurance\/partners/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\/v1\/insurance\/claims/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/HTTP 404/i)).toBeInTheDocument();
  });

  it('does NOT introduce fabricated partner or claim data when API fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockRejectedValue(new Error('API Error'));
    renderWithAuth(<ClaimsDashboard />);
    // The error notice is honest (async via useEffect — wait for it)
    expect(await screen.findByText(/Failed to fetch insurance data/i)).toBeInTheDocument();
    // No fake partner names or claim IDs are rendered
    expect(screen.queryByText(/Maxicare/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fake-partner-name-xyz/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CLM-FAKE-/i)).not.toBeInTheDocument();
  });

  it('does NOT call window.alert() during normal page render', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockRejectedValue(new Error('API Error'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithAuth(<ClaimsDashboard />);
    // Wait for the fetch to complete
    await screen.findByText(/Failed to fetch insurance data/i);
    // No alert was fired on render or on fetch failure
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('disables the Save Reconciliation button (no persistence)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockResolvedValue({ data: [] });
    renderWithAuth(<ClaimsDashboard />);
    // The Save Reconciliation button is not visible until a claim is selected
    // and the modal opens. Page must not render a clickable save action.
    expect(screen.queryByText(/Save Reconciliation/i)).not.toBeInTheDocument();
    // The "no backend implementation yet" notice is present at page level
    expect(screen.getByText(/no backend implementation yet/i)).toBeInTheDocument();
    // No patch was called on page render
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(apiClient.patch as any).not.toHaveBeenCalled();
  });
});
