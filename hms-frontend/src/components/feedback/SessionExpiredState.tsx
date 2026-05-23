import { KeyRound, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/use-user';

export const SessionExpiredState = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen w-screen bg-[#f0f2f7] flex items-center justify-center p-4 animate-scale-in">
      <div className="card p-8 lg:p-12 border-slate-200 bg-white shadow-xl max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
        
        <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm mx-auto animate-pulse">
          <KeyRound className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Session Expired
        </h2>
        
        <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed">
          Your session credentials have expired or are no longer valid. Please sign in again to verify your identity.
        </p>

        <button
          onClick={logout}
          className="btn btn-primary mt-8 h-11 px-6 gap-2 text-xs uppercase tracking-wider w-full justify-center cursor-pointer shadow-md shadow-indigo-200"
        >
          <LogIn className="h-4 w-4" />
          <span>Sign In Again</span>
        </button>
      </div>
    </div>
  );
};
