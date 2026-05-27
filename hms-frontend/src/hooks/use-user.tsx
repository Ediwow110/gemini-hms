// @refresh reset
/* eslint-disable react-refresh/only-export-components -- Co-locating context and hooks is acceptable for this prototype */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from '../lib/api';

export interface UserState {
  id: string;
  email: string;
  tenantId: string;
  branchId?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthContextType {
  user: UserState | null;
  isLoading: boolean;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({ 
  user: null,
  isLoading: true,
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
  const permissions = user?.permissions || [];
  
  // Real granular permission check
  const hasPermission = (permission: string) => permissions.includes(permission);
  const hasRole = (role: string) => user?.roles.includes(role) || false;
  const isSuperAdmin = hasRole('Super Admin');
  const isBranchAdmin = hasRole('Branch Admin');
  const isStaff = () => !!(user && !user.roles.includes('Patient') && !user.roles.includes('Customer'));

  const canAccess = (opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
    if (opts.zone === 'public') {
      return true;
    }

    if (isSuperAdmin) {
      if (opts.zone === 'staff') {
        return true;
      }
    }

    if (opts.permission && hasPermission(opts.permission)) return true;
    if (opts.allowedRoles && opts.allowedRoles.some(r => hasRole(r))) return true;
    if (!opts.allowedRoles && !opts.permission) return true;
    return false;
  };

  return { hasRole, hasPermission, isSuperAdmin, isBranchAdmin, isStaff, canAccess };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    apiClient.post('/v1/auth/logout').catch(() => {});
    setUser(null);
    window.location.assign('/login');
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await apiClient.get('/v1/auth/me');
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      try {
        const response = await apiClient.get('/v1/auth/me');
        if (mounted) {
          setUser(response.data);
        }
      } catch {
        if (mounted) {
          setUser(null);
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
        if (error.response?.status === 401) {
          if (mounted) {
            setUser(null);
          }
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
    <AuthContext.Provider value={{ user, isLoading, logout, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
