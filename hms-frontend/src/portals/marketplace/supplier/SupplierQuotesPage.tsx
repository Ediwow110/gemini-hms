import React, { useEffect, useState } from 'react';
import { Search, Edit3, Archive, Loader2, AlertTriangle, FileText } from 'lucide-react';
import SupplierShellNotice from './components/SupplierShellNotice';
import QuoteSubmissionPanel from './components/QuoteSubmissionPanel';
import { apiClient } from '../../../lib/api';

export const SupplierQuotesPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/marketplace/supplier/quotes');
        setQuotes(response.data);
        setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Failed to fetch supplier quotes:', err);
        setError('Failed to load quotes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

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
           
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
               <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
               <p className="text-sm font-bold text-slate-500 tracking-tight uppercase">Loading quotes...</p>
             </div>
           ) : error ? (
             <div className="p-10 bg-rose-50 border border-rose-100 rounded-3xl text-center">
               <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
               <p className="text-sm font-black text-rose-800 tracking-tight uppercase">{error}</p>
             </div>
           ) : quotes.length === 0 ? (
             <div className="p-20 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center">
               <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
               <p className="text-sm font-black text-slate-500 tracking-tight uppercase">No quotes found</p>
             </div>
           ) : (
             quotes.map((q) => (
               <div key={q.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex justify-between items-center group">
                 <div>
                   <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{q.id.substring(0, 8)}</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                     RFQ: {q.rfq?.id.substring(0, 8)} · {q.rfq?.title || 'General RFQ'}
                   </p>
                 </div>
                 <div className="text-right flex items-center gap-6">
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bid Amount</p>
                     <p className="text-sm font-black text-slate-900">₱{Number(q.totalAmount).toLocaleString()}</p>
                   </div>
                   <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                     q.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                     q.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                     'bg-indigo-50 text-indigo-700 border-indigo-100'
                   }`}>
                     {q.status}
                   </span>
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
             ))
           )}
        </div>

        <div className="space-y-6">
           <QuoteSubmissionPanel />
        </div>
      </div>
    </div>
  );
};

export default SupplierQuotesPage;
