import React from 'react';
import { useAuth, usePermissions, useUser } from '../hooks/use-user';
import { UnauthorizedState } from '../components/feedback/UnauthorizedState';
import { GuardMode } from './types';

interface PermissionRouteProps {
  /** Single permission to check */
  permission?: string;
  /** Array of permissions to check */
  permissions?: string[];
  /**
   * Evaluation mode for `permissions` array.
   * ANY: User must have at least one.
   * ALL: User must have all.
   * Default: ANY
   */
  mode?: GuardMode;
  /** Array of roles. If provided, user must have at least one of these roles. */
  allowedRoles?: string[];
  /**
   * If true, the route is scoped to a single branch (e.g. clinical, cashier, nurse).
   * Super Admin will NOT bypass this guard even though they are a global role.
   * Default: false (route is global governance / cross-branch).
   */
  isBranchScoped?: boolean;
  children: React.ReactNode;
}

/**
 * Route-level authorization guard component.
 *
 * BEHAVIOR:
 * 0. Super Admin is a global governance role. For non-branch-scoped routes
 *    (global / admin / marketplace-admin / it / compliance / procurement oversight),
 *    Super Admin is allowed through without matching the role/permission lists.
 *    Branch-scoped clinical/operational routes still require the explicit role/permission.
 * 1. If `allowedRoles` is provided, it is checked first. If the user lacks the role, access is denied.
 * 2. If `permission` is provided, it is checked.
 * 3. If `permissions` array is provided, it is evaluated based on `mode`.
 * 4. ALL conditions provided must be met (e.g. if both roles and permissions are provided, user needs the role AND the permissions).
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  permission,
  permissions,
  mode = GuardMode.ANY,
  allowedRoles,
  isBranchScoped = false,
  children
}) => {
  const { isLoading } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const user = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // 0. Super Admin global-governance bypass (non-branch-scoped routes only).
  // When allowedRoles is specified, Super Admin must be explicitly listed in the route config
  // to be granted access via role. If only a permission is specified, Super Admin
  // gets governance oversight access by default for non-branch-scoped zones.
  if (isSuperAdmin && !isBranchScoped) {
    if (!allowedRoles || allowedRoles.length === 0) {
      // No role restriction — governance oversight access granted for permission-based routes
      return <>{children}</>;
    }
    // If allowedRoles is present, Super Admin will be checked in the standard role check below.
  }

  // 1. Role check (ANY)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));
    if (!hasRole) return <UnauthorizedState />;
  }

  // 2. Single permission check
  if (permission && !hasPermission(permission)) {
    return <UnauthorizedState />;
  }

  // 3. Permissions array check
  if (permissions && permissions.length > 0) {
    if (mode === GuardMode.ALL) {
      const hasAll = permissions.every(p => hasPermission(p));
      if (!hasAll) return <UnauthorizedState />;
    } else {
      const hasAny = permissions.some(p => hasPermission(p));
      if (!hasAny) return <UnauthorizedState />;
    }
  }

  return <>{children}</>;
};

export default PermissionRoute;
