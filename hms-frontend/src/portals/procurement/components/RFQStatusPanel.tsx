import React from 'react';
import { Send, Users, Clock, ArrowRight } from 'lucide-react';

export interface RFQItem {
  id: string;
  reference: string;
  items: string;
  invitedSuppliers: number;
  quotesReceived: number;
  deadline: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
}

interface RFQStatusPanelProps {
  rfqs: RFQItem[];
}

export const RFQStatusPanel: React.FC<RFQStatusPanelProps> = ({ rfqs }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Send className="h-4 w-4 text-indigo-500" />
            Active RFQ Monitoring
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Bidding process for bulk procurement</p>
        </div>
        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-lg border border-indigo-100">{rfqs.length} Active</span>
      </div>

      <div className="space-y-3">
        {rfqs.map((rfq) => (
          <div key={rfq.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-slate-400 font-mono mb-1">{rfq.reference}</p>
                <p className="text-xs font-bold text-slate-800">{rfq.items}</p>
              </div>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                rfq.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                {rfq.status}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                  <Users className="h-3 w-3" /> {rfq.quotesReceived}/{rfq.invitedSuppliers} Quotes
                </div>
                <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                  <Clock className="h-3 w-3" /> Due: {rfq.deadline}
                </div>
              </div>
              <button className="text-[9px] text-indigo-600 font-black flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                Manage <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Simulation Notice:</strong> RFQ workflows are simulated. No real email invitations or supplier portal links are sent.
      </div>
    </div>
  );
};
