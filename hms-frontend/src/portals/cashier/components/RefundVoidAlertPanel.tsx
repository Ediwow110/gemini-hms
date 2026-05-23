import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

export interface RefundRequest {
  id: string;
  receiptNo: string;
  patientName: string;
  reason: string;
  amount: number;
  requestDate: string;
  status: 'Pending Review' | 'Approved' | 'Rejected';
  cashier: string;
}

interface RefundVoidAlertPanelProps {
  requests: RefundRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  className?: string;
}

export const RefundVoidAlertPanel = ({
  requests,
  onApprove,
  onReject,
  className = '',
}: RefundVoidAlertPanelProps) => {
  return (
    <div className={`card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <ShieldAlert className="h-4.5 w-4.5 text-indigo-500" />
          Reversal & Refund Queue Alerts
        </h3>
        <span className="text-[10px] bg-rose-50 border border-rose-150 text-rose-700 font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wider select-none animate-pulse">
          Review Required
        </span>
      </div>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="text-center py-6 text-slate-400 font-semibold text-xs">
            No active void or refund requests require approval.
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className={`p-4 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                req.status === 'Approved'
                  ? 'bg-emerald-50/40 border-emerald-150/60'
                  : req.status === 'Rejected'
                  ? 'bg-slate-50 border-slate-200/80'
                  : 'bg-rose-50/20 border-rose-150/40'
              }`}
            >
              <div className="space-y-1.5 flex-1 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-slate-800 text-[13px]">{req.patientName}</span>
                  <span className="font-mono font-bold text-slate-400">Receipt: {req.receiptNo}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded-md font-bold">
                    ID: {req.id}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-550 font-semibold">
                  <span className="text-rose-600 font-black text-xs">
                    ₱{req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span>•</span>
                  <span>Reason: <strong className="text-slate-700">{req.reason}</strong></span>
                  <span>•</span>
                  <span>Requested: {req.requestDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {req.status === 'Pending Review' ? (
                  <>
                    <button
                      onClick={() => onApprove(req.id)}
                      className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-3 py-2 rounded-xl shadow-sm flex items-center gap-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Approve Void
                    </button>
                    <button
                      onClick={() => onReject(req.id)}
                      className="btn border border-slate-200 text-slate-650 hover:bg-slate-50 text-[11px] font-bold px-3 py-2 rounded-xl"
                    >
                      <XCircle className="h-3.5 w-3.5 text-slate-400" /> Reject
                    </button>
                  </>
                ) : (
                  <span className={`inline-flex px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                    req.status === 'Approved'
                      ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                      : 'bg-slate-150 border-slate-250 text-slate-500'
                  }`}>
                    {req.status}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RefundVoidAlertPanel;
