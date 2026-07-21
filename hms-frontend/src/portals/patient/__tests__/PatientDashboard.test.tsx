/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PatientDashboard } from '../PatientDashboard';
import {
  usePatientInvoices,
  usePatientLabResults,
  usePatientPrescriptions,
  usePatientProfile,
} from '../../../hooks/use-patient-portal';

vi.mock('../../../hooks/use-patient-portal', () => ({
  usePatientProfile: vi.fn(),
  usePatientLabResults: vi.fn(),
  usePatientPrescriptions: vi.fn(),
  usePatientInvoices: vi.fn(),
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(ui, { wrapper: BrowserRouter });

const setup = ({
  loading = false,
  results = [],
  prescriptions = [],
  invoices = [],
}: {
  loading?: boolean;
  results?: unknown;
  prescriptions?: unknown;
  invoices?: unknown;
} = {}) => {
  vi.mocked(usePatientProfile).mockReturnValue({
    profile: loading
      ? null
      : {
          id: '1',
          patientNumber: 'PT-123',
          firstName: 'John',
          lastName: 'Doe',
          dob: '1990-01-01',
          status: 'ACTIVE',
        } as any,
    loading,
    error: null,
    refetch: vi.fn(),
  });
  vi.mocked(usePatientLabResults).mockReturnValue({
    results: results as any,
    loading,
    error: null,
    refetch: vi.fn(),
  });
  vi.mocked(usePatientPrescriptions).mockReturnValue({
    prescriptions: prescriptions as any,
    loading,
    error: null,
    refetch: vi.fn(),
  });
  vi.mocked(usePatientInvoices).mockReturnValue({
    invoices: invoices as any,
    loading,
    error: null,
    refetch: vi.fn(),
  });
};

describe('PatientDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state while portal resources are fetched', () => {
    setup({ loading: true });
    renderWithRouter(<PatientDashboard />);

    expect(screen.getByText('Loading your portal…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh dashboard data/i })).toBeDisabled();
  });

  it('renders the personal portal hierarchy with live profile data', () => {
    setup({
      results: [{ id: 'result-1', createdAt: '2026-07-01', lockedAt: '2026-07-02', remarks: 'Normal' }],
      prescriptions: [{ id: 'rx-1', status: 'ACTIVE' }],
      invoices: [{ id: 'inv-1', totalAmount: 2000, paidAmount: 500 }],
    });
    renderWithRouter(<PatientDashboard />);

    expect(screen.getByText('Hello, John')).toBeInTheDocument();
    expect(screen.getByText('Common actions')).toBeInTheDocument();
    expect(screen.getByText(/Upcoming appointments — data not available yet/i)).toBeInTheDocument();
    expect(screen.getByText('Released lab results')).toBeInTheDocument();
    expect(screen.getByText('Outstanding balance')).toBeInTheDocument();
  });

  it.each([
    ['null lab results', null, []],
    ['object lab results', { unexpected: true }, []],
    ['null prescriptions', [], null],
    ['object prescriptions', [], { unexpected: true }],
  ])('does not crash for malformed %s', (_label, results, prescriptions) => {
    setup({ results, prescriptions });

    expect(() => renderWithRouter(<PatientDashboard />)).not.toThrow();
    expect(screen.getByText('Hello, John')).toBeInTheDocument();
  });
});
