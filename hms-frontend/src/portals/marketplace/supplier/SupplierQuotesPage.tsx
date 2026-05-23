import React from 'react';
import { Search, Edit3, Archive } from 'lucide-react';
import SupplierShellNotice from './components/SupplierShellNotice';
import QuoteSubmissionPanel from './components/QuoteSubmissionPanel';

export const SupplierQuotesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Quote Management</h2>
        <p className="text-xs text-slate-500 font-medium">Monitor and revise your active bids and pricing proposals</p>
      </div>

      <SupplierShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           <div className="bg-white border border-slate-200 rounded-3xl p-4 flex items-center justify-between">
             <div className="flex gap-2">
               <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black">All Quotes</button>
               <button className="px-4 py-2 text-slate-500 rounded-xl text-xs font-bold">Pending</button>
               <button className="px-4 py-2 text-slate-500 rounded-xl text-xs font-bold">Accepted</button>
             </div>
             <Search className="h-4 w-4 text-slate-400 mr-2" />
           </div>
           
           {[1, 2, 3].map((i) => (
             <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 flex justify-between items-center group">
               <div>
                 <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">QTE-2026-00{i}</h4>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">RFQ-2026-00{i} · GE Voluson E10</p>
               </div>
               <div className="text-right flex items-center gap-6">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bid Amount</p>
                   <p className="text-sm font-black text-slate-900">₱4,100,000</p>
                 </div>
                 <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-lg border border-indigo-100">UNDER REVIEW</span>
                 <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Revise Quote (Shell)">
                     <Edit3 className="h-3.5 w-3.5" />
                   </button>
                   <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Withdraw Quote (Shell)">
                     <Archive className="h-3.5 w-3.5" />
                   </button>
                 </div>
               </div>
             </div>
           ))}
        </div>

        <div className="space-y-6">
           <QuoteSubmissionPanel />
        </div>
      </div>
    </div>
  );
};

export default SupplierQuotesPage;
