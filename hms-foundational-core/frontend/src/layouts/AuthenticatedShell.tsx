import React, { useState } from 'react';
import { useTenantContext } from '../context/TenantContext';

interface AuthenticatedShellProps {
  children: React.ReactNode;
  activeRoute: string; // Dashboard, Patient Registry, Clinical Charting, Ancillary Operations, Cashier Console
}

export const AuthenticatedShell: React.FC<AuthenticatedShellProps> = ({ children, activeRoute }) => {
  const { activeTenantId, currentUser, isAuthenticated, logout } = useTenantContext();
  const [isOnline] = useState(true);

  // Crash-to-login safety behavior: Drop viewport instantly if parameters decay
  if (!isAuthenticated || !activeTenantId || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-[#DC2626] font-extrabold text-sm p-6 border border-[#DC2626] bg-red-50 rounded shadow-md tracking-wider">
          🚨 SECURE SESSION LOST. REDIRECTING TO ENCRYPTED GATEWAY...
        </div>
      </div>
    );
  }

  // Role-Based Routing Mesh Interceptor: f(R, P) = 1 (Allow) vs 0 (Drop)
  const isAuthorized = (role: string, route: string) => {
    // Explicit block mapping for financial operations
    if (route === 'Cashier Console') {
      return role === 'admin' || role === 'cashier';
    }
    // Universal access for general operations
    return true; 
  };

  if (!isAuthorized(currentUser.role, activeRoute)) {
    throw new Error(`UNAUTHORIZED_ROUTE_ACCESS: Role '${currentUser.role}' is explicitly blocked from accessing path '${activeRoute}'.`);
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* Left-Aligned Master Sidebar Rail */}
      <aside className="w-64 bg-[#0F172A] flex flex-col shadow-2xl z-20">
        <div className="p-5 border-b border-[#1E293B]">
          <h1 className="text-white font-bold text-lg tracking-wide uppercase">General Hospital</h1>
          <p className="text-[#3B82F6] text-xs font-semibold tracking-wider mt-1 font-mono uppercase">TENANT: {activeTenantId}</p>
        </div>
        
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <button className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeRoute === 'Dashboard' ? 'bg-[#1E293B] text-white border-l-4 border-[#2563EB]' : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'}`}>
                Workspace Console
              </button>
            </li>
            <li>
              <button className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeRoute === 'Patient Registry' ? 'bg-[#1E293B] text-white border-l-4 border-[#2563EB]' : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'}`}>
                Patient Registry
              </button>
            </li>
            <li>
              <button className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeRoute === 'Clinical Charting' ? 'bg-[#1E293B] text-white border-l-4 border-[#2563EB]' : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'}`}>
                Clinical EMR
              </button>
            </li>
            <li>
              <button className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeRoute === 'Ancillary Operations' ? 'bg-[#1E293B] text-white border-l-4 border-[#2563EB]' : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'}`}>
                Ancillary (LIS & Rx)
              </button>
            </li>
            
            {/* Conditional Financial Role Render Target */}
            {(currentUser.role === 'admin' || currentUser.role === 'cashier') && (
              <li>
                <button className={`w-full text-left px-6 py-3 font-medium transition-colors ${activeRoute === 'Cashier Console' ? 'bg-[#1E293B] text-white border-l-4 border-[#2563EB]' : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'}`}>
                  Cashier Ledger
                </button>
              </li>
            )}
          </ul>
        </nav>
      </aside>

      {/* Dynamic Route Viewport & Utility Header */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        <header className="bg-white border-b border-[#E2E8F0] px-8 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center space-x-3">
             {isOnline ? (
               <div className="flex items-center text-[#16A34A] text-xs font-bold tracking-wider">
                 <span className="w-2 h-2 rounded-full bg-[#16A34A] mr-2 animate-pulse"></span> SYSTEM ONLINE
               </div>
             ) : (
               <div className="flex items-center text-[#DC2626] text-xs font-bold tracking-wider">
                 <span className="w-2 h-2 rounded-full bg-[#DC2626] mr-2"></span> CONNECTION LOST
               </div>
             )}
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="font-bold text-[#0F172A]">{currentUser.name}</p>
              <p className="text-[#3B82F6] text-[10px] font-extrabold uppercase tracking-widest">{currentUser.role}</p>
            </div>
            
            {/* Profile Avatar Chip */}
            <div className="h-10 w-10 bg-[#E2E8F0] rounded-full border border-[#94A3B8] overflow-hidden flex items-center justify-center font-bold text-[#1E293B]">
              {currentUser.name.charAt(0)}
            </div>
            
            <button 
              onClick={logout}
              className="text-[#DC2626] hover:text-[#991B1B] font-bold text-xs uppercase transition-colors border-l border-[#E2E8F0] pl-6 h-full tracking-widest"
            >
              SECURE LOGOUT
            </button>
          </div>
        </header>

        {/* Dynamic Nested Content Yields Here */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
      
    </div>
  );
};
