import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { AuthContext, type UserState } from '../hooks/use-user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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
