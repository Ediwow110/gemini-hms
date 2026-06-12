import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { RefundVoidQueuePage } from '../RefundVoidQueuePage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../hooks/use-user', () => ({
  useUser: () => ({
    id: 'cashier-1',
    name: 'Mark Santos',
    roles: ['Cashier'],
  }),
}));

describe('RefundVoidQueuePage', () => {
  it('renders initial requests', () => {
    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Jonathan Harker')).toBeInTheDocument();
    expect(screen.getByText('Wilhelmina Murray')).toBeInTheDocument();
  });

  it('allows approving a request', () => {
    window.alert = vi.fn();
    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    const approveBtns = screen.getAllByRole('button', { name: /Approve/i });
    fireEvent.click(approveBtns[0]);

    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('authorized and cleared'));
    expect(screen.getAllByText('Processed').length).toBeGreaterThan(1);
  });

  it('allows submitting a new request', () => {
    window.alert = vi.fn();
    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('RCP-2026-xxxx'), { target: { value: 'RCP-999' } });
    fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'Lucy Westenra' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1200' } });
    fireEvent.change(screen.getByPlaceholderText('Detail reason...'), { target: { value: 'Test reason' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));

    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('submitted to supervisor review queue'));
    expect(screen.getByText('Lucy Westenra')).toBeInTheDocument();
  });

  it('shows sandbox warning', () => {
    render(
      <MemoryRouter>
        <RefundVoidQueuePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Sandbox — No Backend Effect/i)).toBeInTheDocument();
  });
});
