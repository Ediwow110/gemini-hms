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

const renderGuard = (ui: React.ReactNode, path = '/unit-test') =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

const protectedContent = <div data-testid="protected-content">Protected</div>;

describe('PermissionRoute — canonical fail-closed authorization', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isLoading: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not give Super Admin an implicit permission bypass', () => {
    mockUseUser.mockReturnValue({
      id: 'admin-1',
      roles: ['Super Admin'],
      permissions: [],
    });
    mockUsePermissions.mockReturnValue({ hasPermission: () => false });

    renderGuard(
      <PermissionRoute permission="marketplace.admin.manage">
        {protectedContent}
      </PermissionRoute>,
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restriction Active')).toBeInTheDocument();
  });

  it('allows an explicit role and permission match', () => {
    mockUseUser.mockReturnValue({
      id: 'marketplace-admin-1',
      roles: ['Marketplace Admin'],
      permissions: ['marketplace.admin.manage'],
    });
    mockUsePermissions.mockReturnValue({
      hasPermission: (permission: string) => permission === 'marketplace.admin.manage',
    });

    renderGuard(
      <PermissionRoute
        allowedRoles={['Marketplace Admin']}
        permission="marketplace.admin.manage"
      >
        {protectedContent}
      </PermissionRoute>,
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('uses the canonical patient-zone policy and denies Super Admin direct access', () => {
    mockUseUser.mockReturnValue({
      id: 'admin-1',
      roles: ['Super Admin'],
      permissions: ['patient.portal.view_own'],
    });
    mockUsePermissions.mockReturnValue({ hasPermission: () => true });

    renderGuard(
      <PermissionRoute permission="patient.portal.view_own">
        {protectedContent}
      </PermissionRoute>,
      '/patient',
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('allows explicit Super Admin field-service oversight with branch context and grant', () => {
    mockUseUser.mockReturnValue({
      id: 'admin-1',
      branchId: 'branch-1',
      roles: ['Super Admin'],
      permissions: ['field_service.job.view'],
    });
    mockUsePermissions.mockReturnValue({
      hasPermission: (permission: string) => permission === 'field_service.job.view',
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Field Technician']}>
        {protectedContent}
      </PermissionRoute>,
      '/field-service/deliveries',
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('denies branch-scoped field-service access when no branch is selected', () => {
    mockUseUser.mockReturnValue({
      id: 'admin-1',
      roles: ['Super Admin'],
      permissions: ['field_service.job.view'],
    });
    mockUsePermissions.mockReturnValue({ hasPermission: () => true });

    renderGuard(
      <PermissionRoute allowedRoles={['Field Technician']}>
        {protectedContent}
      </PermissionRoute>,
      '/field-service/deliveries',
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('allows the operational Field Technician route with matching branch and permission', () => {
    mockUseUser.mockReturnValue({
      id: 'tech-1',
      branchId: 'branch-1',
      roles: ['Field Technician'],
      permissions: ['field_service.job.view'],
    });
    mockUsePermissions.mockReturnValue({
      hasPermission: (permission: string) => permission === 'field_service.job.view',
    });

    renderGuard(
      <PermissionRoute permission="field_service.manage">
        {protectedContent}
      </PermissionRoute>,
      '/field-service/deliveries',
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('allows a custom operational role through permission-first field-service access', () => {
    mockUseUser.mockReturnValue({
      id: 'coordinator-1',
      branchId: 'branch-1',
      roles: ['Delivery Coordinator'],
      permissions: ['field_service.job.view', 'field_service.job.assign'],
    });
    mockUsePermissions.mockReturnValue({
      hasPermission: (permission: string) =>
        ['field_service.job.view', 'field_service.job.assign'].includes(permission),
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Field Technician']}>
        {protectedContent}
      </PermissionRoute>,
      '/field-service',
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('uses the canonical cashier-closing roles instead of the stale Cashier-only wrapper', () => {
    mockUseUser.mockReturnValue({
      id: 'branch-admin-1',
      branchId: 'branch-1',
      roles: ['Branch Admin'],
      permissions: ['billing.invoice.view'],
    });
    mockUsePermissions.mockReturnValue({
      hasPermission: (permission: string) => permission === 'billing.invoice.view',
    });

    renderGuard(
      <PermissionRoute allowedRoles={['Cashier']}>
        {protectedContent}
      </PermissionRoute>,
      '/billing/cashier-closing',
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
