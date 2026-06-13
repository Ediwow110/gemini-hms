import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { DailyReconciliationPage } from '../DailyReconciliationPage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({
    id: 'cashier-1',
    roles: ['Cashier'],
  }),
}));

describe('DailyReconciliationPage', () => {
  it('renders reconciliation metrics', () => {
    render(
      <MemoryRouter>
        <DailyReconciliationPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Cash Collections')).toBeInTheDocument();
    expect(screen.getByText('Expected Cash Total')).toBeInTheDocument();
    expect(screen.getByDisplayValue('23450')).toBeInTheDocument();
  });

  it('calculates variance correctly', () => {
    render(
      <MemoryRouter>
        <DailyReconciliationPage />
      </MemoryRouter>
    );

    const input = screen.getByDisplayValue('23450');
    fireEvent.change(input, { target: { value: '23000' } });

    expect(screen.getByText('₱-450.00')).toBeInTheDocument();
    expect(screen.getByText(/Audit Required/i)).toBeInTheDocument();
  });

  it('requires remarks for variance', () => {
    window.alert = vi.fn();
    render(
      <MemoryRouter>
        <DailyReconciliationPage />
      </MemoryRouter>
    );

    const input = screen.getByDisplayValue('23450');
    fireEvent.change(input, { target: { value: '23000' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Reconciled Shift/i });
    fireEvent.click(submitBtn);

    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Discrepancy remarks are strictly required'));
  });

  it('shows WIP warning', () => {
    render(
      <MemoryRouter>
        <DailyReconciliationPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Daily Reconciliation \(WIP — Simulated Data\)/i)).toBeInTheDocument();
  });
});
