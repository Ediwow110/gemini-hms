import React from 'react';
import { DollarSign, Download, ArrowRight, TrendingUp } from 'lucide-react';

export const PayoutSummaryCard: React.FC = () => {
  return (
    <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
            <DollarSign className="h-6 w-6 text-emerald-400" />
          </div>
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
            <Download className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Next Scheduled Payout (Mock)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black tracking-tight leading-none">₱6,400,000</p>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12.5%
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2">Due on June 01, 2026</p>
        </div>

        <div className="pt-6 border-t border-white/10 flex gap-8">
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Approval</p>
             <p className="text-lg font-black text-white">₱1,850,000</p>
           </div>
           <div className="w-px bg-white/10" />
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Processing Fees</p>
             <p className="text-lg font-black text-slate-400">₱45,000</p>
           </div>
        </div>

        <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group">
          View Payout History <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute -right-12 -bottom-12 h-64 w-64 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute -left-12 -top-12 h-48 w-48 bg-emerald-500/10 rounded-full blur-3xl" />
    </div>
  );
};

export default PayoutSummaryCard;
