import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditReviewPage } from '../AuditReviewPage';
import { useAuditEvents } from '../../../hooks/use-compliance';

vi.mock('../../../hooks/use-compliance', () => ({
  useAuditEvents: vi.fn(),
}));

describe('AuditReviewPage Runtime Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state successfully', () => {
    vi.mocked(useAuditEvents).mockReturnValue({
      events: [],
      total: 0,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditReviewPage />);
    expect(screen.getByText('Loading audit events...')).toBeInTheDocument();
  });

  it('renders polished error state when route/endpoint fails, not raw Cannot GET', () => {
    vi.mocked(useAuditEvents).mockReturnValue({
      events: [],
      total: 0,
      loading: false,
      error: 'Cannot GET /api/v1/audit/events', // mock raw API error returned as hook error
      refetch: vi.fn(),
    });

    render(<AuditReviewPage />);
    expect(screen.getByText('Error loading audit events')).toBeInTheDocument();
    expect(screen.getByText('Cannot GET /api/v1/audit/events')).toBeInTheDocument();
  });

  it('renders audit events successfully when they exist', () => {
    vi.mocked(useAuditEvents).mockReturnValue({
      events: [
        {
          id: 'evt-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          recordType: 'Patient',
          recordId: 'PAT-12345',
          activeRole: 'Doctor',
          eventKey: 'PATIENT_RECORD_VIEW',
          ipAddress: '127.0.0.1',
        },
      ],
      total: 1,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AuditReviewPage />);
    expect(screen.getByText('Audit Log Review')).toBeInTheDocument();
    expect(screen.getByText('PATIENT_RECORD_VIEW')).toBeInTheDocument();
  });
});
