import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { SessionExpiredState } from '../components/feedback/SessionExpiredState';
import { useAuth } from '../hooks/use-user';

const isSessionExpiredError = (error: unknown) => {
  const err = error as { response?: { status?: number } } | null;
  return err?.response?.status === 401;
};

export const ProtectedRoute = () => {
  const { user, isLoading, authError } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    if (isSessionExpiredError(authError)) {
      return <SessionExpiredState />;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
