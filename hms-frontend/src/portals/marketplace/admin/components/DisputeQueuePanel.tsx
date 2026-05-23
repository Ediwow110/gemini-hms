import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export const DisputeQueuePanel: React.FC = () => {
  const disputes = [
    { id: 'DSP-2026-001', order: 'ORD-2026-9756', buyer: 'C*** D*** Clinic', supplier: 'BioEquip Intl', reason: 'Item Not As Described', evidence: 'Photos Attached', status: 'OPEN' },
    { id: 'DSP-2026-002', order: 'ORD-2026-9654', buyer: 'M*** C*** Hospital', supplier: 'Global Med Systems', reason: 'Delayed Delivery', evidence: 'Tracking Logs', status: 'UNDER_REVIEW' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          Dispute Queue (Mock)
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {disputes.map((d) => (
          <div key={d.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">{d.reason}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{d.id} · {d.order}</p>
                <p className="text-[10px] text-slate-400 font-bold">{d.buyer} vs {d.supplier}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Evidence</p>
                <p className="text-[10px] font-bold text-slate-500">{d.evidence}</p>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                d.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}>
                {d.status.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase">Resolve (Shell)</button>
                <button className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 rounded-lg text-[10px] font-black uppercase">Escalate (Shell)</button>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisputeQueuePanel;
