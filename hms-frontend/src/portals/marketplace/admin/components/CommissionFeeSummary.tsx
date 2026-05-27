import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

export const CommissionFeeSummary: React.FC = () => {
  return (
    <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <DollarSign className="h-6 w-6 text-emerald-400" />
          </div>
          <button type="button" disabled className="cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black text-slate-400" title="Statement export endpoint is not available yet.">
            Export WIP
          </button>
        </div>

        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Platform Revenue (Mock)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black tracking-tight leading-none">₱845,000</p>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +8.3%
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2">Current billing cycle</p>
        </div>

        <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Fees</p>
            <p className="text-lg font-black text-white">₱125,000</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Commission</p>
            <p className="text-lg font-black text-white">12.5%</p>
          </div>
        </div>

        <button type="button" disabled title="Statement export endpoint is not available yet." className="w-full cursor-not-allowed py-4 bg-white/10 text-slate-400 font-black rounded-2xl flex items-center justify-center gap-2">
          Export Statement WIP
        </button>
      </div>

      <div className="absolute -right-12 -bottom-12 h-64 w-64 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute -left-12 -top-12 h-48 w-48 bg-emerald-500/10 rounded-full blur-3xl" />
    </div>
  );
};

export default CommissionFeeSummary;
