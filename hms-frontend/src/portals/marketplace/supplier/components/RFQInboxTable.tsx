import React, { useEffect, useState } from 'react';
import { FileText, ArrowRight, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../../../lib/api';

export const RFQInboxTable: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/marketplace/supplier/rfqs');
        setRfqs(response.data);
        setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Failed to fetch supplier RFQs:', err);
        setError('Failed to load RFQs');
      } finally {
        setLoading(false);
      }
    };

    fetchRfqs();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 tracking-tight uppercase">Loading RFQs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 bg-rose-50 border border-rose-100 rounded-3xl text-center">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
        <p className="text-sm font-black text-rose-800 tracking-tight uppercase">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-rose-600 text-white text-xs font-black rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  if (rfqs.length === 0) {
    return (
      <div className="p-20 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-sm font-black text-slate-500 tracking-tight uppercase">No RFQs found</p>
        <p className="text-xs text-slate-400 mt-2">Open RFQs from hospitals will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">RFQ Inbox</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {rfqs.map((rfq) => (
          <div key={rfq.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center border bg-indigo-50 text-indigo-600 border-indigo-100">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">{rfq.title || `RFQ for ${rfq.branch?.name}`}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  {rfq.id.substring(0, 8)} · {rfq.branch?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Created</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-black">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(rfq.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quotes</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-black justify-end">
                  {rfq._count?.quotes || 0}
                </div>
              </div>
              <button className="bg-white text-indigo-600 border border-slate-200 hover:border-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm">
                Submit Quote
              </button>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RFQInboxTable;
