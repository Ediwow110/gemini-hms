import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-user';
import { getSafePortalPath } from './role-portal-resolver';

export const RoleRedirect = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Get safe portal path
  const destination = getSafePortalPath(
    user.defaultPortalPath,
    user.roles,
    user.permissions,
  );
  
  // If we ended up computing '/' from something else or there is a loop logic bug, 
  // ensure we don't return '/' to create a render loop since RoleRedirect is mounted at '/'
  if (destination === '/') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Navigate to={destination} replace />;
};
