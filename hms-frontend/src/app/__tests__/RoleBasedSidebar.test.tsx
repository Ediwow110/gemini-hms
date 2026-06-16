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

  it('marks only the exact matched item active (e.g. Organization Settings on /settings)', () => {
    mockUseUser.mockReturnValue({
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
    });

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <RoleBasedSidebar pathname="/settings" />
      </MemoryRouter>
    );

    const getNavItem = (element: HTMLElement | null) => element ? (element.closest('a') || element.closest('button')) : null;
    const settingLinks = screen.getAllByText('Organization Settings');
    const settingLink = settingLinks.map(el => getNavItem(el)).find(parent => parent?.getAttribute('href') === '/settings' || parent?.tagName.toLowerCase() === 'button');
    const tenantsLink = getNavItem(screen.getByText('Tenants Manager'));

    expect(settingLink).toHaveClass('bg-gradient-to-r'); // active style
    expect(tenantsLink).not.toHaveClass('bg-gradient-to-r'); // should not be active!
  });

  it('marks the longest prefix match active when on a sub-route (e.g. Organization Settings on /settings/security)', () => {
    mockUseUser.mockReturnValue({
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
    });

    render(
      <MemoryRouter initialEntries={['/settings/security']}>
        <RoleBasedSidebar pathname="/settings/security" />
      </MemoryRouter>
    );

    const getNavItem = (element: HTMLElement | null) => element ? (element.closest('a') || element.closest('button')) : null;
    const settingLinks = screen.getAllByText('Organization Settings');
    const settingLink = settingLinks.map(el => getNavItem(el)).find(parent => parent?.getAttribute('href') === '/settings' || parent?.tagName.toLowerCase() === 'button');
    const tenantsLink = getNavItem(screen.getByText('Tenants Manager'));

    expect(settingLink).toHaveClass('bg-gradient-to-r'); // active style
    expect(tenantsLink).not.toHaveClass('bg-gradient-to-r');
  });

  it('does not mark sibling prefix routes active (e.g. SuperAdmin Dashboard on /admin/tenants)', () => {
    mockUseUser.mockReturnValue({
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
    });

    render(
      <MemoryRouter initialEntries={['/admin/tenants']}>
        <RoleBasedSidebar pathname="/admin/tenants" />
      </MemoryRouter>
    );

    const getNavItem = (element: HTMLElement | null) => element ? (element.closest('a') || element.closest('button')) : null;
    const dashboardLink = getNavItem(screen.getByText('SuperAdmin Dashboard'));
    const tenantsLink = getNavItem(screen.getByText('Tenants Manager'));

    expect(tenantsLink).toHaveClass('bg-gradient-to-r'); // exact match active style
    expect(dashboardLink).not.toHaveClass('bg-gradient-to-r'); // should not be active since it is a leaf sibling!
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

    const getNavItem = (element: HTMLElement | null) => element ? (element.closest('a') || element.closest('button')) : null;
    const settingLinks = screen.getAllByText('Branch Settings');
    const settingLink = settingLinks.map(el => getNavItem(el)).find(parent => parent?.getAttribute('href') === '/settings' || parent?.tagName.toLowerCase() === 'button');
    const dashboardLink = getNavItem(screen.getByText('Branch Dashboard'));

    expect(dashboardLink).toHaveClass('bg-gradient-to-r'); // active style
    expect(settingLink).not.toHaveClass('bg-gradient-to-r');
  });

  it('hides WIP routes and branch-scoped routes for Super Admin with no branch', () => {
    const user = {
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      branchId: null,
    };
    mockUseUser.mockReturnValue(user);
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: true,
      canAccess: (opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
        if (opts.zone === 'staff' && opts.isBranchScoped && !user.branchId) return false;
        return true;
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <RoleBasedSidebar pathname="/admin" />
      </MemoryRouter>
    );

    // Core admin routes should be visible
    expect(screen.getByText('Tenants Manager')).toBeInTheDocument();
    expect(screen.getByText('Branches Manager')).toBeInTheDocument();
    expect(screen.getByText('Users & Accounts')).toBeInTheDocument();

    // WIP routes should be hidden
    expect(screen.queryByText('Drug Inventory')).not.toBeInTheDocument();
    expect(screen.queryByText('Backup & Recovery')).not.toBeInTheDocument();

    // Branch-scoped routes should be hidden (since branchId is None)
    expect(screen.queryByText('Branch Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Cashier Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Doctor Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Nurse Dashboard')).not.toBeInTheDocument();
  });

  it('shows branch-scoped routes for Super Admin when branch is selected', () => {
    const user = {
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      branchId: 'branch-123',
    };
    mockUseUser.mockReturnValue(user);
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: true,
      canAccess: (opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
        if (opts.zone === 'staff' && opts.isBranchScoped && !user.branchId) return false;
        return true;
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <RoleBasedSidebar pathname="/admin" />
      </MemoryRouter>
    );

    // Branch-scoped routes should be visible now
    expect(screen.getByText('Cashier Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Nurse Dashboard')).toBeInTheDocument();

    // But WIP routes should still be hidden
    expect(screen.queryByText('Drug Inventory')).not.toBeInTheDocument();
    expect(screen.queryByText('Backup & Recovery')).not.toBeInTheDocument();
  });

  it('does not mark sibling leaf Overview active when on sibling sub-route (e.g., Overview is inactive on /settings/security)', () => {
    mockUseUser.mockReturnValue({
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
    });

    render(
      <MemoryRouter initialEntries={['/settings/security']}>
        <RoleBasedSidebar pathname="/settings/security" />
      </MemoryRouter>
    );

    const getNavItem = (element: HTMLElement | null) => element ? (element.closest('a') || element.closest('button')) : null;
    const overviewLinks = screen.getAllByText('Overview');

    // Find the Overview under Organization Settings (which has href='/settings')
    const overviewLink = overviewLinks.map(el => getNavItem(el)).find(parent => parent?.getAttribute('href') === '/settings');

    const securityLinks = screen.getAllByText('Security');
    const securityLink = securityLinks.map(el => getNavItem(el)).find(parent => parent?.getAttribute('href') === '/settings/security');

    expect(securityLink).toHaveClass('bg-gradient-to-r'); // exact matched child should be active
    expect(overviewLink).not.toHaveClass('bg-gradient-to-r'); // Overview sibling should NOT be active!
  });

  it('shows the "Catalog" inventory entry for Branch Admin (has INVENTORY_VIEW)', () => {
    const user = {
      id: 'ba-1',
      email: 'branch-admin@hospital.com',
      roles: ['Branch Admin'],
      branchId: 'branch-1',
    };
    mockUseUser.mockReturnValue(user);
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: false,
      canAccess: (opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
        if (opts.permission === 'inventory.item.view') return true;
        return false;
      },
    });

    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <RoleBasedSidebar pathname="/inventory" />
      </MemoryRouter>
    );

    expect(screen.getByText('Catalog')).toBeInTheDocument();
  });

  it('does not show the "Catalog" inventory entry for Doctor (no INVENTORY_VIEW)', () => {
    const user = {
      id: 'doc-1',
      email: 'doctor@hospital.com',
      roles: ['Doctor'],
      branchId: 'branch-1',
    };
    mockUseUser.mockReturnValue(user);
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: false,
      canAccess: (opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
        if (opts.permission === 'inventory.item.view') return false;
        if (opts.allowedRoles?.includes('Doctor')) return true;
        return false;
      },
    });

    render(
      <MemoryRouter initialEntries={['/doctor']}>
        <RoleBasedSidebar pathname="/doctor" />
      </MemoryRouter>
    );

    // Doctor should see "Patient Queue" (has allowedRoles ['Doctor']) but NOT "Catalog" (no inventory.item.view)
    expect(screen.getByText('Patient Queue')).toBeInTheDocument();
    expect(screen.queryByText('Catalog')).not.toBeInTheDocument();
  });
});
