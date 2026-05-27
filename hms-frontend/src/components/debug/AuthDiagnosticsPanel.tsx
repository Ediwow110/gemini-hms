import React from 'react';
import { useAuth } from '../../hooks/use-user';
import { AlertTriangle, Server, Globe, Cookie, ShieldAlert, X } from 'lucide-react';
import { apiClient } from '../../lib/api';

export const AuthDiagnosticsPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { authError } = useAuth();
  
  if (!import.meta.env.DEV) return null;

  const err = authError as { response?: { status?: number; data?: { message?: string } }; message?: string };

  // Show if there is a bootstrap error that is not a simple 401 Unauthenticated
  const isError = err && err.response?.status !== 401;
  const isNetworkError = err && !err.response;
  const isCorsError = err?.message === 'Network Error';

  if (!isError && !isNetworkError) return null;

  const currentOrigin = window.location.origin;
  const apiOrigin = new URL(apiClient.defaults.baseURL || 'http://localhost:3000').origin;
  const hasAccessCookie = document.cookie.includes('access_token');
  const isLocalhostMismatch = 
    (currentOrigin.includes('localhost') && apiOrigin.includes('127.0.0.1')) ||
    (currentOrigin.includes('127.0.0.1') && apiOrigin.includes('localhost'));

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm animate-slide-up">
      <div className="bg-rose-50 border border-rose-200 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-3 bg-rose-100 border-b border-rose-200">
          <div className="flex items-center gap-2 text-rose-800">
            <ShieldAlert className="h-4 w-4" />
            <h3 className="text-sm font-bold">Local Auth Diagnostics</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-rose-600 hover:text-rose-900">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-rose-700 font-medium">
              <Globe className="h-3 w-3" />
              <span>Frontend: {currentOrigin}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-rose-700 font-medium">
              <Server className="h-3 w-3" />
              <span>Backend: {apiOrigin}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-rose-700 font-medium">
              <Cookie className="h-3 w-3" />
              <span>Cookie 'access_token': {hasAccessCookie ? 'Present' : 'Missing'}</span>
            </div>
          </div>

          <div className="bg-white/50 rounded-lg p-3 space-y-2 border border-rose-100">
            <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Suggested Checks
            </h4>
            <ul className="text-[11px] text-rose-800 space-y-1.5 list-disc list-inside">
              {!err?.response && (
                <li>Is the backend running on <code>{apiOrigin}</code>?</li>
              )}
              {isCorsError && (
                <li>Does backend <code>CORS_ALLOWED_ORIGINS</code> include <code>{currentOrigin}</code>?</li>
              )}
              {isLocalhostMismatch && (
                <li className="font-bold underline">Avoid mixing localhost and 127.0.0.1!</li>
              )}
              <li>Clear cookies if switching between frontend origins.</li>
              <li>Ensure the seeded user matches your <code>tenantCode</code>.</li>
            </ul>
          </div>
          
          <div className="text-[10px] text-rose-500 font-mono text-center">
            {err?.message} {err?.response?.status ? `(${err.response.status})` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};
