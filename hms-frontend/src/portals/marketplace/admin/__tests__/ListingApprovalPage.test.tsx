import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ListingApprovalPage from '../ListingApprovalPage';

const mockGet = vi.fn();
vi.mock('../../../../lib/api', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('ListingApprovalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    mockGet.mockResolvedValue({ data: [] });
    render(<ListingApprovalPage />);
    expect(screen.getByText('Listing Approval')).toBeDefined();
  });

  it('displays live KPI counts from backend', async () => {
    mockGet.mockResolvedValue({
      data: [
        { id: '1', status: 'PENDING_APPROVAL', serviceItem: { name: 'Item 1', code: 'I1' } },
        { id: '2', status: 'PENDING_APPROVAL', serviceItem: { name: 'Item 2', code: 'I2' } },
        { id: '3', status: 'APPROVED', serviceItem: { name: 'Item 3', code: 'I3' } },
        { id: '4', status: 'REJECTED', serviceItem: { name: 'Item 4', code: 'I4' } },
        { id: '5', status: 'REJECTED', serviceItem: { name: 'Item 5', code: 'I5' } },
        { id: '6', status: 'REJECTED', serviceItem: { name: 'Item 6', code: 'I6' } },
      ],
    });

    render(<ListingApprovalPage />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeDefined();
      expect(screen.getByText('1')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined();
    });
  });

  it('does not display hardcoded mock numbers', async () => {
    mockGet.mockResolvedValue({ data: [] });

    render(<ListingApprovalPage />);

    await waitFor(() => {
      expect(screen.queryByText('12')).toBeNull();
      expect(screen.queryByText('84')).toBeNull();
      expect(screen.queryByText('7')).toBeNull();
    });
  });

  it('does not display "(Mock)" labels', async () => {
    mockGet.mockResolvedValue({ data: [] });

    render(<ListingApprovalPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Pending \(Mock\)/i)).toBeNull();
      expect(screen.queryByText(/Approved \(Mock\)/i)).toBeNull();
      expect(screen.queryByText(/Rejected \(Mock\)/i)).toBeNull();
    });
  });
});