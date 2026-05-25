import React from 'react';
import { useAuth, usePermissions, useUser } from '../hooks/use-user';
import { UnauthorizedState } from '../components/feedback/UnauthorizedState';

interface PermissionRouteProps {
  permission?: string;
  allPermissions?: string[];
  allowedRoles?: string[];
  children: React.ReactNode;
}

/**
 * Route-level permission and role guard component.
 * Verifies that the user has the required permission(s) or role(s) before rendering the protected children.
 * If the check fails, it displays the standard UnauthorizedState screen.
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({ 
  permission, 
  allPermissions,
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

  // Role check if provided
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));
    if (!hasRole) return <UnauthorizedState />;
  }

  // Single permission check if provided
  if (permission && !hasPermission(permission)) {
    return <UnauthorizedState />;
  }

  // Multiple permission check if provided
  if (allPermissions && allPermissions.length > 0) {
    const hasAll = allPermissions.every(p => hasPermission(p));
    if (!hasAll) return <UnauthorizedState />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
