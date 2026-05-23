import React from 'react';
import { FilePlus, User, Building, Clock, CheckCircle2, XCircle } from 'lucide-react';

export interface PurchaseRequest {
  id: string;
  item: string;
  category: string;
  requestedBy: string;
  branch: string;
  priority: 'URGENT' | 'NORMAL' | 'LOW';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
}

interface PurchaseRequestQueueProps {
  requests: PurchaseRequest[];
}

export const PurchaseRequestQueue: React.FC<PurchaseRequestQueueProps> = ({ requests }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FilePlus className="h-4 w-4 text-indigo-500" />
            Purchase Request Queue
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Internal stock and procurement requisitions</p>
        </div>
        <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">View All Requests</button>
      </div>

      <div className="divide-y divide-slate-50">
        {requests.map((req) => (
          <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                req.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {req.item.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{req.item}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <User className="h-3 w-3" /> {req.requestedBy}
                  </span>
                  <span className="text-[10px] text-slate-400">·</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {req.date}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-slate-700 flex items-center justify-end gap-1">
                  <Building className="h-3 w-3 text-slate-400" />
                  {req.branch}
                </p>
                <p className="text-[9px] text-slate-400 font-medium">{req.category}</p>
              </div>
              <div className="flex gap-2">
                <button title="Approve" className="p-1.5 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 rounded-lg transition-colors border border-transparent hover:border-emerald-100 cursor-pointer">
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <button title="Reject" className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer">
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-amber-50/50 border-t border-slate-100">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
          <strong>Sandbox Notice:</strong> Purchase requests are simulated. No real budget commitment or supplier notifications occur.
        </div>
      </div>
    </div>
  );
};
