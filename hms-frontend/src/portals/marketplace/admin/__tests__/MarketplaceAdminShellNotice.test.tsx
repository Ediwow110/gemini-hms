import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MarketplaceAdminShellNotice from '../components/MarketplaceAdminShellNotice';

describe('MarketplaceAdminShellNotice', () => {
  it('does not contain "functional prototype shell"', () => {
    render(<MarketplaceAdminShellNotice />);
    expect(screen.queryByText(/functional prototype shell/i)).toBeNull();
  });

  it('does not contain "mock-generated for demonstration"', () => {
    render(<MarketplaceAdminShellNotice />);
    expect(screen.queryByText(/mock-generated for demonstration/i)).toBeNull();
  });

  it('does not contain "Marketplace Admin Sandbox"', () => {
    render(<MarketplaceAdminShellNotice />);
    expect(screen.queryByText(/Marketplace Admin Sandbox/i)).toBeNull();
  });

  it('contains truthful "mixed availability" heading', () => {
    render(<MarketplaceAdminShellNotice />);
    expect(screen.getByText(/Marketplace Admin — Mixed Availability/i)).toBeDefined();
  });

  it('mentions listing queue and KPI counts are live-wired', () => {
    render(<MarketplaceAdminShellNotice />);
    expect(screen.getByText(/listing approval queue and kpi counts are live-wired/i)).toBeDefined();
  });
});