/* eslint-disable react-refresh/only-export-components -- Co-locating context and hooks is acceptable for this prototype */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';

interface UserState {
  id: string;
  email: string;
  tenantId: string;
  branchId?: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
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

  return { hasRole, hasPermission, isSuperAdmin, isBranchAdmin };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch {
      console.error('Failed to parse user from localStorage');
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.assign('/login');
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await apiClient.get('/v1/auth/me');
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch user', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUser();
    } else {
      setIsLoading(false);
    }

    // Set up interceptor for 401s
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => apiClient.interceptors.response.eject(interceptor);
  }, [logout, fetchUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
