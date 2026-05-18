import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserContextData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TenantState {
  activeTenantId: string | null;
  currentUser: UserContextData | null;
  isAuthenticated: boolean;
}

export interface TenantContextType extends TenantState {
  setTenantState: React.Dispatch<React.SetStateAction<TenantState>>;
  logout: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TenantState>({
    activeTenantId: null,
    currentUser: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Token lifecycle listener targeting the browser execution perimeter
    try {
      const storedToken = localStorage.getItem('hms_auth_token');
      if (storedToken) {
        const decoded = JSON.parse(storedToken) as UserContextData & { tenantId: string };
        
        // Explicit payload structural check
        if (!decoded.tenantId || !decoded.role) {
          throw new Error('CORRUPTED_PAYLOAD: Missing strict mapping parameters.');
        }

        setState({
          activeTenantId: decoded.tenantId,
          currentUser: {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role
          },
          isAuthenticated: true
        });
      } else {
        setState({ activeTenantId: null, currentUser: null, isAuthenticated: false });
      }
    } catch (e) {
      // Structural anomaly detected: Force unconditional fail-closed logout sequence
      setState({ activeTenantId: null, currentUser: null, isAuthenticated: false });
      localStorage.removeItem('hms_auth_token');
    }
  }, []);

  const logout = () => {
    setState({
      activeTenantId: null,
      currentUser: null,
      isAuthenticated: false
    });
    // Explicitly wipe the execution memory caches
    localStorage.removeItem('hms_auth_token');
  };

  return (
    <TenantContext.Provider value={{ ...state, setTenantState: setState, logout }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('CRITICAL_DOM_FAILURE: useTenantContext accessed outside of TenantProvider boundaries.');
  }
  return context;
};
