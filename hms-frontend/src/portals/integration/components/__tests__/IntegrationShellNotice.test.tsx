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

  it('states that /v1/integration/* is not implemented in the backend', () => {
    render(<IntegrationShellNotice />);
    expect(
      screen.getByText(/no backend implementation yet/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/\/v1\/integration\/\*/i)).toBeInTheDocument();
  });

  it('states that drill-down pages will return HTTP 404', () => {
    render(<IntegrationShellNotice />);
    expect(screen.getByText(/HTTP 404/i)).toBeInTheDocument();
  });

  it('DOES NOT falsely claim that the portal is live-wired to the HMS backend', () => {
    render(<IntegrationShellNotice />);
    // The old false claim: "Billing approvals and basic event listings are live-wired to the HMS backend."
    expect(
      screen.queryByText(/live-wired to the HMS backend/i)
    ).not.toBeInTheDocument();
    // Other variations that should also be gone
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

  it('honestly describes the dashboard cards as showing the failed fetch state', () => {
    render(<IntegrationShellNotice />);
    expect(
      screen.getByText(/failed fetch state/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/MOCK badge/i)).toBeInTheDocument();
  });

  it('points users to the live approval routes (correctly bounded)', () => {
    render(<IntegrationShellNotice />);
    // Regular billing approvals remain live
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
