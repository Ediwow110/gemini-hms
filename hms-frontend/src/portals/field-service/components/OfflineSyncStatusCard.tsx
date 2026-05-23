import React from 'react';
import { CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';

export const OfflineSyncStatusCard: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-xl">
             <CloudOff className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Offline Queue</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">3 Items Pending</p>
          </div>
        </div>
        <button className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-slate-100">
           <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
         <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="h-2 w-2 bg-amber-500 rounded-full" />
               <span className="text-xs font-bold text-slate-700">ORD-9918 Proof of Delivery</span>
            </div>
            <span className="text-[9px] font-black text-slate-400">SIGNATURE</span>
         </div>
         <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="h-2 w-2 bg-amber-500 rounded-full" />
               <span className="text-xs font-bold text-slate-700">ORD-9918 Site Photo</span>
            </div>
            <span className="text-[9px] font-black text-slate-400">IMAGE</span>
         </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
         <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
         <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
           <strong>Simulation Notice:</strong> This is a UI shell. No data is actually stored locally or synchronized in this functional prototype phase.
         </p>
      </div>
    </div>
  );
};

export default OfflineSyncStatusCard;
