import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';

interface UserState {
  id: string;
  email: string;
  tenantId: string;
  branchId?: string;
  roles: string[];
}

interface AuthContextType {
  user: UserState | null;
  isLoading: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({ 
  user: null,
  isLoading: true,
  logout: () => {},
});

export const useUser = () => {
  const context = useContext(AuthContext);
  return context.user;
};

export const useAuth = () => useContext(AuthContext);

export const usePermissions = () => {
  const user = useUser();
  const roles = user?.roles || [];
  
  // In a real app, permissions would be in the token or fetched
  // For this prototype, we derive some from roles for UI visibility
  const hasRole = (role: string) => roles.includes(role);
  const isSuperAdmin = roles.includes('Super Admin');
  const isBranchAdmin = roles.includes('Branch Admin');

  return { hasRole, isSuperAdmin, isBranchAdmin };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.assign('/login');
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage');
        logout();
      }
    }
    setIsLoading(false);

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
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
