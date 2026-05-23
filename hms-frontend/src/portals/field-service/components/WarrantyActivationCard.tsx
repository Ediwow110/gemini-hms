import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const WarrantyActivationCard: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          Warranty Activation
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Asset: GE-V10-9918</span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
           <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
              <p className="text-xs font-black text-slate-800">May 21, 2026</p>
           </div>
           <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</p>
              <p className="text-xs font-black text-slate-800">May 21, 2029</p>
           </div>
        </div>

        <div className="space-y-2">
          {['Serial Number Verified', 'Handover Document Signed', 'User Training Logged'].map((check) => (
            <label key={check} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl cursor-pointer">
               <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
               <span className="text-xs font-medium text-slate-600">{check}</span>
            </label>
          ))}
        </div>
      </div>

      <button className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase shadow-lg shadow-indigo-200">
        Activate Digital Warranty (Shell)
      </button>
    </div>
  );
};

export default WarrantyActivationCard;
