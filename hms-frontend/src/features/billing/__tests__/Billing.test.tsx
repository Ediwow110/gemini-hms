import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Billing } from '../Billing';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
  };
});

const renderWithRouter = (ui: React.ReactElement) =>
  render(ui, { wrapper: MemoryRouter });

describe('Billing (orphan /billing route) honesty tests', () => {
  it('does not expose a "Process Payment" button that fakes success', () => {
    renderWithRouter(<Billing />);
    const fakeButtons = screen
      .queryAllByRole('button')
      .filter((b) => /process payment/i.test(b.textContent || ''));
    expect(fakeButtons).toHaveLength(0);
  });

  it('does not present a hardcoded "John Doe" mock patient', () => {
    renderWithRouter(<Billing />);
    expect(screen.queryByText(/John Doe/)).not.toBeInTheDocument();
  });

  it('does not present a hardcoded INV-2026-001 fake invoice', () => {
    renderWithRouter(<Billing />);
    expect(screen.queryByText('INV-2026-001')).not.toBeInTheDocument();
  });

  it('does not present a patient search field (the mock no longer drives hidden state)', () => {
    renderWithRouter(<Billing />);
    expect(
      screen.queryByPlaceholderText(/search by name, id, or invoice number/i),
    ).not.toBeInTheDocument();
  });

  it('renders an honest notice explaining the page is not the production billing surface', () => {
    renderWithRouter(<Billing />);
    expect(
      screen.getByTestId('billing-prototype-notice'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This page is not the production billing surface/i),
    ).toBeInTheDocument();
  });

  it('redirects to /billing/dashboard via <Navigate>', () => {
    renderWithRouter(<Billing />);
    const nav = screen.getByTestId('navigate-to');
    expect(nav).toHaveTextContent('/billing/dashboard');
  });

  it('exposes a working link to the live Billing & Finance Dashboard', () => {
    renderWithRouter(<Billing />);
    const link = screen.getByTestId('link-billing-dashboard');
    expect(link).toHaveAttribute('href', '/billing/dashboard');
  });
});
