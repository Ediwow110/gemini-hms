import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const WarrantyClaimPanel: React.FC = () => {
  const claims = [
    { id: 'CLM-001', asset: 'GE Voluson E10', issue: 'Display Artifacts', status: 'PENDING_REVIEW', date: '2026-05-19' },
    { id: 'CLM-002', asset: 'Roche cobas c 311', issue: 'Reagent Loading Error', status: 'TECHNICIAN_ASSIGNED', date: '2026-05-18' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        Open Warranty Claims
      </h3>
      <div className="space-y-3">
        {claims.map((claim) => (
          <div key={claim.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-black text-slate-800">{claim.asset}</h4>
                <p className="text-xs font-medium text-rose-600 italic">"{claim.issue}"</p>
              </div>
              <span className="text-[9px] font-black px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg uppercase">
                {claim.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
              <p className="text-[10px] text-slate-400 font-bold uppercase">{claim.id} · {claim.date}</p>
              <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Manage Claim</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarrantyClaimPanel;
