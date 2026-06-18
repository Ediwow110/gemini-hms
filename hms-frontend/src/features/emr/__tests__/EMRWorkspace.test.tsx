import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { EMRWorkspace } from '../EMRWorkspace';
import { apiClient } from '../../../lib/api';
import { AuthContext } from '../../../hooks/use-user';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockUser = {
  id: 'U123',
  email: 'doctor@hms.com',
  tenantId: 'T123',
  branchId: 'B123',
  roles: ['Doctor'],
  permissions: ['clinical.encounter.write'],
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

describe('EMRWorkspace Honesty Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockImplementation(async (url: string) => {
      if (url === '/v1/queue/worklist') {
        return { data: [{
          id: 'E123',
          queueNumber: 'C-01',
          status: 'WAITING',
          patient: { id: 'P123', patientNumber: 'P001', firstName: 'John', lastName: 'Doe', dob: '1990-01-01' }
        }] };
      }
      throw new Error('Unknown endpoint');
    });
  });

  it('wires vitals capture and shows success on 200', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockResolvedValue({ status: 200 });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithAuth(<EMRWorkspace />);
    
    // Select patient from queue
    const patientBtn = await screen.findByText(/John Doe/i);
    fireEvent.click(patientBtn);

    // Fill vitals
    fireEvent.change(screen.getByLabelText(/Temperature/i), { target: { value: '37.2' } });
    
    // Submit
    fireEvent.click(screen.getByText(/Save Vitals Metrics/i));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(expect.stringContaining('/vitals'), expect.any(Object));
      expect(alertSpy).toHaveBeenCalledWith("Vitals successfully saved to medical record.");
    });
  });

  it('shows error message on vitals API failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockRejectedValue({
      response: { data: { message: 'Database timeout' } },
    });

    renderWithAuth(<EMRWorkspace />);
    const patientBtn = await screen.findByText(/John Doe/i);
    fireEvent.click(patientBtn);

    fireEvent.click(screen.getByText(/Save Vitals Metrics/i));

    await waitFor(() => {
      expect(screen.getByText(/Database timeout/i)).toBeInTheDocument();
    });
  });

  it('wires encounter finalization and locks UI on success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.patch as any).mockResolvedValue({ status: 200 });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithAuth(<EMRWorkspace />);
    const patientBtn = await screen.findByText(/John Doe/i);
    fireEvent.click(patientBtn);

    // Open close modal
    fireEvent.click(screen.getByText(/Finalize & Close/i));
    
    // Confirm
    fireEvent.click(screen.getByText(/Yes, Sign & Lock/i));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(expect.stringContaining('/close'), expect.any(Object));
      expect(alertSpy).toHaveBeenCalledWith("Encounter signed and locked successfully. All clinical logs are finalized.");
      expect(screen.getByText(/Locked/i)).toBeInTheDocument();
    });
  });

  it('does not lock UI on finalization failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.patch as any).mockRejectedValue({
      response: { data: { message: 'Permission denied' } },
    });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithAuth(<EMRWorkspace />);
    const patientBtn = await screen.findByText(/John Doe/i);
    fireEvent.click(patientBtn);

    fireEvent.click(screen.getByText(/Finalize & Close/i));
    fireEvent.click(screen.getByText(/Yes, Sign & Lock/i));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Permission denied");
      expect(screen.queryByText(/Locked/i)).not.toBeInTheDocument();
    });
  });

  it('does NOT render the dead "Cache Notes" button (misleading save flow)', async () => {
    renderWithAuth(<EMRWorkspace />);
    const patientBtn = await screen.findByText(/John Doe/i);
    fireEvent.click(patientBtn);

    // Switch to SOAP tab
    fireEvent.click(screen.getByText(/SOAP Notes/i));

    // The "Cache Notes" button is dead: it does nothing (notes are already in
    // local state from typing) but its alert claims "Notes updated in local
    // workspace" — a misleading save flow. It must not be rendered.
    expect(screen.queryByRole('button', { name: /cache notes/i })).not.toBeInTheDocument();
  });

  it('does NOT show hardcoded fallback patients when queue API fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockImplementation(async (url: string) => {
      if (url === '/v1/queue/worklist') {
        throw new Error('Network error');
      }
      throw new Error('Unknown endpoint');
    });

    renderWithAuth(<EMRWorkspace />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-error')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Patient 001/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Patient 002/i)).not.toBeInTheDocument();
    expect(screen.getByText(/No Patient Selected/i)).toBeInTheDocument();
  });

  it('clears queue error when queue refetches successfully', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any)
      .mockImplementationOnce(async (url: string) => {
        if (url === '/v1/queue/worklist') {
          throw new Error('Network error');
        }
        throw new Error('Unknown endpoint');
      })
      .mockImplementation(async (url: string) => {
        if (url === '/v1/queue/worklist') {
          return { data: [{
            id: 'E456',
            queueNumber: 'C-03',
            status: 'WAITING',
            patient: { id: 'P456', patientNumber: 'P002', firstName: 'Jane', lastName: 'Smith', dob: '1985-05-15' }
          }] };
        }
        throw new Error('Unknown endpoint');
      });

    renderWithAuth(<EMRWorkspace />);

    await waitFor(() => {
      expect(screen.getByTestId('queue-error')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Retry/i));

    await waitFor(() => {
      expect(screen.queryByTestId('queue-error')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  });
});
