import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RoleBasedSidebar } from '../RoleBasedSidebar';

const mockUseAuth = vi.fn();
const mockUsePermissions = vi.fn();
const mockUseUser = vi.fn();

vi.mock('../../hooks/use-user', () => ({
  useAuth: () => mockUseAuth(),
  usePermissions: () => mockUsePermissions(),
  useUser: () => mockUseUser(),
}));

describe('RoleBasedSidebar — Navigation Active States', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isLoading: false, logout: vi.fn() });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: false,
      canAccess: () => true, // Allow all items for testing
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('marks only the exact matched item active (e.g. Department Manager on /branch-admin/departments)', () => {
    mockUseUser.mockReturnValue({
      id: 'ba-1',
      email: 'branch-admin@hospital.com',
      roles: ['Branch Admin'],
    });

    render(
      <MemoryRouter initialEntries={['/branch-admin/departments']}>
        <RoleBasedSidebar pathname="/branch-admin/departments" />
      </MemoryRouter>
    );

    const deptLinks = screen.getAllByText('Department Manager');
    const deptLink = deptLinks.find(link => link.closest('a')?.getAttribute('href') === '/branch-admin/departments')?.closest('a');
    const dashboardLink = screen.getByText('Branch Dashboard').closest('a');

    expect(deptLink).toHaveClass('bg-gradient-to-r'); // active style
    expect(dashboardLink).not.toHaveClass('bg-gradient-to-r'); // should not be active!
  });

  it('marks the longest prefix match active when on a sub-route (e.g. Department Manager on /branch-admin/departments/new)', () => {
    mockUseUser.mockReturnValue({
      id: 'ba-1',
      email: 'branch-admin@hospital.com',
      roles: ['Branch Admin'],
    });

    render(
      <MemoryRouter initialEntries={['/branch-admin/departments/new']}>
        <RoleBasedSidebar pathname="/branch-admin/departments/new" />
      </MemoryRouter>
    );

    const deptLinks = screen.getAllByText('Department Manager');
    const deptLink = deptLinks.find(link => link.closest('a')?.getAttribute('href') === '/branch-admin/departments')?.closest('a');
    const dashboardLink = screen.getByText('Branch Dashboard').closest('a');

    expect(deptLink).toHaveClass('bg-gradient-to-r'); // active style
    expect(dashboardLink).not.toHaveClass('bg-gradient-to-r');
  });

  it('marks Branch Dashboard active when exactly on /branch-admin', () => {
    mockUseUser.mockReturnValue({
      id: 'ba-1',
      email: 'branch-admin@hospital.com',
      roles: ['Branch Admin'],
    });

    render(
      <MemoryRouter initialEntries={['/branch-admin']}>
        <RoleBasedSidebar pathname="/branch-admin" />
      </MemoryRouter>
    );

    const deptLinks = screen.getAllByText('Department Manager');
    const deptLink = deptLinks.find(link => link.closest('a')?.getAttribute('href') === '/branch-admin/departments')?.closest('a');
    const dashboardLink = screen.getByText('Branch Dashboard').closest('a');

    expect(dashboardLink).toHaveClass('bg-gradient-to-r'); // active style
    expect(deptLink).not.toHaveClass('bg-gradient-to-r');
  });
});
