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

vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn() },
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

  it('routes locally validated review to the live Shift Closure panel', () => {
    render(<CashierClosing />);

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '23450' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review in Shift Closure' }));

    expect(mockNavigate).toHaveBeenCalledWith('/cashier/session');
    expect(mockNavigate).not.toHaveBeenCalledWith('/');
  });
});
