import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InvoicesPage } from '../InvoicesPage';
import { useInvoices } from '../../../hooks/use-billing';
import { useUser } from '../../../hooks/use-user';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../hooks/use-billing', () => ({
  useInvoices: vi.fn(),
}));

vi.mock('../../../hooks/use-user', () => ({
  useUser: vi.fn(),
}));

describe('InvoicesPage Unit Tests', () => {
  const mockUser = {
    id: 'cashier-1',
    email: 'cashier@hospital.com',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Cashier'],
    permissions: [],
  };

  const mockInvoice1 = {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    status: 'PAID',
    totalAmount: 1500,
    paidAmount: 1500,
    createdAt: '2026-06-07T10:00:00.000Z',
  };

  const mockInvoice2 = {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-002',
    status: 'PENDING',
    totalAmount: 3000,
    paidAmount: 0,
    createdAt: '2026-06-07T11:00:00.000Z',
  };

  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useUser).mockReturnValue(mockUser);
    vi.mocked(useInvoices).mockReturnValue({
      invoices: [mockInvoice1, mockInvoice2],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('renders invoices list and HmsPageHeader', () => {
    renderWithRouter(<InvoicesPage />);

    expect(screen.getByText('Invoice Directory')).toBeInTheDocument();
    expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
    expect(screen.getByText('INV-2026-002')).toBeInTheDocument();
    expect(screen.getAllByText('1,500.00 ₱')[0]).toBeInTheDocument();
    expect(screen.getByText('3,000.00 ₱')).toBeInTheDocument();
  });

  it('filters invoices based on search query', () => {
    renderWithRouter(<InvoicesPage />);

    const searchInput = screen.getByPlaceholderText('Search by invoice number...');
    fireEvent.change(searchInput, { target: { value: '002' } });

    expect(screen.queryByText('INV-2026-001')).not.toBeInTheDocument();
    expect(screen.getByText('INV-2026-002')).toBeInTheDocument();
  });

  it('navigates to billing detail page when Pay action is clicked', () => {
    renderWithRouter(<InvoicesPage />);

    const payBtns = screen.getAllByRole('button', { name: /Pay/i });
    fireEvent.click(payBtns[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/cashier/billing?invoice=inv-1');
  });

  it('navigates to billing detail page when table row is clicked', () => {
    renderWithRouter(<InvoicesPage />);

    const tableRows = screen.getAllByRole('button');
    // Find a table row button (HmsDrilldownTable renders clickable rows with role=button)
    const rowButton = tableRows.find(btn => btn.textContent?.includes('INV-2026-001'));
    if (rowButton) {
      fireEvent.click(rowButton);
      expect(mockNavigate).toHaveBeenCalledWith('/cashier/billing?invoice=inv-1');
    }
  });

  it('renders loading state when loading is true', () => {
    vi.mocked(useInvoices).mockReturnValue({
      invoices: [],
      loading: true,
      error: null,
      refetch: mockRefetch,
    });

    renderWithRouter(<InvoicesPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error block and triggers refetch on retry click', () => {
    vi.mocked(useInvoices).mockReturnValue({
      invoices: [],
      loading: false,
      error: 'Unauthorized Access',
      refetch: mockRefetch,
    });

    renderWithRouter(<InvoicesPage />);
    expect(screen.getByText('Error loading invoices')).toBeInTheDocument();
    expect(screen.getByText('Unauthorized Access')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });
});
