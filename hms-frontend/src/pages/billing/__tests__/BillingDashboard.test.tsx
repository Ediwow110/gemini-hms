import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BillingDashboard } from '../BillingDashboard';
import type { InvoiceDto, ActiveSessionDto } from '../../../services/billing-frontend.service';

const mockInvoices = vi.hoisted(() => vi.fn());
const mockActiveSession = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/use-billing', () => ({
  useInvoices: () => mockInvoices(),
  useActiveSession: () => mockActiveSession(),
}));

const mockHasPermission = vi.hoisted(() => vi.fn<(permission: string) => boolean>(() => true));

vi.mock('../../../hooks/use-user', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const sampleInvoice = (overrides?: Partial<InvoiceDto>): InvoiceDto => ({
  id: 'inv-1',
  invoiceNumber: 'INV-001',
  status: 'UNPAID',
  totalAmount: 5000,
  paidAmount: 0,
  balance: 5000,
  createdAt: '2026-06-01T00:00:00Z',
  patientName: 'Alice Anderson',
  order: {
    patient: {
      id: 'pat-1',
      firstName: 'Alice',
      lastName: 'Anderson',
      patientNumber: 'P-001',
    },
  },
  ...overrides,
});

const sampleSession = (overrides?: Partial<ActiveSessionDto>): ActiveSessionDto => ({
  id: 'session-1',
  status: 'OPEN',
  openedAt: '2026-06-26T08:00:00Z',
  openingBalance: 0,
  payments: [
    {
      id: 'pay-1',
      receiptNumber: 'RCT-001',
      amount: 1500,
      paymentMethod: 'CASH',
      status: 'POSTED',
      createdAt: '2026-06-26T09:00:00Z',
      invoice: {
        invoiceNumber: 'INV-002',
        order: {
          patient: { firstName: 'Bob', lastName: 'Brown' },
        },
      },
    },
  ],
  ...overrides,
});

describe('BillingDashboard Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it('renders successfully with live invoice and session data', async () => {
    mockInvoices.mockReturnValue({ invoices: [sampleInvoice()], loading: false, error: null, refetch: vi.fn() });
    mockActiveSession.mockReturnValue({ session: sampleSession(), loading: false, error: null, refetch: vi.fn() });

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Billing & Finance Dashboard')).toBeInTheDocument();
      expect(screen.getAllByText('Unpaid Invoices').length).toBeGreaterThan(0);
      expect(screen.getByText('Active Session')).toBeInTheDocument();
      expect(screen.getByText('Total Outstanding')).toBeInTheDocument();
      expect(screen.queryByText(/Live source unavailable/i)).not.toBeInTheDocument();
    });
  });

  it('shows loading skeleton when data is loading', async () => {
    mockInvoices.mockReturnValue({ invoices: [], loading: true, error: null, refetch: vi.fn() });
    mockActiveSession.mockReturnValue({ session: null, loading: true, error: null, refetch: vi.fn() });

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Billing & Finance Dashboard')).toBeInTheDocument();
    });
  });

  it('shows error state with retry button when API fails', async () => {
    mockInvoices.mockReturnValue({ invoices: [], loading: false, error: 'Failed to load', refetch: vi.fn() });
    mockActiveSession.mockReturnValue({ session: null, loading: false, error: null, refetch: vi.fn() });

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load billing dashboard data/i)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('routes invoice drilldowns to the live cashier invoice registry', async () => {
    mockInvoices.mockReturnValue({ invoices: [sampleInvoice(), sampleInvoice({ id: 'inv-2', invoiceNumber: 'INV-002', balance: 3000 })], loading: false, error: null, refetch: vi.fn() });
    mockActiveSession.mockReturnValue({ session: null, loading: false, error: null, refetch: vi.fn() });

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoice Registry')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Invoice Registry'));
    expect(mockNavigate).toHaveBeenCalledWith('/cashier/invoices');
    expect(mockNavigate).not.toHaveBeenCalledWith('/billing');
  });

  it('only shows Claims Dashboard shortcut to users with claim-view permission', async () => {
    mockInvoices.mockReturnValue({ invoices: [], loading: false, error: null, refetch: vi.fn() });
    mockActiveSession.mockReturnValue({ session: null, loading: false, error: null, refetch: vi.fn() });

    mockHasPermission.mockImplementation((permission: string) => permission !== 'billing.claim.view');

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoice Registry')).toBeInTheDocument();
    });

    expect(screen.queryByText('Claims Dashboard')).not.toBeInTheDocument();
    expect(mockHasPermission).toHaveBeenCalledWith('billing.claim.view');

    mockHasPermission.mockReturnValue(true);

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Claims Dashboard').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText('Claims Dashboard')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/claims');
  });

  it('shows HmsDataUnavailable sections when invoices are empty', async () => {
    mockInvoices.mockReturnValue({ invoices: [], loading: false, error: null, refetch: vi.fn() });
    mockActiveSession.mockReturnValue({ session: null, loading: false, error: null, refetch: vi.fn() });

    render(
      <MemoryRouter>
        <BillingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Billing & Finance Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Highest Outstanding Bills/)).toBeInTheDocument();
      expect(screen.getByText(/Recent Payments \(Active Session\)/)).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });
});
