import React from 'react';
import { FileCheck } from 'lucide-react';

export const HandoverProofPanel: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
        <FileCheck className="h-4 w-4 text-indigo-500" />
        Proof of Handover
      </h3>

      <div className="space-y-4">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Signature</p>
          <div className="aspect-[2/1] bg-white border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300">
             <p className="text-[10px] font-bold">Signature Area Placeholder</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</p>
          <input type="text" placeholder="Print Name" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold" />
        </div>
      </div>

      <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase shadow-xl">
        Complete Handover (Shell)
      </button>
    </div>
  );
};

export default HandoverProofPanel;
