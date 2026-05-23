import { useNavigate } from 'react-router-dom';
import { Play, ShieldAlert, Award, Clock } from 'lucide-react';

interface CashierSessionCardProps {
  session: {
    id: string;
    cashierName: string;
    status: 'Active' | 'Closed';
    startedAt: string;
    startingCash: number;
    expectedCash: number;
    actualCash: number;
  } | null;
  className?: string;
}

export const CashierSessionCard = ({ session, className = '' }: CashierSessionCardProps) => {
  const navigate = useNavigate();

  if (!session) {
    return (
      <div className={`card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex flex-col justify-between h-full ${className}`}>
        <div className="space-y-2">
          <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-indigo-500" />
            Cashier Session
          </h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            No active cashier session found for your user context in this branch. You must open a session before collecting payments.
          </p>
        </div>
        <button
          onClick={() => navigate('/cashier/session')}
          className="btn btn-primary w-full text-xs font-extrabold py-2.5 rounded-xl mt-4 flex items-center justify-center gap-1.5"
        >
          <Play className="h-4 w-4 fill-current" /> Open New Session
        </button>
      </div>
    );
  }

  const collections = session.expectedCash - session.startingCash;
  const variance = session.actualCash ? session.actualCash - session.expectedCash : 0;
  const isActive = session.status === 'Active';

  return (
    <div className={`card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-indigo-500" />
          Session Monitor
        </h3>
        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider select-none ${
          isActive 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-150 animate-pulse' 
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {session.status}
        </span>
      </div>

      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between font-semibold border-b border-slate-50 pb-1.5">
          <span className="text-slate-550">Session ID:</span>
          <span className="font-mono font-bold text-slate-900">{session.id}</span>
        </div>
        <div className="flex justify-between font-semibold border-b border-slate-50 pb-1.5">
          <span className="text-slate-550">Cashier:</span>
          <span className="font-bold text-slate-900">{session.cashierName}</span>
        </div>
        <div className="flex justify-between font-semibold border-b border-slate-50 pb-1.5">
          <span className="text-slate-550">Starting Drawer:</span>
          <span className="font-bold text-slate-800">₱{session.startingCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between font-semibold border-b border-slate-50 pb-1.5">
          <span className="text-slate-550">Collections:</span>
          <span className="font-bold text-emerald-600">₱{collections.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between font-bold pt-1.5">
          <span className="text-slate-900">Expected Total:</span>
          <span className="text-slate-900 font-extrabold">₱{session.expectedCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        {variance !== 0 && (
          <div className="p-2.5 bg-rose-50 border border-rose-150 rounded-xl flex items-center gap-2 text-rose-700 font-bold">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 text-[11px] leading-tight">
              Reconciliation Variance: ₱{variance.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-slate-100 pt-3">
        <button
          onClick={() => navigate('/cashier/session')}
          className="btn border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-950 font-bold text-xs flex-1 py-2 rounded-xl transition-all"
        >
          View Details
        </button>
        {isActive && (
          <button
            onClick={() => navigate('/cashier/reconciliation')}
            className="btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 font-extrabold text-xs flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <Award className="h-3.5 w-3.5" /> Reconcile
          </button>
        )}
      </div>
    </div>
  );
};

export default CashierSessionCard;
