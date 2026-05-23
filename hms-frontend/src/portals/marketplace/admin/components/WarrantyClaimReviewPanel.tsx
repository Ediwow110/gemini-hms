import React from 'react';
import { ShieldCheck, FileText, ArrowRight } from 'lucide-react';

export const WarrantyClaimReviewPanel: React.FC = () => {
  const claims = [
    { id: 'WCL-2026-001', asset: 'GE Voluson E10', buyer: 'M*** C*** Hospital', supplier: 'Global Med Systems', coverage: 'IN_WARRANTY', evidence: 'Photos + Logs', status: 'PENDING_REVIEW' },
    { id: 'WCL-2026-002', asset: 'Roche cobas c 311', buyer: 'S*** J*** Medical', supplier: 'PharmaTech Solutions', coverage: 'EXPIRED', evidence: 'Error Screenshots', status: 'UNDER_REVIEW' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          Warranty Claim Review (Mock)
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {claims.map((c) => (
          <div key={c.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                c.coverage === 'IN_WARRANTY' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">{c.asset}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{c.id} · {c.buyer}</p>
                <p className="text-[10px] text-slate-400 font-bold">{c.supplier}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Evidence</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  <FileText className="h-3 w-3" /> {c.evidence}
                </div>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                c.coverage === 'IN_WARRANTY' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {c.coverage.replace('_', ' ')}
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                c.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}>
                {c.status.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase">Approve (Shell)</button>
                <button className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg text-[10px] font-black uppercase">Deny (Shell)</button>
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

export default WarrantyClaimReviewPanel;
