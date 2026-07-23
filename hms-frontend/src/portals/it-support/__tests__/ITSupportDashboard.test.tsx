import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ITSupportDashboard } from '../ITSupportDashboard';
import { useAnalytics } from '../../../hooks/use-analytics';
import { useSupportTickets, useTicketStats } from '../../../hooks/use-it-support';

const mockHasPermission = vi.fn<(permission: string) => boolean>(() => true);

vi.mock('../../../hooks/use-user', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock('../../../hooks/use-analytics', () => ({
  useAnalytics: vi.fn(),
}));

vi.mock('../../../hooks/use-it-support', () => ({
  useSupportTickets: vi.fn(),
  useTicketStats: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Legend: () => <div />,
}));

const analyticsResult = (overrides: Record<string, unknown> = {}) => ({
  it: {
    activeSessions: 42,
    healthyIntegrations: 9,
    backupFailures: 0,
    systemLatencyMs: 48,
  },
  isLoading: false,
  isFetching: false,
  demoByScope: { it: false },
  refetchAll: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const ticketsResult = (overrides: Record<string, unknown> = {}) => ({
  tickets: [],
  loading: false,
  error: null,
  refetch: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const statsResult = (overrides: Record<string, unknown> = {}) => ({
  stats: { open: 0, inProgress: 0, urgent: 0, total: 0 },
  loading: false,
  statsError: null,
  refetch: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <ITSupportDashboard />
    </MemoryRouter>,
  );

describe('ITSupportDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockHasPermission.mockReturnValue(true);
    vi.mocked(useAnalytics).mockReturnValue(
      analyticsResult() as unknown as ReturnType<typeof useAnalytics>,
    );
    vi.mocked(useSupportTickets).mockReturnValue(
      ticketsResult() as unknown as ReturnType<typeof useSupportTickets>,
    );
    vi.mocked(useTicketStats).mockReturnValue(
      statsResult() as unknown as ReturnType<typeof useTicketStats>,
    );
  });

  it('renders the reliability workspace with live support data', () => {
    vi.mocked(useSupportTickets).mockReturnValue(
      ticketsResult({
        tickets: [
          {
            id: 'ticket-1',
            summary: 'Cannot sign in to the portal',
            status: 'OPEN',
            priority: 'HIGH',
            issueType: 'AUTH',
            createdAt: '2026-07-10T10:00:00Z',
            branch: { name: 'Main Branch' },
            reportedBy: { email: 'user@example.invalid' },
          },
        ],
      }) as unknown as ReturnType<typeof useSupportTickets>,
    );
    vi.mocked(useTicketStats).mockReturnValue(
      statsResult({ stats: { open: 1, inProgress: 0, urgent: 1, total: 1 } }) as unknown as ReturnType<typeof useTicketStats>,
    );

    renderDashboard();

    expect(screen.getByText('IT Reliability Workspace')).toBeInTheDocument();
    expect(screen.getByText('Cannot sign in to the portal')).toBeInTheDocument();
    expect(screen.getByText('Open support tickets')).toBeInTheDocument();
    expect(screen.getByText('Reliability decisions')).toBeInTheDocument();
  });

  it('shows loading values without hiding the dashboard structure', () => {
    vi.mocked(useAnalytics).mockReturnValue(
      analyticsResult({ isLoading: true, isFetching: true }) as unknown as ReturnType<typeof useAnalytics>,
    );
    vi.mocked(useSupportTickets).mockReturnValue(
      ticketsResult({ loading: true }) as unknown as ReturnType<typeof useSupportTickets>,
    );

    renderDashboard();

    expect(screen.getByText('IT Reliability Workspace')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('does not query or expose the user-support queue without support permission', () => {
    mockHasPermission.mockImplementation(
      (permission) => permission !== 'it.support.manage',
    );

    renderDashboard();

    expect(useSupportTickets).toHaveBeenCalledWith(false);
    expect(useTicketStats).toHaveBeenCalledWith(false);
    expect(screen.getByText('Support queue restricted')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Open support tickets/i }),
    ).not.toBeInTheDocument();
  });

  it('links authorized support users to the live ticket queue', () => {
    renderDashboard();

    const supportLink = screen.getByRole('link', {
      name: /Open support tickets/i,
    });
    expect(supportLink).toHaveAttribute('href', '/it/user-support');

    const refresh = screen.getByRole('button', {
      name: /Refresh dashboard data/i,
    });
    fireEvent.click(refresh);
    expect(vi.mocked(useSupportTickets).mock.results[0]?.value.refetch).toBeDefined();
  });
});
