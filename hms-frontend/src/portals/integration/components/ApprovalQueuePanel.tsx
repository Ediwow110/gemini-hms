import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

import { useIntegrationApprovals } from '../../../hooks/use-integration';

export const ApprovalQueuePanel: React.FC = () => {
  const { data: approvals, isLoading, error } = useIntegrationApprovals();
  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          Approval Queue
        </h3>
      </div>
      
      {isLoading ? (
        <div className="p-10 text-center text-sm font-medium text-slate-500">Loading approvals...</div>
      ) : error ? (
        <div className="p-10 text-center text-sm font-bold text-rose-500">
          {(error as { response?: { status: number } })?.response?.status === 401 || (error as { response?: { status: number } })?.response?.status === 403 
            ? 'Unauthorized to view approvals.' 
            : 'Failed to load approvals.'}
        </div>
      ) : !approvals || approvals.length === 0 ? (
        <div className="p-10 text-center text-sm font-medium text-slate-500">No approvals pending.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {approvals.map((a) => (
          <div key={a.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                a.riskLevel === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                a.riskLevel === 'HIGH' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                {a.riskLevel === 'CRITICAL' ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  {a.title || a.recordType.replace(/_/g, ' ')}
                  {a.isMock && <span className="ml-2 text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">MOCK</span>}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{a.id} · {a.sourceDomain}</p>
                <p className="text-[10px] text-slate-400 font-bold">{a.requester}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                a.riskLevel === 'CRITICAL' ? 'bg-rose-50 text-rose-600' :
                a.riskLevel === 'HIGH' ? 'bg-amber-50 text-amber-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {a.riskLevel}
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                a.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}>
                {a.status.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase">Approve (Shell)</button>
                <button className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg text-[10px] font-black uppercase">Reject (Shell)</button>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default ApprovalQueuePanel;
