import React from 'react';
import { BadgeDollarSign, ArrowRight } from 'lucide-react';

export interface QuoteBrief {
  id: string;
  supplier: string;
  rfqReference: string;
  amount: number;
  submittedAt: string;
}

interface QuoteSubmissionsPanelProps {
  quotes: QuoteBrief[];
}

export const QuoteSubmissionsPanel: React.FC<QuoteSubmissionsPanelProps> = ({ quotes }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BadgeDollarSign className="h-4 w-4 text-indigo-500" />
            Quotes Awaiting Review
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">New supplier bids for open RFQs</p>
        </div>
      </div>

      <div className="space-y-3">
        {quotes.map((q) => (
          <div key={q.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group">
            <div>
              <p className="text-xs font-bold text-slate-800">{q.supplier}</p>
              <p className="text-[10px] text-slate-400 font-mono">{q.rfqReference}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-slate-900">₱{q.amount.toLocaleString()}</p>
              <button className="text-[9px] text-indigo-600 font-black flex items-center gap-0.5 ml-auto cursor-pointer hover:underline">
                Review <ArrowRight className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Notice:</strong> Quote submissions are mock data for UI verification.
      </div>
    </div>
  );
};
