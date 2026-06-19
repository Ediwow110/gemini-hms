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

  it('enables finalize when interpretation is provided (file not required)', async () => {
    await openRadiologyWorkspace();

    const finalizeBtn = screen.getByTestId('finalize-report-btn');
    expect(finalizeBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/formal medical diagnosis/i), {
      target: { value: 'No acute cardiopulmonary process.' },
    });

    expect(finalizeBtn).not.toBeDisabled();
    expect(finalizeBtn).toHaveTextContent('Finalize Report');
  });

  it('posts interpretation-only finalize payload and refreshes worklist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockResolvedValue({ data: [radiologyOrder] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockResolvedValue({
      data: {
        id: 'RPT-1',
        orderId: 'ORD-1',
        interpretation: 'Clear lungs.',
        status: 'FINALIZED',
        finalizedAt: '2026-06-03T00:00:00.000Z',
      },
    });

    renderWithAuth(<RadiologyCanvas />);
    fireEvent.click(await screen.findByText(/Test Patient/i));
    fireEvent.change(screen.getByPlaceholderText(/formal medical diagnosis/i), {
      target: { value: 'Clear lungs.' },
    });
    fireEvent.click(screen.getByTestId('finalize-report-btn'));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/radiology/orders/ORD-1/finalize',
        { interpretation: 'Clear lungs.' },
      );
      expect(screen.getByTestId('finalize-success')).toHaveTextContent(
        /finalized and persisted/i,
      );
    });
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('shows honest disclosure for partial backend release', async () => {
    renderWithAuth(<RadiologyCanvas />);
    expect(screen.getByText(/Partial backend release/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\/v1\/radiology\/orders/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/IMAGING/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/persists interpretation text only/i)).toBeInTheDocument();
    expect(screen.getByText(/study binaries are not uploaded or stored/i)).toBeInTheDocument();
  });

  it('shows honest empty worklist state when API returns no orders', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockResolvedValue({ data: [] });

    renderWithAuth(<RadiologyCanvas />);

    await waitFor(() => {
      expect(screen.getByText(/No IMAGING orders in worklist/i)).toBeInTheDocument();
    });
  });

  it('does NOT introduce a fabricated "orders loaded" or fake upload success claim', async () => {
    renderWithAuth(<RadiologyCanvas />);
    expect(screen.queryByText(/orders loaded successfully/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/uploaded successfully/i)).not.toBeInTheDocument();
  });

  it('keeps drag/drop file selection local-only without fake persistence claims', async () => {
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
  });

  it('keeps file input selection local-only without fake persistence claims', async () => {
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
  });

  it('shows inline finalize error without alert on API failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.get as any).mockResolvedValue({ data: [radiologyOrder] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.post as any).mockRejectedValue({
      response: { data: { message: 'Radiology report already finalized for this order' } },
    });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithAuth(<RadiologyCanvas />);
    fireEvent.click(await screen.findByText(/Test Patient/i));
    fireEvent.change(screen.getByPlaceholderText(/formal medical diagnosis/i), {
      target: { value: 'Duplicate attempt.' },
    });
    fireEvent.click(screen.getByTestId('finalize-report-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('finalize-error')).toHaveTextContent(
        /already finalized/i,
      );
    });
    expect(alertSpy).not.toHaveBeenCalled();
  });
});