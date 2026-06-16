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
  roles: ['Admin'],
  permissions: ['admin.patient.merge'],
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

describe('PatientMergeRequests Honesty Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show mock data when API fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockRejectedValue(new Error('API Error'));

    renderWithAuth(<PatientMergeRequests />);

    await waitFor(() => {
      expect(screen.getByText(/No pending deduplication requests found/i)).toBeInTheDocument();
      expect(screen.queryByText(/Jannette Smythe/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Robert Chase/i)).not.toBeInTheDocument();
    });
  });

  it('disables execute and reject buttons and shows WIP text', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockResolvedValue({
      data: [{
        id: 'MRG-1',
        sourceId: 'S1',
        targetId: 'T1',
        status: 'PENDING',
        risk: 'HIGH',
        requestedBy: 'Dr. A',
        createdAt: '2026-01-01',
        sourcePatient: { patientNumber: 'P1', firstName: 'S', lastName: 'S', dob: '1990-01-01' },
        targetPatient: { patientNumber: 'P2', firstName: 'T', lastName: 'T', dob: '1990-01-01' },
      }]
    });

    renderWithAuth(<PatientMergeRequests />);
    
    const requestBtn = await screen.findByText(/Merge: S \u2192 T/i);
    fireEvent.click(requestBtn);

    const executeBtn = screen.getByText(/Execute Merge \(WIP\)/i);
    const rejectBtn = screen.getByText(/Reject Merge \(WIP\)/i);

    expect(executeBtn).toBeDisabled();
    expect(rejectBtn).toBeDisabled();
  });

  it('shows the read-only banner', async () => {
    renderWithAuth(<PatientMergeRequests />);
    expect(screen.getByText(/This module is currently in read-only mode/i)).toBeInTheDocument();
  });
});
