import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { RadiologyCanvas } from '../RadiologyCanvas';
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
  email: 'doctor@hms.com',
  tenantId: 'T123',
  branchId: 'B123',
  roles: ['Doctor'],
  permissions: ['radiology.write'],
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

describe('RadiologyCanvas Honesty Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show mock data when API fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockRejectedValue(new Error('API Error'));

    renderWithAuth(<RadiologyCanvas />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch radiology orders/i)).toBeInTheDocument();
      expect(screen.queryByText(/Vivian Ward/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Leonard Shelby/i)).not.toBeInTheDocument();
    });
  });

  it('disables finalize report button and shows WIP text', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockResolvedValue({
      data: [{
        id: 'ORD-1',
        orderNumber: 'IMG-001',
        patientName: 'Test Patient',
        procedure: 'X-Ray',
        priority: 'STAT',
        phase: 'PENDING',
        requestedAt: '2026-01-01'
      }]
    });

    renderWithAuth(<RadiologyCanvas />);
    
    const orderRow = await screen.findByText(/Test Patient/i);
    fireEvent.click(orderRow);

    const finalizeBtn = screen.getByText(/Finalize Report \(WIP\)/i);
    expect(finalizeBtn).toBeDisabled();
  });

  it('shows the read-only banner', async () => {
    renderWithAuth(<RadiologyCanvas />);
    expect(screen.getByText(/This module is currently in read-only mode/i)).toBeInTheDocument();
  });
});
