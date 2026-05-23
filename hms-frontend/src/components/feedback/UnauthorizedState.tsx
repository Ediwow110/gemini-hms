
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UnauthorizedState = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="card p-8 lg:p-12 border-rose-200/80 bg-white shadow-xl max-w-lg w-full text-center animate-scale-in flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
        
        <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-6 shadow-sm animate-bounce-subtle">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Access Restriction Active
        </h2>
        
        <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed max-w-md">
          Your account credentials do not grant access to this portal page or operation. Clinical, administrative, and financial zones require explicit role assignments.
        </p>

        <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-100 text-left w-full">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Required Actions:</p>
          <ul className="text-xs text-slate-600 space-y-1.5 font-medium list-disc list-inside">
            <li>Verify you are logged in to the correct branch environment.</li>
            <li>Request role permission elevations from your administrator.</li>
            <li>Consult the logical access control matrix in the system registry.</li>
          </ul>
        </div>

        <div className="mt-8 flex gap-4 w-full justify-center">
          <Link
            to="/"
            className="btn btn-primary h-11 px-5 gap-2 text-xs uppercase tracking-wider shadow-md w-full justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
