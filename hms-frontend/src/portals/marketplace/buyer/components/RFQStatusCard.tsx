import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';

export interface RFQ {
  id: string;
  subject: string;
  status: 'PENDING' | 'QUOTES_RECEIVED' | 'APPROVED';
  date: string;
  quotes: number;
}

interface RFQStatusCardProps {
  rfq: RFQ;
}

export const RFQStatusCard: React.FC<RFQStatusCardProps> = ({ rfq }) => {
  return (
    <div className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
          rfq.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
          rfq.status === 'QUOTES_RECEIVED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
          'bg-emerald-50 text-emerald-600 border-emerald-100'
        }`}>
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800">{rfq.subject}</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{rfq.id} · {rfq.date}</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase border ${
            rfq.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' :
            rfq.status === 'QUOTES_RECEIVED' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
            'bg-emerald-100 text-emerald-700 border-emerald-200'
          }`}>
            {rfq.status.replace('_', ' ')}
          </span>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quotes</p>
          <p className="text-xs font-black text-slate-800">{rfq.quotes} Bids</p>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
      </div>
    </div>
  );
};

export default RFQStatusCard;
