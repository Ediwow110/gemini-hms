import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserSupportPage } from '../UserSupportPage';
import { useSupportTickets } from '../../../hooks/use-it-support';
import { SupportTicketDto } from '../../../services/it-support.service';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-it-support', () => ({
  useSupportTickets: vi.fn(),
}));

const renderWithRouter = (ui: React.ReactElement) => render(ui, { wrapper: BrowserRouter });

describe('UserSupportPage Redesign', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading skeleton when fetching tickets', () => {
    vi.mocked(useSupportTickets).mockReturnValue({ tickets: [], total: 0, loading: true, error: null, refetch: vi.fn() });

    renderWithRouter(<UserSupportPage />);
    expect(screen.getByText('User Support Center')).toBeInTheDocument();
    expect(screen.getByText('Login failures, MFA resets, account lockouts, and permission requests')).toBeInTheDocument();
  });

  it('renders empty state when no tickets exist', () => {
    vi.mocked(useSupportTickets).mockReturnValue({ tickets: [], total: 0, loading: false, error: null, refetch: vi.fn() });

    renderWithRouter(<UserSupportPage />);
    expect(screen.getByText('No support tickets')).toBeInTheDocument();
    expect(screen.getByText('All issues resolved — no open tickets match the current filters.')).toBeInTheDocument();
  });

  it('renders error state with retry button on fetch failure', () => {
    vi.mocked(useSupportTickets).mockReturnValue({ tickets: [], total: 0, loading: false, error: 'Network error', refetch: vi.fn() });

    renderWithRouter(<UserSupportPage />);
    expect(screen.getByText('Error loading support tickets')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders support queue with real ticket data', () => {
    vi.mocked(useSupportTickets).mockReturnValue({
      tickets: [
        {
          id: 'TKT-456',
          summary: 'MFA reset request',
          status: 'OPEN',
          priority: 'MEDIUM',
          issueType: 'AUTH',
          createdAt: '2026-05-21T10:00:00Z',
          description: '',
          branch: { id: 'b1', name: 'Main Branch' },
          tenant: { id: 't1', name: 'System' },
          reportedBy: { id: 'u1', email: 'user@example.com' },
          logs: []
        } as unknown as SupportTicketDto
      ],
      total: 1,
      loading: false,
      error: null,
      refetch: vi.fn()
    });

    renderWithRouter(<UserSupportPage />);
    expect(screen.getByText('User Support Center')).toBeInTheDocument();
    expect(screen.getAllByText('MFA reset request')[0]).toBeInTheDocument();
  });
});
