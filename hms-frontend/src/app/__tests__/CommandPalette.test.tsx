import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from '../CommandPalette';

const mockUseAuth = vi.fn();
const mockUsePermissions = vi.fn();
const mockUseUser = vi.fn();

vi.mock('../../hooks/use-user', () => ({
  useAuth: () => mockUseAuth(),
  usePermissions: () => mockUsePermissions(),
  useUser: () => mockUseUser(),
}));

describe('CommandPalette — Search and Demo Filtering', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isLoading: false, logout: vi.fn() });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
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
        <CommandPalette isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByPlaceholderText('Type a portal name or command...')).not.toBeInTheDocument();
  });

  it('renders input and instruction footer when open', () => {
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

    expect(screen.getByPlaceholderText('Type a portal name or command...')).toBeInTheDocument();
    expect(screen.getByText(/navigate/)).toBeInTheDocument();
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

    // 1. WIP / demo-hidden routes should NOT appear (check by destination path):
    // Department Manager (branch one: /branch-admin/departments)
    expect(screen.queryByText('/branch-admin/departments')).not.toBeInTheDocument();
    // Drug Inventory (/pharmacy/inventory)
    expect(screen.queryByText('/pharmacy/inventory')).not.toBeInTheDocument();
    // Clinical Ops (Ops Dashboard: /clinical/ops)
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

    // 3. Allowed demo-ready routes SHOULD appear:
    expect(screen.getByText('SuperAdmin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tenants Manager')).toBeInTheDocument();
    expect(screen.getByText('Branches Manager')).toBeInTheDocument();
    expect(screen.getByText('Users & Accounts')).toBeInTheDocument();
    expect(screen.getByText('Roles & Permissions')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument(); // Marketplace Admin Dashboard
    expect(screen.getByText('Branch Dashboard')).toBeInTheDocument();
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
