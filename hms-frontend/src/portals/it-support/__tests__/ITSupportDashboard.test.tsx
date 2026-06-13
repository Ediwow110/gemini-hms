import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ITSupportDashboard } from '../ITSupportDashboard';
import { useSupportTickets, useTicketStats } from '../../../hooks/use-it-support';
import { SupportTicketDto } from '../../../services/it-support.service';
import { BrowserRouter } from 'react-router-dom';

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

const renderWithRouter = (ui: React.ReactElement) => render(ui, { wrapper: BrowserRouter });

describe('ITSupportDashboard Redesign', () => {
  beforeEach(() => {
    vi.resetAllMocks();
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
    expect(screen.getByText('IT Operations (Partial)')).toBeInTheDocument(); // WIP banner
  });
});
