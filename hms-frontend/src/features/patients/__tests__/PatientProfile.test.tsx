import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PatientProfile } from '../PatientProfile';
import type { ReactNode } from 'react';

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

vi.mock('../../../services/doctor.service', () => ({
  doctorService: {
    getPatient: vi.fn(),
  },
}));

vi.mock('../../notes/PatientNoteForm', () => ({
  PatientNoteForm: ({ patientId }: { patientId: string }) => (
    <div data-testid="patient-note-form" data-patient-id={patientId}>
      Note form (live-wired)
    </div>
  ),
}));

import { doctorService } from '../../../services/doctor.service';

const mockPatient = {
  id: 'P-12345',
  patientNumber: 'PT-001234',
  firstName: 'Alice',
  lastName: 'Anderson',
  dob: '1985-06-15T00:00:00.000Z',
  status: 'ACTIVE',
  createdAt: '2024-01-10T00:00:00.000Z',
};

function renderProfile(patientId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/patients/${patientId}`]}>
        <Routes>
          <Route path="/patients/:id" element={<PatientProfile />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PatientProfile — live-wired', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({
      id: 'u-1',
      email: 'doc@hospital.com',
      tenantId: 't-1',
      branchId: 'b-1',
      roles: ['Doctor'],
      permissions: ['patient.view'],
    });
    vi.mocked(doctorService.getPatient).mockResolvedValue(mockPatient);
  });

  it('fetches and renders real patient data from the API', async () => {
    renderProfile('P-12345');
    await waitFor(() => {
      expect(screen.getByText(/Anderson, Alice/)).toBeInTheDocument();
    });
    expect(screen.getByText(/PT-001234/)).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE/)).toBeInTheDocument();
  });

  it('does NOT render any hardcoded patient identity (no "John Doe", no fake age/gender/balance)', () => {
    renderProfile('P-12345');
    expect(screen.queryByText(/John Doe/)).not.toBeInTheDocument();
    expect(screen.queryByText('45Y / M')).not.toBeInTheDocument();
    expect(screen.queryByText(/\$50/)).not.toBeInTheDocument();
  });

  it('renders the audit footer pointing to the live API', () => {
    renderProfile('P-12345');
    expect(screen.getByText(/Live API — \/api\/v1\/patients\/:id/)).toBeInTheDocument();
  });

  it('renders the Notes tab live-wired', () => {
    renderProfile('P-12345');
    const notesTab = screen.getByRole('button', { name: /^Notes$/ });
    fireEvent.click(notesTab);
    const form = screen.getByTestId('patient-note-form');
    expect(form).toBeInTheDocument();
    expect(form.getAttribute('data-patient-id')).toBe('P-12345');
  });

  it('shows a loading state while fetching', () => {
    vi.mocked(doctorService.getPatient).mockReturnValue(new Promise(() => {}));
    renderProfile('P-12345');
    expect(screen.getByTestId('patient-profile-loading')).toBeInTheDocument();
  });

  it('shows an error state when the API call fails', async () => {
    vi.mocked(doctorService.getPatient).mockRejectedValue(new Error('Network error'));
    renderProfile('P-12345');
    await waitFor(() => {
      expect(screen.getByTestId('patient-profile-error')).toBeInTheDocument();
    });
    expect(screen.getByText(/Could not load patient data/)).toBeInTheDocument();
  });

  it('does not show fabricated identity in unwired tabs', () => {
    vi.mocked(doctorService.getPatient).mockResolvedValue(mockPatient);
    renderProfile('P-12345');
    const unwiredTabs = ['Orders', 'Billing', 'Lab Results', 'Documents', 'Timeline'];
    for (const tab of unwiredTabs) {
      const tabBtn = screen.getByRole('button', { name: new RegExp(`^${tab}$`) });
      fireEvent.click(tabBtn);
      expect(screen.getByText(new RegExp(`No ${tab.toLowerCase()} data available yet`, 'i')))
        .toBeInTheDocument();
    }
  });
});
