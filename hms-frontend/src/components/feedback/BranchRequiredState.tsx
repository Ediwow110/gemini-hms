import { Building2, ArrowLeft, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/use-user';

export const BranchRequiredState = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 animate-scale-in">
      <div className="card p-8 lg:p-12 border-amber-200 bg-white shadow-xl max-w-lg w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500" />
        
        <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-6 shadow-sm mx-auto animate-bounce-subtle">
          <Building2 className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Active Branch Required
        </h2>
        
        <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed max-w-md mx-auto">
          This portal section contains branch-scoped records, queues, or inventories. To access this area, you must be logged in to an active hospital branch.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Link
            to="/"
            className="btn btn-secondary h-11 px-5 gap-2 text-xs uppercase tracking-wider justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go to CommandCenter</span>
          </Link>
          <button
            onClick={logout}
            className="btn btn-primary h-11 px-5 gap-2 text-xs uppercase tracking-wider justify-center cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Select Branch / Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
