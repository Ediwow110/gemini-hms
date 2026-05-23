import { ClipboardList, ShieldAlert, CheckCircle } from 'lucide-react';

interface ReconciliationSummaryProps {
  startingCash: number;
  collections: {
    cash: number;
    card: number;
    online: number;
    hmo: number;
  };
  actualCash: number;
  remarks: string;
  onRemarksChange: (remarks: string) => void;
  onActualCashChange: (amount: number) => void;
  className?: string;
}

export const ReconciliationSummary = ({
  startingCash,
  collections,
  actualCash,
  remarks,
  onRemarksChange,
  onActualCashChange,
  className = '',
}: ReconciliationSummaryProps) => {
  const totalCollections = collections.cash + collections.card + collections.online + collections.hmo;
  const expectedCashTotal = startingCash + collections.cash;
  const variance = actualCash ? actualCash - expectedCashTotal : -expectedCashTotal;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      
      {/* 1. Collections Breakdown */}
      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
        <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-1.5">
          <ClipboardList className="h-4 w-4 text-indigo-500" />
          Method Collections
        </h4>
        <div className="space-y-2.5 text-xs font-semibold">
          <div className="flex justify-between border-b border-slate-50 pb-1.5">
            <span className="text-slate-500">Cash Collections:</span>
            <span className="font-mono text-slate-800">₱{collections.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-1.5">
            <span className="text-slate-500">Card Payments:</span>
            <span className="font-mono text-slate-800">₱{collections.card.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-1.5">
            <span className="text-slate-500">Digital / E-Wallet:</span>
            <span className="font-mono text-slate-800">₱{collections.online.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-1.5">
            <span className="text-slate-500">HMO Allocations:</span>
            <span className="font-mono text-slate-800">₱{collections.hmo.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-slate-100 pt-2 text-sm">
            <span className="text-slate-900">Total Payments:</span>
            <span className="font-mono text-indigo-650">₱{totalCollections.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* 2. Cash Reconciliation */}
      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
        <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-1.5">
          <ClipboardList className="h-4 w-4 text-indigo-500" />
          Drawer Balance
        </h4>
        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between font-semibold">
            <span className="text-slate-500">Expected Drawer Cash:</span>
            <span className="font-mono font-bold text-slate-800">
              ₱{expectedCashTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-450 uppercase block">Actual Counted Cash</label>
            <input
              type="number"
              value={actualCash || ''}
              onChange={(e) => onActualCashChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="input font-mono font-bold text-slate-800 text-sm py-2 bg-slate-50 border border-slate-200 rounded-xl w-full"
              step="0.01"
            />
          </div>

          <div className="flex justify-between font-bold border-t border-slate-100 pt-3 text-sm items-baseline">
            <span className="text-slate-900">Reconciliation Variance:</span>
            <span className={`font-mono text-lg font-black ${
              variance === 0 
                ? 'text-emerald-600' 
                : 'text-rose-600 animate-pulse'
            }`}>
              ₱{variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Remarks & Approvals */}
      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
        <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-3 flex items-center gap-1.5">
          <ClipboardList className="h-4 w-4 text-indigo-500" />
          Variance Remarks
        </h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-450 uppercase block flex items-center gap-1">
              Remarks {variance !== 0 && <span className="text-rose-500 font-extrabold">(Required)</span>}
            </label>
            <textarea
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              placeholder={variance !== 0 ? "Explain reasons for discrepancy..." : "Reconciliation remarks (optional)..."}
              className="input min-h-[95px] text-xs py-2 bg-slate-50 border border-slate-200 rounded-xl w-full"
              required={variance !== 0}
            />
          </div>

          {variance === 0 ? (
            <div className="p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl flex items-center gap-2 text-emerald-700 font-bold text-[11px]">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Drawer balances perfectly with expected cash ledger.
            </div>
          ) : (
            <div className="p-2.5 bg-rose-50 border border-rose-150 rounded-xl flex items-center gap-2 text-rose-700 font-bold text-[10px] leading-tight">
              <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
              Discrepancy triggers audit logs and flags supervisor review.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ReconciliationSummary;
