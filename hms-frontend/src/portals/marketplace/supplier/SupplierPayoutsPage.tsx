import React from 'react';
import SupplierShellNotice from './components/SupplierShellNotice';
import PayoutSummaryCard from './components/PayoutSummaryCard';
import { History, Download } from 'lucide-react';

export const SupplierPayoutsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Payout Ledger</h2>
          <p className="text-xs text-slate-500 font-medium">Track your marketplace earnings and settlement history</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">
          <Download className="h-4 w-4" /> Download Statement (Shell)
        </button>
      </div>

      <SupplierShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <PayoutSummaryCard />
        </div>

        <div className="lg:col-span-2 space-y-4">
           <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
             <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <History className="h-4 w-4 text-slate-400" />
                 Transaction History
               </h3>
             </div>
             
             <div className="divide-y divide-slate-100">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="p-5 flex justify-between items-center">
                   <div>
                     <p className="text-xs font-black text-slate-800">Settlement PAY-2026-00{i}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">May {20-i}, 2026</p>
                   </div>
                   <div className="flex items-center gap-8">
                     <p className="text-sm font-black text-slate-900">₱2,450,000</p>
                     <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg uppercase tracking-tight">SUCCESS</span>
                     <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Download Statement (Shell)"><Download className="h-4 w-4" /></button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierPayoutsPage;
