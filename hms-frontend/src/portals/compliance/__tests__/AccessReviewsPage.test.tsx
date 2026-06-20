import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccessReviewsPage } from '../AccessReviewsPage';
import { useAccessReview } from '../../../hooks/use-compliance';

vi.mock('../../../hooks/use-compliance', () => ({
  useAccessReview: vi.fn(),
}));

describe('AccessReviewsPage Runtime Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('renders standardized shell/header and handles loading state successfully', () => {
    vi.mocked(useAccessReview).mockReturnValue({
      report: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<AccessReviewsPage />);
    expect(screen.getByText('Access Certification Reviews')).toBeInTheDocument();
    expect(screen.getByText('Verify employee privilege scope boundaries, enforce MFA, and audit stale credentials')).toBeInTheDocument();
    expect(screen.getByText('Loading access review data...')).toBeInTheDocument();
  });

  it('renders certification view with empty accounts fallback list', () => {
    vi.mocked(useAccessReview).mockReturnValue({
      report: {
        complianceStatus: 'COMPLIANT',
        staleAccountsCount: 0,
        privilegeEscalationsCount: 0,
        accessReport: [],
        staleAccounts: [],
        privilegeEscalations: [],
        reviewTimestamp: '',
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AccessReviewsPage />);
    expect(screen.getByText('Access Certification Reviews')).toBeInTheDocument();
    expect(screen.getByText('No users found for access review')).toBeInTheDocument();
  });

  it('renders user directory entries correctly and supports the attestation modal workflow', () => {
    vi.mocked(useAccessReview).mockReturnValue({
      report: {
        complianceStatus: 'COMPLIANT',
        staleAccountsCount: 1,
        privilegeEscalationsCount: 0,
        accessReport: [
          {
            userId: 'usr-1',
            email: 'doctor@hms.com',
            roles: ['Doctor'],
            lastLogin: '2026-05-21 12:00',
            mfaEnabled: true,
          },
        ],
        staleAccounts: [],
        privilegeEscalations: [],
        reviewTimestamp: '',
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AccessReviewsPage />);
    expect(screen.getByText('Access Certification Reviews')).toBeInTheDocument();
    expect(screen.getByText('doctor@hms.com')).toBeInTheDocument();
    expect(screen.getByText('MFA ACTIVE')).toBeInTheDocument();

    // Verify stats block values
    expect(screen.getByText('Total Accounts')).toBeInTheDocument();
    expect(screen.getByText('Stale Accounts')).toBeInTheDocument();
    expect(screen.getByText('MFA Compliance')).toBeInTheDocument();

    // Perform attestation action flow
    const certifyBtn = screen.getByRole('button', { name: /Certify Access/i });
    expect(certifyBtn).toBeInTheDocument();
    fireEvent.click(certifyBtn);

    // Modal is open
    expect(screen.getByText('Certify User Access')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter access justification or remediation notes...')).toBeInTheDocument();

    // Verify buttons are disabled and show honest notice
    const approveBtn = screen.getByRole('button', { name: /Approve/i });
    const revokeBtn = screen.getByRole('button', { name: /Revoke/i });
    expect(approveBtn).toBeDisabled();
    expect(revokeBtn).toBeDisabled();
    expect(screen.getByText(/This interface is currently in read-only mode/i)).toBeInTheDocument();

    // Try clicking disabled button
    fireEvent.click(approveBtn);

    // Verify alert mock NOT called
    expect(window.alert).not.toHaveBeenCalled();

    // Modal closes via cancel
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Modal is closed
    expect(screen.queryByText('Certify User Access')).not.toBeInTheDocument();
  });
});
