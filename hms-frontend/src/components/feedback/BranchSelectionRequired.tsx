import { Building2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Shown when a user has the correct roles and permissions to access a
 * branch-scoped route, but has not yet selected a branch in their session.
 *
 * This is distinct from UnauthorizedState (which means the user genuinely
 * lacks access). BranchSelectionRequired means "you CAN access this page,
 * but you need to pick a branch first."
 *
 * The branch selector is available in the AppShell topbar.
 */
export const BranchSelectionRequired = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="card p-8 lg:p-12 border-amber-200/80 bg-white shadow-xl max-w-lg w-full text-center animate-scale-in flex flex-col items-center justify-center relative overflow-hidden">

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

        <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-6 shadow-sm animate-bounce-subtle">
          <Building2 className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Branch Selection Required
        </h2>

        <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed max-w-md">
          Your account has access to this page, but a branch context is required
          for branch-scoped operations. Please select a branch from the
          branch selector in the top navigation bar to continue.
        </p>

        <div className="mt-8 p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-left w-full">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Next Steps:</p>
          <ul className="text-xs text-slate-600 space-y-1.5 font-medium list-disc list-inside">
            <li>Use the branch selector in the top bar to choose a branch.</li>
            <li>If no branches are listed, contact your administrator to assign a branch.</li>
            <li>Branch context is required for clinical, financial, and inventory data.</li>
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

export default BranchSelectionRequired;
