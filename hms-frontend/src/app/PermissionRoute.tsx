import React from 'react';
import { useAuth, usePermissions, useUser } from '../hooks/use-user';
import { UnauthorizedState } from '../components/feedback/UnauthorizedState';

export enum GuardMode {
  ANY = 'any',
  ALL = 'all',
}

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
  children: React.ReactNode;
}

/**
 * Route-level authorization guard component.
 * 
 * BEHAVIOR:
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
  children 
}) => {
  const { isLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const user = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
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
