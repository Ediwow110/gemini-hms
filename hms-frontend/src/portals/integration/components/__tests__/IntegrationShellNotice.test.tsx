import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IntegrationShellNotice from '../IntegrationShellNotice';

describe('IntegrationShellNotice — honest state (post-truth-gap fix)', () => {
  it('renders the preserved "Mixed Availability" heading', () => {
    render(<IntegrationShellNotice />);
    expect(
      screen.getByTestId('integration-shell-notice-heading')
    ).toHaveTextContent(/Integration Bridges\s+[—-]\s+Mixed Availability/i);
  });

  it('states that 2 of 7 /v1/integration/* endpoints are now live', () => {
    render(<IntegrationShellNotice />);
    expect(
      screen.getByText(/2 of 7/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Partial namespace implementation/i)).toBeInTheDocument();
    expect(screen.getByText(/\/v1\/integration\/\*/i)).toBeInTheDocument();
  });

  it('states that 5 endpoints remain HTTP 404', () => {
    render(<IntegrationShellNotice />);
    expect(screen.getByText(/5 endpoints remain HTTP 404/i)).toBeInTheDocument();
  });

  it('DOES NOT falsely claim that the portal is live-wired to the HMS backend', () => {
    render(<IntegrationShellNotice />);
    expect(
      screen.queryByText(/live-wired to the HMS backend/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/live wired to the HMS backend/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/live-wired to the backend/i)
    ).not.toBeInTheDocument();
  });

  it('DOES NOT introduce fabricated "live" or "operational" claims', () => {
    render(<IntegrationShellNotice />);
    expect(
      screen.queryByText(/all bridges operational/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/live data is shown/i)
    ).not.toBeInTheDocument();
  });

  it('honestly describes the dashboard cards as showing — for the 5 unavailable endpoints', () => {
    render(<IntegrationShellNotice />);
    expect(
      screen.getByText(/5 unavailable ones/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/MOCK/i)).toBeInTheDocument();
  });

  it('points users to the live approval routes (correctly bounded)', () => {
    render(<IntegrationShellNotice />);
    expect(screen.getByRole('link', { name: /Approval Center/i })).toHaveAttribute(
      'href',
      '/integration/approvals'
    );
    expect(screen.getByRole('link', { name: /\/approvals/i })).toHaveAttribute(
      'href',
      '/approvals'
    );
  });
});
