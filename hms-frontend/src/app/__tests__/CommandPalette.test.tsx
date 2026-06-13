import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from '../CommandPalette';
import { useUser, usePermissions } from '../../hooks/use-user';

// Mock the hooks
vi.mock('../../hooks/use-user', () => ({
  useUser: vi.fn(),
  usePermissions: vi.fn(),
}));

const mockUseUser = useUser as jest.Mock;
const mockUsePermissions = usePermissions as jest.Mock;

describe('CommandPalette — Search and Demo Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides WIP, demo-hidden, and branch-scoped operational routes for Super Admin with Branch None', () => {
    const user = {
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      branchId: null, // Branch None
    };
    mockUseUser.mockReturnValue(user);
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: true,
      canAccess: (opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
        if (opts.zone === 'public') return true;
        if (opts.zone === 'staff') {
          if (opts.isBranchScoped && !user.branchId) return false;
          return true;
        }
        return true;
      },
    });

    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Type a portal name or command...')).toBeInTheDocument();

    // 1. WIP / Coming Soon routes should NOT appear:
    // Global Settings (isHiddenForDemo: true)
    expect(screen.queryByText('/it/backup-restore')).not.toBeInTheDocument();
    // Clinical Ops (isHiddenForDemo: true)
    expect(screen.queryByText('/clinical/ops')).not.toBeInTheDocument();
    // Integrations (/integration)
    expect(screen.queryByText('/integration')).not.toBeInTheDocument();
    // Patient Merges (/admin/patient-merges)
    expect(screen.queryByText('/admin/patient-merges')).not.toBeInTheDocument();
    // LIS Orders / Lab Orders (/lab/orders)
    expect(screen.queryByText('/lab/orders')).not.toBeInTheDocument();

    // 2. Branch-scoped operational routes should NOT appear when branchId is missing:
    // Cashier Dashboard (/cashier)
    expect(screen.queryByText('/cashier')).not.toBeInTheDocument();
    // Branch Dashboard (/branch-admin)
    expect(screen.queryByText('/branch-admin')).not.toBeInTheDocument();

    // 3. Allowed demo-ready routes SHOULD appear:
    expect(screen.getByText('SuperAdmin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Executive View')).toBeInTheDocument();
    expect(screen.getByText('Tenants Manager')).toBeInTheDocument();
    expect(screen.getByText('Branches Manager')).toBeInTheDocument();
    expect(screen.getByText('Users & Accounts')).toBeInTheDocument();
    expect(screen.getByText('Roles & Permissions')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument(); // Marketplace Admin Dashboard
    expect(screen.getByText('Organization Settings')).toBeInTheDocument();
    expect(screen.getByText('Audit Log Review')).toBeInTheDocument();
    expect(screen.getByText('PHI Access Monitor')).toBeInTheDocument();
  });

  it('shows branch-scoped operational routes for Super Admin when branch is selected', () => {
    const user = {
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      branchId: 'branch-123', // Branch selected
    };
    mockUseUser.mockReturnValue(user);
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: true,
      canAccess: (opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
        if (opts.zone === 'public') return true;
        if (opts.zone === 'staff') {
          if (opts.isBranchScoped && !user.branchId) return false;
          return true;
        }
        return true;
      },
    });

    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    // Branch-scoped operational routes SHOULD appear (since branchId is set)
    expect(screen.getByText('Cashier Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Nurse Dashboard')).toBeInTheDocument();

    // But WIP / demo-hidden routes should STILL be hidden
    expect(screen.queryByText('/branch-admin/departments')).not.toBeInTheDocument();
    expect(screen.queryByText('/pharmacy/inventory')).not.toBeInTheDocument();
  });

  it('filters results based on query input', () => {
    mockUseUser.mockReturnValue({
      id: 'sa-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      branchId: null,
    });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: true,
      canAccess: () => true,
    });

    render(
      <MemoryRouter>
        <CommandPalette isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Type a portal name or command...');
    
    // Type "Tenant"
    fireEvent.change(input, { target: { value: 'Tenant' } });

    // Tenants Manager should remain
    expect(screen.getByText('Tenants Manager')).toBeInTheDocument();
    // SuperAdmin Dashboard should be filtered out
    expect(screen.queryByText('SuperAdmin Dashboard')).not.toBeInTheDocument();
  });
});
