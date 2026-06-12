import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PermissionRoute } from '../PermissionRoute';

const mockUseAuth = vi.fn();
const mockUsePermissions = vi.fn();
const mockUseUser = vi.fn();

vi.mock('../../hooks/use-user', () => ({
  useAuth: () => mockUseAuth(),
  usePermissions: () => mockUsePermissions(),
  useUser: () => mockUseUser(),
}));

const renderGuard = (ui: React.ReactNode) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('PermissionRoute — Super Admin global governance bypass', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isLoading: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('denies Super Admin when allowedRoles is specified and does not include Super Admin', () => {
    mockUseUser.mockReturnValue({
      id: 'admin-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
    });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: true,
      hasPermission: () => false,
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Marketplace Admin']}>
        <div data-testid="protected-content">Marketplace Admin Dashboard</div>
      </PermissionRoute>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restriction Active')).toBeInTheDocument();
  });

  it('allows Super Admin through a permission-only global governance route', () => {
    mockUseUser.mockReturnValue({
      id: 'admin-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
    });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: true,
      hasPermission: () => false,
    });

    renderGuard(
      <PermissionRoute permission="marketplace.admin.manage">
        <div data-testid="protected-content">Supplier Management</div>
      </PermissionRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('denies a non-Super-Admin user on a global governance route when role/permission do not match', () => {
    mockUseUser.mockReturnValue({
      id: 'doc-1',
      email: 'doctor@hospital.com',
      roles: ['Doctor'],
      permissions: [],
    });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: false,
      hasPermission: () => false,
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Marketplace Admin']}>
        <div data-testid="protected-content">Marketplace Admin Dashboard</div>
      </PermissionRoute>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restriction Active')).toBeInTheDocument();
  });

  it('still requires explicit role/permission for branch-scoped clinical routes even for Super Admin', () => {
    mockUseUser.mockReturnValue({
      id: 'admin-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
    });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: true,
      hasPermission: () => false,
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Doctor']} isBranchScoped>
        <div data-testid="protected-content">Doctor Dashboard</div>
      </PermissionRoute>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restriction Active')).toBeInTheDocument();
  });

  it('allows a user with the correct role on a global governance route', () => {
    mockUseUser.mockReturnValue({
      id: 'mp-1',
      email: 'marketplace.admin@hospital.com',
      roles: ['Marketplace Admin'],
      permissions: ['marketplace.admin.manage'],
    });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: false,
      hasPermission: (p: string) => ['marketplace.admin.manage', 'marketplace.admin.view'].includes(p),
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Marketplace Admin']} permission="marketplace.admin.manage">
        <div data-testid="protected-content">Supplier Management</div>
      </PermissionRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('denies Super Admin from branch-admin routes when Super Admin is not in allowedRoles', () => {
    mockUseUser.mockReturnValue({
      id: 'admin-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
    });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: true,
      hasPermission: () => false,
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Branch Admin']}>
        <div data-testid="protected-content">Branch Admin Area</div>
      </PermissionRoute>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restriction Active')).toBeInTheDocument();
  });

  it('allows Branch Admin role through branch-admin routes even when isBranchScoped is false or omitted', () => {
    mockUseUser.mockReturnValue({
      id: 'ba-1',
      email: 'branch-admin@hospital.com',
      roles: ['Branch Admin'],
      permissions: [],
    });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: false,
      hasPermission: () => false,
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Branch Admin']}>
        <div data-testid="protected-content">Branch Admin Area</div>
      </PermissionRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('denies other staff roles (e.g. Doctor) through branch-admin routes when they do not have the required role', () => {
    mockUseUser.mockReturnValue({
      id: 'doc-1',
      email: 'doctor@hospital.com',
      roles: ['Doctor'],
      permissions: [],
    });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: false,
      hasPermission: () => false,
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Branch Admin']}>
        <div data-testid="protected-content">Branch Admin Area</div>
      </PermissionRoute>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restriction Active')).toBeInTheDocument();
  });

  it('still blocks Super Admin from branch-scoped routes when isBranchScoped is true', () => {
    mockUseUser.mockReturnValue({
      id: 'admin-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
    });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: true,
      hasPermission: () => false,
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Doctor']} isBranchScoped>
        <div data-testid="protected-content">Doctor Portal</div>
      </PermissionRoute>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restriction Active')).toBeInTheDocument();
  });

  it('preserves Super Admin access for marketplace-admin routes when explicitly included in allowedRoles', () => {
    mockUseUser.mockReturnValue({
      id: 'admin-1',
      email: 'admin@hospital.com',
      roles: ['Super Admin'],
      permissions: [],
    });
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: true,
      hasPermission: () => false,
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Super Admin', 'Marketplace Admin']}>
        <div data-testid="protected-content">Marketplace Admin</div>
      </PermissionRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
