import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ITSupportDashboard } from '../ITSupportDashboard';
import { useSupportTickets, useTicketStats } from '../../../hooks/use-it-support';
import { SupportTicketDto } from '../../../services/it-support.service';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
const mockHasPermission = vi.fn<(permission: string) => boolean>(() => true);

vi.mock('../../../hooks/use-user', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as Record<string, unknown>,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../hooks/use-analytics', () => ({
  useAnalytics: () => ({ isLoading: false }),
}));

vi.mock('../../../hooks/use-it-support', () => ({
  useSupportTickets: vi.fn(),
  useTicketStats: vi.fn(),
}));

// Mock ResizeObserver for Recharts
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ResizeObserver = MockResizeObserver;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithRouter = (ui: React.ReactElement) => render(ui, {
  wrapper: ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  ),
});

describe('ITSupportDashboard Redesign', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it('renders loading skeleton when fetching tickets', () => {
    vi.mocked(useSupportTickets).mockReturnValue({ tickets: [], total: 0, loading: true, error: null, refetch: vi.fn() });
    vi.mocked(useTicketStats).mockReturnValue({ stats: { open: 0, inProgress: 0, urgent: 0, total: 0 }, loading: false, statsError: null, refetch: vi.fn() });
    
    const { container } = renderWithRouter(<ITSupportDashboard />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument(); // Inside HmsLoadingSkeleton
    expect(screen.getByText('IT & Infrastructure Support Workspace')).toBeInTheDocument(); // Header
  });

  it('renders dashboard with real ticket data and HMS shell', () => {
    vi.mocked(useSupportTickets).mockReturnValue({
      tickets: [
        {
          id: 'TKT-123',
          summary: 'Cannot login to Patient Portal',
          status: 'OPEN',
          priority: 'HIGH',
          issueType: 'AUTH',
          createdAt: '2026-05-21T10:00:00Z',
          description: '',
          branch: { id: 'b1', name: 'Main Branch' },
          tenant: { id: 't1', name: 'System' },
          reportedBy: { id: 'u1', email: 'john@example.com' },
          logs: []
        } as unknown as SupportTicketDto
      ],
      total: 1,
      loading: false,
      error: null,
      refetch: vi.fn()
    });
    vi.mocked(useTicketStats).mockReturnValue({ stats: { open: 1, inProgress: 0, urgent: 0, total: 1 }, loading: false, statsError: null, refetch: vi.fn() });

    renderWithRouter(<ITSupportDashboard />);
    expect(screen.getByText('IT & Infrastructure Support Workspace')).toBeInTheDocument();
    expect(screen.getAllByText('Cannot login to Patient Portal')[0]).toBeInTheDocument();
    expect(screen.getByText('Open Tickets')).toBeInTheDocument();
  });

  it('hides ticket queue actions from IT users without support-manage permission', () => {
    mockHasPermission.mockImplementation((permission: string) => permission !== 'it.support.manage');
    vi.mocked(useSupportTickets).mockReturnValue({ tickets: [], total: 0, loading: false, error: null, refetch: vi.fn() });
    vi.mocked(useTicketStats).mockReturnValue({ stats: { open: 2, inProgress: 1, urgent: 0, total: 5 }, loading: false, statsError: null, refetch: vi.fn() });

    renderWithRouter(<ITSupportDashboard />);

    expect(screen.queryByRole('button', { name: /View Tickets/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View Active/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View All/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ticket Queue' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ticket Queue' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Health/i })).toBeInTheDocument();
    expect(screen.getByText('System Health Monitor')).toBeInTheDocument();
    expect(mockHasPermission).toHaveBeenCalledWith('it.support.manage');
  });

  it('allows navigating to user support only when support-manage permission is present', () => {
    mockHasPermission.mockReturnValue(true);
    vi.mocked(useSupportTickets).mockReturnValue({ tickets: [], total: 0, loading: false, error: null, refetch: vi.fn() });
    vi.mocked(useTicketStats).mockReturnValue({ stats: { open: 2, inProgress: 1, urgent: 0, total: 5 }, loading: false, statsError: null, refetch: vi.fn() });

    renderWithRouter(<ITSupportDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /View Tickets/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/it/user-support');

    fireEvent.click(screen.getByRole('button', { name: 'Ticket Queue' }));
    expect(mockNavigate).toHaveBeenCalledWith('/it/user-support');
  });
});
