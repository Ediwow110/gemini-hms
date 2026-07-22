import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RoleBasedSidebar } from '../RoleBasedSidebar';

const mockUsePermissions = vi.fn();
const mockUseUser = vi.fn();

vi.mock('../../hooks/use-user', () => ({
  usePermissions: () => mockUsePermissions(),
  useUser: () => mockUseUser(),
}));

describe('RoleBasedSidebar — Navigation Active States', () => {
  beforeEach(() => {
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
        return ['patient.view', 'queue.view', 'encounter.view', 'lab.result.view', 'doctor.prescription.view', 'order.view'].includes(opts.permission || '');
      },
    });

    render(
      <MemoryRouter initialEntries={['/doctor']}>
        <RoleBasedSidebar pathname="/doctor" />
      </MemoryRouter>
    );

    // Doctor should see the permission-backed queue but NOT inventory catalog access.
    expect(screen.getAllByText('Patient Queue').length).toBeGreaterThan(0);
    expect(screen.queryByText('Catalog')).not.toBeInTheDocument();
  });

  it('shows the "Stock Receiving" inventory entry for Branch Admin (has INVENTORY_RECEIVE)', () => {
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
        if (opts.permission === 'inventory.stock.receive') return true;
        return false;
      },
    });

    render(
      <MemoryRouter initialEntries={['/inventory/receiving']}>
        <RoleBasedSidebar pathname="/inventory/receiving" />
      </MemoryRouter>
    );

    expect(screen.getByText('Stock Receiving')).toBeInTheDocument();
  });

  it('auto-expanded parent collapses via aria-expanded when navigating to unrelated route', () => {
    mockUseUser.mockReturnValue({
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/settings/security']}>
        <RoleBasedSidebar pathname="/settings/security" />
      </MemoryRouter>
    );

    // On child route — Organization Settings parent button is expanded
    const orgBtns = screen.getAllByRole('button', { name: /Organization Settings/ });
    expect(orgBtns[0]).toHaveAttribute('aria-expanded', 'true');

    // Re-render with /admin pathname (same MemoryRouter, preserve state)
    rerender(
      <MemoryRouter initialEntries={['/settings/security']}>
        <RoleBasedSidebar pathname="/admin" />
      </MemoryRouter>
    );

    // Parent should no longer be expanded
    const orgBtns2 = screen.getAllByRole('button', { name: /Organization Settings/ });
    expect(orgBtns2[0]).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicking an active auto-expanded parent toggles it closed and open', async () => {
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

    // On child route — Organization Settings parent button is initially expanded
    const orgBtns = screen.getAllByRole('button', { name: /Organization Settings/ });
    expect(orgBtns[0]).toHaveAttribute('aria-expanded', 'true');

    // Click active parent button — should collapse it!
    fireEvent.click(orgBtns[0]);

    await waitFor(() => {
      const collapsedBtns = screen.getAllByRole('button', { name: /Organization Settings/ });
      expect(collapsedBtns[0]).toHaveAttribute('aria-expanded', 'false');
    });

    // Click active parent button again — should expand it back!
    const collapsedBtns = screen.getAllByRole('button', { name: /Organization Settings/ });
    fireEvent.click(collapsedBtns[0]);

    await waitFor(() => {
      const reexpandedBtns = screen.getAllByRole('button', { name: /Organization Settings/ });
      expect(reexpandedBtns[0]).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('duplicate /settings entries (Organization Settings + Branch Settings) have independent expansion state', async () => {
    mockUseUser.mockReturnValue({
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <RoleBasedSidebar pathname="/admin" />
      </MemoryRouter>
    );

    // Both labels should be rendered
    expect(screen.getByText('Organization Settings')).toBeInTheDocument();
    expect(screen.getByText('Branch Settings')).toBeInTheDocument();

    // Neither is expanded initially (not on /settings route)
    let orgBtns = screen.getAllByRole('button', { name: /Organization Settings/ });
    let branchBtns = screen.getAllByRole('button', { name: /Branch Settings/ });
    expect(orgBtns[0]).toHaveAttribute('aria-expanded', 'false');
    expect(branchBtns[0]).toHaveAttribute('aria-expanded', 'false');

    // Manually expand Organization Settings
    orgBtns[0].click();

    // Re-query after state update
    await waitFor(() => {
      const updatedOrgBtns = screen.getAllByRole('button', { name: /Organization Settings/ });
      expect(updatedOrgBtns[0]).toHaveAttribute('aria-expanded', 'true');
    });

    // Branch Settings should remain collapsed (independent state)
    branchBtns = screen.getAllByRole('button', { name: /Branch Settings/ });
    expect(branchBtns[0]).toHaveAttribute('aria-expanded', 'false');

    // Collapse Organization Settings again
    orgBtns = screen.getAllByRole('button', { name: /Organization Settings/ });
    orgBtns[0].click();

    await waitFor(() => {
      const collapsedOrgBtns = screen.getAllByRole('button', { name: /Organization Settings/ });
      expect(collapsedOrgBtns[0]).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('duplicate /settings entries both auto-expand when on a shared child route', () => {
    mockUseUser.mockReturnValue({
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
    });

    render(
      <MemoryRouter initialEntries={['/settings/branches']}>
        <RoleBasedSidebar pathname="/settings/branches" />
      </MemoryRouter>
    );

    // Both parents auto-expand because both have children at /settings/branches
    const orgBtns = screen.getAllByRole('button', { name: /Organization Settings/ });
    const branchBtns = screen.getAllByRole('button', { name: /Branch Settings/ });
    expect(orgBtns[0]).toHaveAttribute('aria-expanded', 'true');
    expect(branchBtns[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not show the "Stock Receiving" inventory entry for Pharmacist (no INVENTORY_RECEIVE)', () => {
    const user = {
      id: 'ph-1',
      email: 'pharmacist@hospital.com',
      roles: ['Pharmacist'],
      branchId: 'branch-1',
    };
    mockUseUser.mockReturnValue(user);
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: false,
      canAccess: (opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
        if (opts.permission === 'inventory.item.view') return true;
        if (opts.permission === 'inventory.stock.receive') return false;
        return false;
      },
    });

    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <RoleBasedSidebar pathname="/inventory" />
      </MemoryRouter>
    );

    // Pharmacist should see "Catalog" (has inventory.item.view) but NOT "Stock Receiving" (no inventory.stock.receive)
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.queryByText('Stock Receiving')).not.toBeInTheDocument();
  });

  it('sidebar profile card does NOT trigger logout on click (regression)', () => {
    // Regression guard: the sidebar user-profile card must be display-only.
    // Sign-out is handled exclusively by the AppShell topbar's explicit
    // "Sign out" button with a 2-step confirmation bar.
    mockUseUser.mockReturnValue({
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <RoleBasedSidebar pathname="/admin" />
      </MemoryRouter>
    );

    // The profile card exists and is NOT a button or link
    const profileCard = screen.getByTestId('sidebar-user-card');
    expect(profileCard).toBeInTheDocument();
    expect(profileCard.tagName).not.toBe('BUTTON');
    expect(profileCard.tagName).not.toBe('A');

    // Clicking the card must not navigate or trigger any action
    fireEvent.click(profileCard);
    // The card should still be present (no navigation/unmount)
    expect(screen.getByTestId('sidebar-user-card')).toBeInTheDocument();
  });
});
