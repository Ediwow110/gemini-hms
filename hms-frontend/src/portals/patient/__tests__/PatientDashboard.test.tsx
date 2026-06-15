/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientDashboard } from '../PatientDashboard';
import { usePatientProfile, usePatientLabResults, usePatientPrescriptions } from '../../../hooks/use-patient-portal';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-patient-portal', () => ({
  usePatientProfile: vi.fn(),
  usePatientLabResults: vi.fn(),
  usePatientPrescriptions: vi.fn(),
}));

if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

const renderWithRouter = (ui: React.ReactElement) => render(ui, { wrapper: BrowserRouter });

describe('PatientDashboard Redesign', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('renders loading skeleton when fetching data', () => {
    vi.mocked(usePatientProfile).mockReturnValue({ profile: null, loading: true, error: null, refetch: vi.fn() });
    vi.mocked(usePatientLabResults).mockReturnValue({ results: [], loading: true, error: null, refetch: vi.fn() });
    vi.mocked(usePatientPrescriptions).mockReturnValue({ prescriptions: [], loading: true, error: null, refetch: vi.fn() });
    
    renderWithRouter(<PatientDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders dashboard with real profile data and HMS shell', () => {
    vi.mocked(usePatientProfile).mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile: { id: '1', patientNumber: 'PT-123', firstName: 'John', lastName: 'Doe', dob: '1990-01-01', status: 'ACTIVE' } as any,
      loading: false, error: null, refetch: vi.fn()
    });
    vi.mocked(usePatientLabResults).mockReturnValue({ results: [], loading: false, error: null, refetch: vi.fn() });
    vi.mocked(usePatientPrescriptions).mockReturnValue({ prescriptions: [], loading: false, error: null, refetch: vi.fn() });

    renderWithRouter(<PatientDashboard />);
    expect(screen.getByText('Hello, John')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Appointment')).toBeInTheDocument();
  });

  it('does not crash when lab results is null', () => {
    vi.mocked(usePatientProfile).mockReturnValue({
      profile: { id: '1', patientNumber: 'PT-123', firstName: 'John', lastName: 'Doe', dob: '1990-01-01', status: 'ACTIVE' } as any,
      loading: false, error: null, refetch: vi.fn()
    });
    vi.mocked(usePatientLabResults).mockReturnValue({ results: null as any, loading: false, error: null, refetch: vi.fn() });
    vi.mocked(usePatientPrescriptions).mockReturnValue({ prescriptions: [], loading: false, error: null, refetch: vi.fn() });

    expect(() => renderWithRouter(<PatientDashboard />)).not.toThrow();
    expect(screen.getByText('Hello, John')).toBeInTheDocument();
  });

  it('does not crash when lab results is an object instead of array', () => {
    vi.mocked(usePatientProfile).mockReturnValue({
      profile: { id: '1', patientNumber: 'PT-123', firstName: 'John', lastName: 'Doe', dob: '1990-01-01', status: 'ACTIVE' } as any,
      loading: false, error: null, refetch: vi.fn()
    });
    vi.mocked(usePatientLabResults).mockReturnValue({ results: { unexpected: true } as any, loading: false, error: null, refetch: vi.fn() });
    vi.mocked(usePatientPrescriptions).mockReturnValue({ prescriptions: [], loading: false, error: null, refetch: vi.fn() });

    expect(() => renderWithRouter(<PatientDashboard />)).not.toThrow();
    expect(screen.getByText('Hello, John')).toBeInTheDocument();
  });

  it('does not crash when prescriptions is null', () => {
    vi.mocked(usePatientProfile).mockReturnValue({
      profile: { id: '1', patientNumber: 'PT-123', firstName: 'John', lastName: 'Doe', dob: '1990-01-01', status: 'ACTIVE' } as any,
      loading: false, error: null, refetch: vi.fn()
    });
    vi.mocked(usePatientLabResults).mockReturnValue({ results: [], loading: false, error: null, refetch: vi.fn() });
    vi.mocked(usePatientPrescriptions).mockReturnValue({ prescriptions: null as any, loading: false, error: null, refetch: vi.fn() });

    expect(() => renderWithRouter(<PatientDashboard />)).not.toThrow();
    expect(screen.getByText('Hello, John')).toBeInTheDocument();
  });

  it('does not crash when prescriptions is an object instead of array', () => {
    vi.mocked(usePatientProfile).mockReturnValue({
      profile: { id: '1', patientNumber: 'PT-123', firstName: 'John', lastName: 'Doe', dob: '1990-01-01', status: 'ACTIVE' } as any,
      loading: false, error: null, refetch: vi.fn()
    });
    vi.mocked(usePatientLabResults).mockReturnValue({ results: [], loading: false, error: null, refetch: vi.fn() });
    vi.mocked(usePatientPrescriptions).mockReturnValue({ prescriptions: { unexpected: true } as any, loading: false, error: null, refetch: vi.fn() });

    expect(() => renderWithRouter(<PatientDashboard />)).not.toThrow();
    expect(screen.getByText('Hello, John')).toBeInTheDocument();
  });
});
