import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export const SupplierApprovalQueue: React.FC = () => {
  const suppliers = [
    { id: 'SUP-2026-001', name: 'Global Med Systems', status: 'PENDING_REVIEW', risk: 'LOW', docs: 'Complete' },
    { id: 'SUP-2026-002', name: 'PharmaTech Solutions', status: 'PENDING_REVIEW', risk: 'MEDIUM', docs: 'Missing Certificate' },
    { id: 'SUP-2026-003', name: 'BioEquip International', status: 'UNDER_REVIEW', risk: 'LOW', docs: 'Complete' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          Supplier Approval Queue (Mock)
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {suppliers.map((s) => (
          <div key={s.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                s.risk === 'LOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                s.risk === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                {s.risk === 'LOW' ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">{s.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{s.id} · {s.docs}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                s.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}>
                {s.status.replace('_', ' ')}
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                s.risk === 'LOW' ? 'bg-emerald-50 text-emerald-600' :
                s.risk === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                'bg-rose-50 text-rose-600'
              }`}>
                {s.risk} RISK
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
    </div>
  );
};

export default SupplierApprovalQueue;
