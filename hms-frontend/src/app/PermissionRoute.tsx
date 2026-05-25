import React from 'react';
import { useAuth, usePermissions } from '../hooks/use-user';
import { UnauthorizedState } from '../components/feedback/UnauthorizedState';

interface PermissionRouteProps {
  permission: string;
  children: React.ReactNode;
}

/**
 * Route-level permission guard component.
 * Verifies that the user has the required permission before rendering the protected children.
 * If the permission check fails, it displays the standard UnauthorizedState screen.
 * 
 * NOTE: This is a frontend-only route guard to provide clean user experience.
 * Real permission enforcement is handled on the backend API layer.
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({ permission, children }) => {
  const { isLoading } = useAuth();
  const { hasPermission } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <UnauthorizedState />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
