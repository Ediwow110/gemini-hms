import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PatientAppointmentsPage } from '../PatientAppointmentsPage';
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (ui: React.ReactElement) => render(ui, { wrapper: BrowserRouter });

describe('PatientAppointmentsPage Redesign', () => {
  it('renders within HMS shell and displays WIP warning and disabled action button', () => {
    renderWithRouter(<PatientAppointmentsPage />);
    
    expect(screen.getByText('My Appointments')).toBeInTheDocument();
    expect(screen.getByText('Appointments (WIP)')).toBeInTheDocument();
    expect(screen.getByText('No appointments available')).toBeInTheDocument();
    
    const button = screen.getByText('Book Appointment (WIP)');
    expect(button).toBeDisabled();
  });
});
