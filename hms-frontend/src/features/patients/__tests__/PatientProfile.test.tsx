import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PatientProfile } from '../PatientProfile';

const mockUseUser = vi.fn();

vi.mock('../../../hooks/use-user', () => ({
  useUser: () => mockUseUser(),
  useAuth: () => ({
    user: { id: 'u-1', email: 'doc@hospital.com', roles: ['Doctor'], permissions: [] },
    isLoading: false,
    logout: vi.fn(),
    refetchUser: vi.fn(),
  }),
  usePermissions: () => ({
    isSuperAdmin: false,
    isBranchAdmin: false,
    isStaff: () => true,
    hasPermission: () => true,
    hasRole: () => true,
    canAccess: () => true,
  }),
}));

// Stub the live-wired Notes form so the test doesn't depend on autodraft store.
vi.mock('../../notes/PatientNoteForm', () => ({
  PatientNoteForm: ({ patientId }: { patientId: string }) => (
    <div data-testid="patient-note-form" data-patient-id={patientId}>
      Note form (live-wired)
    </div>
  ),
}));

const renderProfile = (patientId: string) =>
  render(
    <MemoryRouter initialEntries={[`/patients/${patientId}`]}>
      <Routes>
        <Route path="/patients/:id" element={<PatientProfile />} />
      </Routes>
    </MemoryRouter>
  );

describe('PatientProfile — honest-stub contract', () => {
  beforeEach(() => {
    mockUseUser.mockReturnValue({
      id: 'u-1',
      email: 'doc@hospital.com',
      tenantId: 't-1',
      branchId: 'b-1',
      roles: ['Doctor'],
      permissions: ['patient.view'],
    });
  });

  it('does NOT render any hardcoded patient identity (no "John Doe", no fake age/gender/balance)', () => {
    renderProfile('P-12345');
    // Regression guards against the prior hardcoded `John Doe, 45, M, Regular, $50` bug.
    expect(screen.queryByText(/John Doe/)).not.toBeInTheDocument();
    expect(screen.queryByText('45Y / M')).not.toBeInTheDocument();
    expect(screen.queryByText(/\$50/)).not.toBeInTheDocument();
    expect(screen.queryByText('Regular')).not.toBeInTheDocument();
  });

  it('shows a body-level honest notice stating the Demographics tab is not live-wired', () => {
    renderProfile('P-12345');
    expect(screen.getByTestId('patient-profile-shell-notice')).toBeInTheDocument();
    expect(screen.getByTestId('patient-profile-shell-title')).toHaveTextContent(
      /Demographics tab is not live-wired/i
    );
  });

  it('reflects the patientId from the URL inside the honest notice (not the literal "John Doe" id)', () => {
    renderProfile('P-99999');
    const body = screen.getByTestId('patient-profile-shell-body');
    expect(body.textContent).toContain('P-99999');
  });

  it('renders the HmsDataUnavailable honest-stub component on the Overview tab', () => {
    renderProfile('P-12345');
    expect(screen.getByTestId('patient-profile-overview')).toBeInTheDocument();
    expect(screen.getByText(/Patient Demographics/)).toBeInTheDocument();
    expect(screen.getByText(/GET \/api\/v1\/patients\/:id/)).toBeInTheDocument();
  });

  it('renders the audit footer describing the partial live-wired state', () => {
    renderProfile('P-12345');
    expect(screen.getByText(/Live API — \/api\/v1\/patients\/:id/)).toBeInTheDocument();
  });

  it('keeps the Notes tab live-wired (the only genuine live surface on this page)', () => {
    renderProfile('P-12345');
    const notesTab = screen.getByRole('button', { name: /^Notes$/ });
    fireEvent.click(notesTab);
    const form = screen.getByTestId('patient-note-form');
    expect(form).toBeInTheDocument();
    expect(form.getAttribute('data-patient-id')).toBe('P-12345');
  });

  it('does not show fabricated identity content in any of the still-unwired tabs (Orders, Billing, Lab Results, Documents, Timeline)', () => {
    renderProfile('P-12345');
    const unwiredTabs = ['Orders', 'Billing', 'Lab Results', 'Documents', 'Timeline'];
    for (const tab of unwiredTabs) {
      const tabBtn = screen.getByRole('button', { name: new RegExp(`^${tab}$`) });
      fireEvent.click(tabBtn);
      // Should show the "No X data available yet" empty state, NOT fabricated rows.
      expect(screen.getByText(new RegExp(`No ${tab.toLowerCase()} data available yet`, 'i')))
        .toBeInTheDocument();
      // No "John Doe" appears in any unwired tab.
      expect(screen.queryByText(/John Doe/)).not.toBeInTheDocument();
    }
  });
});
