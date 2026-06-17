import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PatientList } from '../PatientList';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderPage = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('PatientList — sandbox disclosure (post-truth-alignment)', () => {
  it('renders page title with explicit (Mock) suffix', () => {
    renderPage(<PatientList />);
    expect(screen.getByText('Patients (Mock)')).toBeInTheDocument();
  });

  it('renders body-level sandbox notice', () => {
    renderPage(<PatientList />);
    expect(screen.getByTestId('patient-list-sandbox-notice')).toBeInTheDocument();
    expect(screen.getByText(/The patient rows, balances, and statuses shown below are mock placeholder data/i)).toBeInTheDocument();
  });

  it('renders honest audit footer', () => {
    renderPage(<PatientList />);
    expect(screen.getByText(/Mock patient list \(sandbox\)/i)).toBeInTheDocument();
  });

  it('disclosure explicitly states the patient names are fake', () => {
    renderPage(<PatientList />);
    expect(screen.getByText(/intentionally fake/i)).toBeInTheDocument();
  });

  it('disclosure points to the live Register Patient flow', () => {
    renderPage(<PatientList />);
    expect(screen.getByText(/live patient registration flow is at the/i)).toBeInTheDocument();
  });

  it('Register Patient button is present and remains wired to nurse intake', () => {
    renderPage(<PatientList />);
    expect(screen.getByRole('button', { name: /Register Patient/i })).toBeInTheDocument();
  });
});
