import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IncidentReportsPage } from '../IncidentReportsPage';
import { useSupportTickets } from '../../../hooks/use-it-support';
import { SupportTicketDto } from '../../../services/it-support.service';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-it-support', () => ({
  useSupportTickets: vi.fn(),
}));

const renderWithRouter = (ui: React.ReactElement) => render(ui, { wrapper: BrowserRouter });

describe('IncidentReportsPage Redesign', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders empty state when no high-priority tickets exist', () => {
    vi.mocked(useSupportTickets).mockReturnValue({ tickets: [], total: 0, loading: false, error: null, refetch: vi.fn() });
    
    renderWithRouter(<IncidentReportsPage />);
    expect(screen.getByText('No incidents found')).toBeInTheDocument();
    expect(screen.getByText('High-priority tickets will appear here as incidents.')).toBeInTheDocument();
  });

  it('renders incidents mapped from real ticket data', () => {
    vi.mocked(useSupportTickets).mockImplementation((params) => {
      if (params?.priority === 'URGENT') {
        return {
          tickets: [{
            id: 'TKT-999', summary: 'Database down', status: 'OPEN', priority: 'URGENT',
            issueType: 'INFRA', createdAt: '2026-05-21T10:00:00Z', description: '',
            branch: { id: 'b1', name: 'Main Branch' }, tenant: { id: 't1', name: 'System' },
            reportedBy: { id: 'u1', email: 'admin@example.com' }, logs: []
          } as unknown as SupportTicketDto],
          total: 1, loading: false, error: null, refetch: vi.fn()
        };
      }
      return { tickets: [], total: 0, loading: false, error: null, refetch: vi.fn() };
    });
    
    renderWithRouter(<IncidentReportsPage />);
    expect(screen.getAllByText('Database down')[0]).toBeInTheDocument();
  });
});
