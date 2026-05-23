import React from 'react';
import { Calendar, Clock, Check, X } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface LeaveRequest {
  id: string;
  employeeName: string;
  type: 'ANNUAL' | 'SICK' | 'MATERNITY' | 'EMERGENCY';
  startDate: string;
  endDate: string;
  days: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface LeaveQueuePanelProps {
  requests: LeaveRequest[];
}

export const LeaveQueuePanel: React.FC<LeaveQueuePanelProps> = ({ requests }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            Pending Leave Queue
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Time-off requests awaiting approval</p>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-lg">{requests.length} pending</span>
      </div>

      <div className="space-y-3">
        {requests.map((req) => (
          <div key={req.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-800">{req.employeeName}</p>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium mt-0.5">
                  <Clock className="h-3 w-3" />
                  {req.startDate} — {req.endDate} ({req.days} days)
                </div>
              </div>
              <StatusBadge status={req.type} type="info" />
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-200 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer">
                <Check className="h-3 w-3" /> Approve
              </button>
              <button className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer">
                <X className="h-3 w-3" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Shell Notice:</strong> Leave mutations are simulated. Approval actions update UI state only and do not modify employment records.
      </div>
    </div>
  );
};
