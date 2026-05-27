import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export const RouteErrorBoundary = () => {
  const error = useRouteError() as { status?: number; statusText?: string; message?: string; stack?: string };
  const navigate = useNavigate();

  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-rose-50 border-b border-rose-100 p-6 flex flex-col items-center text-center">
          <div className="bg-rose-100 p-3 rounded-2xl mb-4">
            <AlertTriangle className="h-8 w-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
          <p className="text-sm text-slate-500 mt-2">
            The application encountered an unexpected error while trying to load this page.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry Page
            </button>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </button>
          </div>

          {isDev && error && (
            <div className="mt-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Developer Details</p>
              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-[10px] text-rose-300 font-mono">
                  {error.status ? `${error.status} ${error.statusText}\n` : ''}
                  {error.message || error.toString()}
                  {'\n'}
                  {error.stack}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
