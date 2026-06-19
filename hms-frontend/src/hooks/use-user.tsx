// @refresh reset
/* eslint-disable react-refresh/only-export-components -- Co-locating context and hooks is acceptable for this prototype */
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode, useMemo } from 'react';
import { apiClient } from '../lib/api';

export interface UserState {
  id: string;
  email: string;
  tenantId: string;
  branchId?: string;
  roles: string[];
  permissions: string[];
  defaultPortalPath?: string;
}

export interface AuthContextType {
  user: UserState | null;
  isLoading: boolean;
  authError?: unknown;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({ 
  user: null,
  isLoading: true,
  authError: null,
  logout: () => {},
  refetchUser: async () => {},
});

export const useUser = () => {
  const context = useContext(AuthContext);
  return context.user;
};

export const useAuth = () => useContext(AuthContext);

export const usePermissions = () => {
  const user = useUser();
  const permissions = useMemo(() => {
    if (!user) return [];
    return user.permissions || [];
  }, [user]);
  
  // Real granular permission check
  const hasPermission = useCallback((permission: string) => permissions.includes(permission), [permissions]);
  const hasRole = useCallback((role: string) => user?.roles.includes(role) || false, [user?.roles]);
  const isSuperAdmin = useMemo(() => user?.roles.includes('Super Admin') || false, [user?.roles]);
  const isBranchAdmin = useMemo(() => user?.roles.includes('Branch Admin') || false, [user?.roles]);
  const isStaff = useCallback(() => !!(user && !user.roles.includes('Patient') && !user.roles.includes('Customer')), [user]);

  const canAccess = useCallback((opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
    if (opts.zone === 'public') {
      return true;
    }

    // 0. Super Admin global-governance bypass (non-branch-scoped routes only)
    if (isSuperAdmin && !opts.isBranchScoped) {
      if (!opts.allowedRoles || opts.allowedRoles.length === 0) {
        return true;
      }
    }

    // 1. Role check (ANY)
    if (opts.allowedRoles && opts.allowedRoles.length > 0) {
      const hasAnyRole = opts.allowedRoles.some(r => hasRole(r));
      if (!hasAnyRole) return false;
    }

    // 2. Permission check
    if (opts.permission && !hasPermission(opts.permission)) {
      return false;
    }

    return true;
  }, [isSuperAdmin, hasPermission, hasRole]);

  return { hasRole, hasPermission, isSuperAdmin, isBranchAdmin, isStaff, canAccess };
};

const PUBLIC_AUTH_PATHS = new Set(['/login']);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<unknown>(null);
  const lastDiagnosticKeyRef = useRef<string | null>(null);

  const logDiagnostics = (phase: string, error: unknown) => {
    if (import.meta.env.DEV) {
      const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const diagnosticKey = [
        phase,
        err?.response?.status ?? 'network',
        err?.response?.data?.message || err?.message || 'unknown',
        window.location.pathname,
      ].join(':');

      // Avoid flooding the Vite terminal with the same auth bootstrap failure repeatedly.
      if (lastDiagnosticKeyRef.current === diagnosticKey) {
        return;
      }
      lastDiagnosticKeyRef.current = diagnosticKey;

      console.warn("[Auth Diagnostics]", {
        phase,
        endpoint: "/v1/auth/me",
        status: err?.response?.status,
        message: err?.response?.data?.message || err?.message,
        apiBaseUrl: apiClient.defaults.baseURL,
        hasAccessCookie: document.cookie.includes('access_token'),
        timestamp: new Date().toISOString()
      });
    }
  };

  const logout = useCallback(() => {
    apiClient.post('/v1/auth/logout').catch(() => {});
    setUser(null);
    window.location.assign('/login');
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await apiClient.get('/v1/auth/me');
      setUser(response.data);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setAuthError(error);
      logDiagnostics('refetch', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    if (PUBLIC_AUTH_PATHS.has(window.location.pathname)) {
      setUser(null);
      setAuthError(null);
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    const bootstrapAuth = async () => {
      try {
        const response = await apiClient.get('/v1/auth/me');
        if (mounted) {
          setUser(response.data);
          setAuthError(null);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setAuthError(error);
          logDiagnostics('bootstrap', error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrapAuth();

    // Set up interceptor for 401s
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const requestUrl = error.config?.url as string | undefined;

        if (error.response?.status === 401) {
          if (mounted) {
            setUser(null);
            setAuthError(error);
            // Avoid infinite loop if already null
          }
        } else if (!requestUrl?.includes('/v1/auth/me') && error.response?.status !== 200) {
          logDiagnostics('interceptor', error);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      mounted = false;
      apiClient.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, authError, logout, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
