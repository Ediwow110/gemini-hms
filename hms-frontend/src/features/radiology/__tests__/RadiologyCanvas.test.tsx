import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

const radiologyOrder = {
  id: 'ORD-1',
  orderNumber: 'IMG-001',
  patientName: 'Test Patient',
  procedure: 'X-Ray',
  priority: 'STAT' as const,
  phase: 'PENDING' as const,
  requestedAt: '2026-01-01',
};

const openRadiologyWorkspace = async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (apiClient.get as any).mockResolvedValue({ data: [radiologyOrder] });

  renderWithAuth(<RadiologyCanvas />);

  const orderRow = await screen.findByText(/Test Patient/i);
  fireEvent.click(orderRow);
};

describe('RadiologyCanvas Honesty Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    await openRadiologyWorkspace();

    const finalizeBtn = screen.getByText(/Finalize Report \(WIP\)/i);
    expect(finalizeBtn).toBeDisabled();
  });

  it('shows the read-only banner', async () => {
    renderWithAuth(<RadiologyCanvas />);
    expect(screen.getByText(/This module is currently in read-only mode/i)).toBeInTheDocument();
  });

  it('states that /v1/radiology/orders and finalize are not implemented in the backend', async () => {
    renderWithAuth(<RadiologyCanvas />);
    expect(screen.getByText(/no backend implementation yet/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\/v1\/radiology\/orders/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/HTTP 404/i)).toBeInTheDocument();
  });

  it('does NOT introduce a fabricated "orders loaded" or "save successful" claim', async () => {
    renderWithAuth(<RadiologyCanvas />);
    expect(screen.queryByText(/orders loaded successfully/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/save successful/i)).not.toBeInTheDocument();
  });

  it('keeps drag/drop file selection local-only without fake persistence claims', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await openRadiologyWorkspace();

    const dropZone = screen.getByText(/Drag & Drop Study Files/i).closest('div');
    expect(dropZone).not.toBeNull();

    const file = new File(['demo'], 'study.dcm', { type: 'application/dicom' });
    fireEvent.drop(dropZone!, { dataTransfer: { files: [file] } });

    expect(screen.getByText('study.dcm')).toBeInTheDocument();
    expect(screen.getByText(/selected locally for this session only/i)).toBeInTheDocument();
    expect(screen.getByText(/not uploaded, persisted, or mapped to backend records/i)).toBeInTheDocument();
    expect(screen.queryByText(/uploaded successfully/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/matched to.*database entity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/DICOM properties mapped/i)).not.toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('keeps file input selection local-only without fake persistence claims', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    await openRadiologyWorkspace();

    const input = screen.getByLabelText(/Browse Files/i);
    const file = new File(['demo'], 'study.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('study.pdf')).toBeInTheDocument();
    expect(screen.getByText(/selected locally for this session only/i)).toBeInTheDocument();
    expect(screen.getByText(/not uploaded, persisted, or mapped to backend records/i)).toBeInTheDocument();
    expect(screen.queryByText(/uploaded successfully/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/matched to.*database entity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/DICOM properties mapped/i)).not.toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
