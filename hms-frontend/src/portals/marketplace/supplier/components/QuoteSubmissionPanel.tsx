import React from 'react';
import { Send, ShieldCheck, Truck } from 'lucide-react';

export const QuoteSubmissionPanel: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Draft Quote Submission</h3>
        <span className="text-[10px] font-black text-slate-400 uppercase">RFQ-2026-001</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Price (PHP)</label>
          <input type="number" placeholder="0.00" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Lead Time</label>
          <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none">
            <option>7-14 Days</option>
            <option>14-21 Days</option>
            <option>30+ Days</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
         <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
           <ShieldCheck className="h-5 w-5 text-indigo-600 mt-0.5" />
           <div>
             <p className="text-xs font-black text-indigo-900 uppercase">Warranty Inclusion</p>
             <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">Default 3-Year Platinum Support Plan included in this quote.</p>
           </div>
         </div>
         <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
           <Truck className="h-5 w-5 text-emerald-600 mt-0.5" />
           <div>
             <p className="text-xs font-black text-emerald-900 uppercase">Logistic Commitments</p>
             <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">Includes specialized medical handling and on-site delivery to radiology suites.</p>
           </div>
         </div>
      </div>

      <button className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer">
        Submit Formal Quote (Shell) <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
  );
};

export default QuoteSubmissionPanel;
