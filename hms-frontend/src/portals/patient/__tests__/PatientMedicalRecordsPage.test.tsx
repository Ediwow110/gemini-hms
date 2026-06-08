import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientMedicalRecordsPage } from '../PatientMedicalRecordsPage';
import { usePatientMedicalRecordRequests } from '../../../hooks/use-patient-portal';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-patient-portal', () => ({
  usePatientMedicalRecordRequests: vi.fn(),
}));

vi.mock('../../../services/patient-portal.service', () => ({
  patientPortalService: {
    createMedicalRecordRequest: vi.fn(),
  }
}));

const renderWithRouter = (ui: React.ReactElement) => render(ui, { wrapper: BrowserRouter });

describe('PatientMedicalRecordsPage Redesign', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('renders within HMS Dashboard Shell with empty state and preserved partial workflows', () => {
    vi.mocked(usePatientMedicalRecordRequests).mockReturnValue({ requests: [], loading: false, error: null, refetch: vi.fn() });
    
    renderWithRouter(<PatientMedicalRecordsPage />);
    expect(screen.getByText('Medical Records & Summaries')).toBeInTheDocument();
    expect(screen.getByText('No record requests found')).toBeInTheDocument();
    expect(screen.getByText('Full Medical Record Access')).toBeInTheDocument();
    expect(screen.getByText('Request Medical Record Copy')).toBeInTheDocument();
  });
});
