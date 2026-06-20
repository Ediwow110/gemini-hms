import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyAuditLogPage } from '../MyAuditLogPage';
import { useMyAuditEvents } from '../../../hooks/use-compliance';

vi.mock('../../../hooks/use-compliance', () => ({
  useMyAuditEvents: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('MyAuditLogPage Search Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('filters events by search text using client-side matching', () => {
    vi.mocked(useMyAuditEvents).mockReturnValue({
      events: [
        {
          id: 'evt-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          recordType: 'Payment',
          recordId: 'PAY-001',
          activeRole: 'Cashier',
          eventKey: 'PAYMENT_COMPLETED',
          ipAddress: '127.0.0.1',
        },
        {
          id: 'evt-2',
          tenantId: 'tenant-1',
          userId: 'user-1',
          createdAt: new Date().toISOString(),
          recordType: 'Patient',
          recordId: 'PAT-001',
          activeRole: 'Doctor',
          eventKey: 'PATIENT_REGISTERED',
          ipAddress: '127.0.0.1',
        },
      ],
      total: 2,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MyAuditLogPage />);

    expect(screen.getByText('PAYMENT COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('PATIENT REGISTERED')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search events...');
    fireEvent.change(searchInput, { target: { value: 'payment' } });

    expect(screen.getByText('PAYMENT COMPLETED')).toBeInTheDocument();
    expect(screen.queryByText('PATIENT REGISTERED')).not.toBeInTheDocument();
  });
});
