import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { UserList } from '../UserList';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('UserList Sandbox Hardening', () => {
  it('renders a sandbox banner explaining the page is a mock', () => {
    renderWithRouter(<UserList />);
    expect(
      screen.getByText(/this page is a sandbox mock/i)
    ).toBeInTheDocument();
  });

  it('shows the HmsAuditFooter with "Mock user list (sandbox)" dataSource', () => {
    renderWithRouter(<UserList />);
    expect(screen.getByText(/Source: Mock user list \(sandbox\)/i)).toBeInTheDocument();
  });

  it('does NOT display hardcoded metric values "25", "22", "1", or "2"', () => {
    renderWithRouter(<UserList />);
    expect(screen.queryByText('25')).not.toBeInTheDocument();
    expect(screen.queryByText('22')).not.toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('renders "View Profile" controls as disabled (not real navigation)', () => {
    renderWithRouter(<UserList />);
    const disabledControls = screen.getAllByTestId('userlist-view-profile-disabled');
    expect(disabledControls.length).toBe(3); // one per mock user
    for (const control of disabledControls) {
      // Must NOT be a real <a href> link to a fake user ID
      expect(control.closest('a')).toBeNull();
      // Must be a <span> (not a real link)
      expect(control.tagName).toBe('SPAN');
      // Must have aria-disabled="true" for accessibility
      expect(control).toHaveAttribute('aria-disabled', 'true');
    }
  });
});
