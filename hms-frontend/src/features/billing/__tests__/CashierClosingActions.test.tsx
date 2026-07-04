import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CashierClosing } from '../CashierClosing';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../components/ui/RequirePermission', () => ({
  RequirePermission: ({ children }: { children: unknown }) => children,
}));

describe('CashierClosing legacy action routing', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('opens the live Shift Closure panel instead of the root dashboard', () => {
    render(<CashierClosing />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Shift Closure' }));

    expect(mockNavigate).toHaveBeenCalledWith('/cashier/session');
    expect(mockNavigate).not.toHaveBeenCalledWith('/');
  });

  it('routes to Shift Closure via Review in Shift Closure button', () => {
    render(<CashierClosing />);

    fireEvent.click(screen.getByRole('button', { name: 'Review in Shift Closure' }));

    expect(mockNavigate).toHaveBeenCalledWith('/cashier/session');
  });
});
