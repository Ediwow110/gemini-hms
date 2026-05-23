import React from 'react';
import { FileText, ArrowRight, Clock } from 'lucide-react';

export const RFQInboxTable: React.FC = () => {
  const rfqs = [
    { id: 'RFQ-2026-001', buyer: 'M*** C*** Hospital', item: 'GE Voluson E10 Probes', deadline: '2026-05-25', status: 'NEW' },
    { id: 'RFQ-2026-004', buyer: 'S*** J*** Medical', item: 'Annual Consumables Supply', deadline: '2026-05-22', status: 'URGENT' },
    { id: 'RFQ-2026-009', buyer: 'C*** D*** Clinic', item: 'Radiology Suite Expansion', deadline: '2026-05-30', status: 'NEW' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">RFQ Inbox</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {rfqs.map((rfq) => (
          <div key={rfq.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                rfq.status === 'URGENT' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}>
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">{rfq.item}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{rfq.id} · {rfq.buyer}</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deadline</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-black">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {rfq.deadline}
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
