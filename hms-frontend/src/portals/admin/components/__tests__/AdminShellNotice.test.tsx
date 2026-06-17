import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminShellNotice } from '../AdminShellNotice';

describe('AdminShellNotice — truthful wording (post-fix)', () => {
  it('renders without the false "all admin data is mock" claim', () => {
    render(<AdminShellNotice />);
    const text = screen.getByTestId('admin-shell-notice').textContent || '';
    // False claims that the old wording made — must NOT appear.
    expect(text).not.toMatch(/functional prototype shell/i);
    expect(text).not.toMatch(/mock-generated for demonstration/i);
    expect(text).not.toMatch(/No real system settings/i);
    expect(text).not.toMatch(/No real .* persisted in this phase/i);
    // Truthful replacement wording.
    expect(text).toMatch(/mixed availability/i);
    expect(text).toMatch(/live-wired/i);
    expect(text).toMatch(/in progress/i);
  });

  it('does not pretend that all data shown on the admin pages is mock', () => {
    render(<AdminShellNotice />);
    const text = screen.getByTestId('admin-shell-notice').textContent || '';
    // Old absolute claim: "Tenant, branch, user, and security data shown here are mock-generated"
    expect(text).not.toMatch(
      /Tenant, branch, user, and security data shown here are mock-generated/i,
    );
  });

  it('does not label the page as "Admin Sandbox" anymore', () => {
    render(<AdminShellNotice />);
    const text = screen.getByTestId('admin-shell-notice').textContent || '';
    expect(text).not.toMatch(/Admin Sandbox/i);
  });
});
