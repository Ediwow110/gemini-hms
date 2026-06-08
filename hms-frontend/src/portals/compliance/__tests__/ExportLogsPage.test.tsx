import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportLogsPage } from '../ExportLogsPage';
import { useAuditEvents } from '../../../hooks/use-compliance';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-compliance', () => ({
  useAuditEvents: vi.fn(),
}));

// Mock ResizeObserver which is often needed by UI components in tests
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('ExportLogsPage Redesign Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders within standardized HMS dashboard shell', () => {
    vi.mocked(useAuditEvents).mockReturnValue({
      events: [],
      total: 0,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<ExportLogsPage />);
    expect(screen.getByText('Patient Data Export Logs')).toBeInTheDocument();
    // Check for the "Real Audit Feed Enabled" banner which is part of the redesigned page
    expect(screen.getByText('Real Audit Feed Enabled')).toBeInTheDocument();
  });

  it('renders loading state for real-time audit feed', () => {
    vi.mocked(useAuditEvents).mockReturnValue({
      events: [],
      total: 0,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<ExportLogsPage />);
    expect(screen.getByText('Loading real-time export audit trails...')).toBeInTheDocument();
  });

  it('maps audit events with EXPORT keys to the table correctly', () => {
    vi.mocked(useAuditEvents).mockReturnValue({
      events: [
        {
          id: 'exp-123',
          tenantId: 'TEN-001',
          userId: 'admin@hms.local',
          createdAt: '2026-06-08T10:00:00Z',
          recordType: 'Clinical',
          recordId: 'ALL',
          activeRole: 'Compliance Officer',
          eventKey: 'PATIENT_DATA_EXPORT_CSV',
          ipAddress: '192.168.1.100',
        },
      ],
      total: 1,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<ExportLogsPage />);
    expect(screen.getByText('admin@hms.local')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
  });

  it('shows empty state with History icon when no export events found', () => {
    vi.mocked(useAuditEvents).mockReturnValue({
      events: [
        {
          id: 'log-1',
          tenantId: 'TEN-001',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          recordType: 'Login',
          recordId: '1',
          eventKey: 'USER_LOGIN',
        },
      ],
      total: 1,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter(<ExportLogsPage />);
    expect(screen.getByText('No export logs found in the audit feed')).toBeInTheDocument();
  });
});
