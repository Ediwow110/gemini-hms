/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { InstallationChecklist } from '../InstallationChecklist';
import { apiClient } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

const buildJob = (overrides: Record<string, unknown> = {}) => ({
  id: 'job-1',
  assetId: 'asset-1',
  assignedUserId: 'tech-1',
  status: 'ASSIGNED',
  commissionedAt: null,
  handoverSignedAt: null,
  asset: {
    id: 'asset-1',
    serialNumber: 'SN-001',
    model: 'CT Scanner',
    installationStatus: 'PENDING_ASSESSMENT',
    warrantyStart: null,
    warrantyEnd: null,
  },
  ...overrides,
});

describe('InstallationChecklist — real /v1/logistics/installations contract (post-fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('does NOT show the false read-only / not-available disclosure', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [buildJob()] });
    renderWithRouter(<InstallationChecklist />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/v1/logistics/installations');
    });

    expect(screen.queryByText(/read-only mode/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not yet available in the live environment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/currently in read-only mode/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/warranty gating are not yet available/i)).not.toBeInTheDocument();
  });

  it('discloses the live /v1/logistics/installations/* contract in the page banner', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [buildJob()] });
    renderWithRouter(<InstallationChecklist />);

    expect(screen.getByText(/Live backend contract/i)).toBeInTheDocument();
    expect(screen.getByText(/PATCH \/v1\/logistics\/installations\/:id\/status/i)).toBeInTheDocument();
    expect(screen.getByText(/server-authoritative/i)).toBeInTheDocument();
  });

  it('renders the Start Assembly button as FUNCTIONAL for ASSIGNED jobs (not disabled)', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [buildJob({ status: 'ASSIGNED' })] });
    renderWithRouter(<InstallationChecklist />);

    const startBtn = await screen.findByTestId('start-assembly');
    expect(startBtn).not.toBeDisabled();
    expect(startBtn).toHaveTextContent(/Start Assembly/i);
  });

  it('Start Assembly wires to PATCH /v1/logistics/installations/:id/status with { status: IN_PROGRESS }', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [buildJob({ status: 'ASSIGNED' })] });
    (apiClient.patch as any).mockResolvedValue({
      data: buildJob({ status: 'IN_PROGRESS' }),
    });

    renderWithRouter(<InstallationChecklist />);

    const startBtn = await screen.findByTestId('start-assembly');
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/v1/logistics/installations/job-1/status',
        expect.objectContaining({ status: 'IN_PROGRESS' }),
      );
    });

    const [, body] = (apiClient.patch as any).mock.calls[0];
    expect(body).not.toHaveProperty('tenantId');
    expect(body).not.toHaveProperty('branchId');
  });

  it('renders the Mark Commissioned button as FUNCTIONAL for IN_PROGRESS jobs (not disabled)', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [buildJob({ status: 'IN_PROGRESS' })] });
    renderWithRouter(<InstallationChecklist />);

    const commissionedBtn = await screen.findByTestId('mark-commissioned');
    expect(commissionedBtn).not.toBeDisabled();
    expect(commissionedBtn).toHaveTextContent(/Mark Commissioned/i);
  });

  it('Mark Commissioned wires to PATCH with { status: COMMISSIONED }', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [buildJob({ status: 'IN_PROGRESS' })] });
    (apiClient.patch as any).mockResolvedValue({
      data: buildJob({ status: 'COMMISSIONED' }),
    });

    renderWithRouter(<InstallationChecklist />);

    fireEvent.click(await screen.findByTestId('mark-commissioned'));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/v1/logistics/installations/job-1/status',
        expect.objectContaining({ status: 'COMMISSIONED' }),
      );
    });
  });

  it('renders the Complete Handover button as FUNCTIONAL (not disabled) for non-COMPLETED jobs', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [buildJob({ status: 'ASSIGNED' })] });
    renderWithRouter(<InstallationChecklist />);

    const completeBtn = await screen.findByTestId('complete-handover');
    expect(completeBtn).not.toBeDisabled();
    expect(completeBtn).toHaveTextContent(/Complete Handover/i);
  });

  it('Complete Handover wires to PATCH with { status: COMPLETED }', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [buildJob({ status: 'ASSIGNED' })] });
    (apiClient.patch as any).mockResolvedValue({
      data: buildJob({ status: 'COMPLETED' }),
    });

    renderWithRouter(<InstallationChecklist />);

    fireEvent.click(await screen.findByTestId('complete-handover'));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/v1/logistics/installations/job-1/status',
        expect.objectContaining({ status: 'COMPLETED' }),
      );
    });
  });

  it('surfaces backend rejection errors inline (no window.alert on save failure)', async () => {
    (apiClient.get as any).mockResolvedValue({ data: [buildJob({ status: 'ASSIGNED' })] });
    (apiClient.patch as any).mockRejectedValue({
      response: { data: { message: 'invalid_status_transition' } },
    });

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithRouter(<InstallationChecklist />);

    fireEvent.click(await screen.findByTestId('start-assembly'));

    const errNode = await screen.findByTestId('logistics-update-error');
    expect(errNode).toHaveTextContent(/invalid_status_transition/);
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('preserves the offline outbox: when navigator is offline, writes buffer to localStorage instead of calling API', async () => {
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });

    try {
      localStorage.setItem('hms_logistics_cached_jobs', JSON.stringify([buildJob()]));

      (apiClient.get as any).mockRejectedValue(new Error('Network Error'));
      renderWithRouter(<InstallationChecklist />);

      await waitFor(() => {
        expect(screen.getAllByText(/Offline Mode/i).length).toBeGreaterThan(0);
      });

      await screen.findByTestId('start-assembly');

      (apiClient.patch as any).mockResolvedValue({
        data: buildJob({ status: 'IN_PROGRESS' }),
      });

      fireEvent.click(screen.getByTestId('start-assembly'));

      await waitFor(() => {
        const outboxRaw = localStorage.getItem('hms_logistics_pending_outbox');
        expect(outboxRaw).not.toBeNull();
        const outbox = JSON.parse(outboxRaw as string);
        expect(Array.isArray(outbox)).toBe(true);
        expect(outbox.length).toBe(1);
        expect(outbox[0]).toMatchObject({
          jobId: 'job-1',
          payload: { status: 'IN_PROGRESS' },
        });
      });

      expect(apiClient.patch).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: originalOnLine });
    }
  });

  it('does NOT introduce fabricated job data when fetch fails and no cache exists', async () => {
    (apiClient.get as any).mockRejectedValue(new Error('Network Error'));
    renderWithRouter(<InstallationChecklist />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });

    expect(screen.queryByText(/job-fake-/i)).not.toBeInTheDocument();
  });
});
