import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth, usePermissions, useUser } from '../hooks/use-user';
import { UnauthorizedState } from '../components/feedback/UnauthorizedState';
import { getPortalRouteConfig } from '../config/portalRoutes';
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
 * Route-level authorization guard. The canonical portal route catalog overrides
 * duplicated route metadata from App.tsx, while explicit props remain the fallback
 * for isolated components and unregistered unit-test paths.
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
  const { hasPermission } = usePermissions();
  const user = useUser();
  const location = useLocation();
  const routeConfig = getPortalRouteConfig(location.pathname);

  const effectivePermission = routeConfig
    ? routeConfig.requiredPermission
    : permission;
  const effectiveAllowedRoles = routeConfig
    ? routeConfig.allowedRoles
    : allowedRoles;
  const effectiveBranchScoped = routeConfig
    ? Boolean(routeConfig.isBranchScoped)
    : isBranchScoped;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (effectiveBranchScoped && !user?.branchId) {
    return <UnauthorizedState />;
  }

  if (effectiveAllowedRoles && effectiveAllowedRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRole = effectiveAllowedRoles.some((role) => userRoles.includes(role));
    if (!hasRole) return <UnauthorizedState />;
  }

  if (effectivePermission && !hasPermission(effectivePermission)) {
    return <UnauthorizedState />;
  }

  // Explicit multi-permission guards remain additive defense in depth.
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
