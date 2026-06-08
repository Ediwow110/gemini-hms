import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LegacyResultRedirectBridge } from '../LegacyResultRedirectBridge';
import { labService } from '../../../services/lab.service';

vi.mock('../../../services/lab.service', () => ({
  labService: {
    getResult: vi.fn(),
  },
}));

describe('LegacyResultRedirectBridge Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(labService.getResult).mockReturnValue(new Promise(() => {}));
    
    render(
      <MemoryRouter initialEntries={['/lab/results/res-123/encode']}>
        <Routes>
          <Route
            path="/lab/results/:id/encode"
            element={<LegacyResultRedirectBridge mode="encode" />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Resolving legacy result parameter mapping/i)).toBeInTheDocument();
  });

  it('redirects to encoding page on successful lookup for encode mode', async () => {
    vi.mocked(labService.getResult).mockResolvedValue({
      id: 'res-123',
      orderId: 'order-abc',
      order: {
        patientId: 'patient-xyz',
      },
    });

    render(
      <MemoryRouter initialEntries={['/lab/results/res-123/encode']}>
        <Routes>
          <Route
            path="/lab/results/:id/encode"
            element={<LegacyResultRedirectBridge mode="encode" />}
          />
          <Route
            path="/lab/encoding"
            element={<div>Mocked Encoding Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mocked Encoding Page')).toBeInTheDocument();
    });
  });

  it('redirects to validation page on successful lookup for approval mode', async () => {
    vi.mocked(labService.getResult).mockResolvedValue({
      id: 'res-123',
      orderId: 'order-abc',
      patientId: 'patient-xyz', // testing direct fallback
    });

    render(
      <MemoryRouter initialEntries={['/lab/results/res-123/approval']}>
        <Routes>
          <Route
            path="/lab/results/:id/approval"
            element={<LegacyResultRedirectBridge mode="approval" />}
          />
          <Route
            path="/lab/validation"
            element={<div>Mocked Validation Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mocked Validation Page')).toBeInTheDocument();
    });
  });

  it('redirects to released detail page on successful lookup for print-preview mode', async () => {
    vi.mocked(labService.getResult).mockResolvedValue({
      id: 'res-123',
      order: {
        id: 'order-abc',
        patient: {
          id: 'patient-xyz',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/lab/results/res-123/print-preview']}>
        <Routes>
          <Route
            path="/lab/results/:id/print-preview"
            element={<LegacyResultRedirectBridge mode="print-preview" />}
          />
          <Route
            path="/lab/released/:patientId/:orderId"
            element={<div>Mocked Released Detail Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mocked Released Detail Page')).toBeInTheDocument();
    });
  });

  it('renders fallback error panel if lookup fails', async () => {
    vi.mocked(labService.getResult).mockRejectedValue(new Error('Not Found'));

    render(
      <MemoryRouter initialEntries={['/lab/results/res-123/encode']}>
        <Routes>
          <Route
            path="/lab/results/:id/encode"
            element={<LegacyResultRedirectBridge mode="encode" />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Redirect Failed')).toBeInTheDocument();
      expect(screen.getByText(/requested lab result could not be found/i)).toBeInTheDocument();
    });
  });

  it('renders fallback error panel if essential mapping fields are missing', async () => {
    vi.mocked(labService.getResult).mockResolvedValue({
      id: 'res-123',
      // missing orderId and patientId entirely
    });

    render(
      <MemoryRouter initialEntries={['/lab/results/res-123/encode']}>
        <Routes>
          <Route
            path="/lab/results/:id/encode"
            element={<LegacyResultRedirectBridge mode="encode" />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Redirect Failed')).toBeInTheDocument();
      expect(screen.getByText(/does not contain the necessary patient or order links/i)).toBeInTheDocument();
    });
  });
});
