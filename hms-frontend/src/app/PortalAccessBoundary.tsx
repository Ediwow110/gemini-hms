import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { UnauthorizedState } from '../components/feedback/UnauthorizedState';
import { getPortalRouteConfig } from '../config/portalRoutes';
import { usePermissions } from '../hooks/use-user';

interface PortalAccessBoundaryProps {
  children: ReactNode;
}

/**
 * Fail-closed application-shell boundary backed by the canonical portal route catalog.
 * Individual PermissionRoute wrappers remain defense in depth, but navigation and direct
 * URL entry now share the same branch, role, and permission policy.
 */
export const PortalAccessBoundary = ({ children }: PortalAccessBoundaryProps) => {
  const location = useLocation();
  const { canAccess } = usePermissions();
  const route = getPortalRouteConfig(location.pathname);

  if (!route) {
    return <UnauthorizedState />;
  }

  const allowed = canAccess({
    permission: route.requiredPermission,
    allowedRoles: route.allowedRoles,
    isBranchScoped: route.isBranchScoped,
    zone: route.zone,
  });

  return allowed ? <>{children}</> : <UnauthorizedState />;
};

export default PortalAccessBoundary;
