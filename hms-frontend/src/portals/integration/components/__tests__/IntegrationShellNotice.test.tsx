import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import IntegrationShellNotice from '../IntegrationShellNotice';

const renderNotice = () =>
  render(
    <MemoryRouter>
      <IntegrationShellNotice />
    </MemoryRouter>,
  );

describe('IntegrationShellNotice — honest state (post-truth-gap fix)', () => {
  it('renders the preserved "Mixed Availability" heading', () => {
    renderNotice();
    expect(
      screen.getByTestId('integration-shell-notice-heading')
    ).toHaveTextContent(/Integration Bridges\s+[—-]\s+Mixed Availability/i);
  });

  it('states that 2 of 7 /v1/integration/* endpoints are now live', () => {
    renderNotice();
    expect(
      screen.getByText(/2 of 7/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Partial namespace implementation/i)).toBeInTheDocument();
    expect(screen.getByText(/\/v1\/integration\/\*/i)).toBeInTheDocument();
  });

  it('states that 5 endpoints are shell placeholders returning empty arrays (not HTTP 404)', () => {
    renderNotice();
    expect(screen.getByText(/5 endpoints are shell placeholders/i)).toBeInTheDocument();
    expect(screen.getByText(/HTTP 200, empty arrays/i)).toBeInTheDocument();
    expect(screen.queryByText(/5 endpoints remain HTTP 404/i)).not.toBeInTheDocument();
  });

  it('DOES NOT falsely claim that the portal is live-wired to the HMS backend', () => {
    renderNotice();
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
    renderNotice();
    expect(
      screen.queryByText(/all bridges operational/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/live data is shown/i)
    ).not.toBeInTheDocument();
  });

  it('honestly describes the dashboard cards as showing — + MOCK for shell-empty endpoints', () => {
    renderNotice();
    expect(
      screen.getByText(/5 shell-empty endpoints/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/not real zero metrics/i)).toBeInTheDocument();
    expect(screen.getByText(/MOCK/i)).toBeInTheDocument();
  });

  it('points users to the live approval routes (correctly bounded)', () => {
    renderNotice();
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
