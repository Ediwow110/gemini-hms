import React from 'react';
import { BadgeDollarSign, Truck, ShieldCheck, Check } from 'lucide-react';

export interface Quote {
  id: string;
  supplier: string;
  amount: number;
  deliveryDays: number;
  warrantyMonths: number;
  score: number;
  status: 'PENDING' | 'SELECTED' | 'REJECTED';
}

interface QuoteComparisonTableProps {
  quotes: Quote[];
}

export const QuoteComparisonTable: React.FC<QuoteComparisonTableProps> = ({ quotes }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BadgeDollarSign className="h-4 w-4 text-indigo-500" />
            Quote Comparison Matrix
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Evaluating supplier bids and proposals</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-3 pl-2">Supplier</th>
              <th className="pb-3">Total Bid</th>
              <th className="pb-3">Delivery</th>
              <th className="pb-3">Score</th>
              <th className="pb-3 text-right pr-2">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {quotes.map((q) => (
              <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 pl-2 font-bold text-slate-800">{q.supplier}</td>
                <td className="py-3 font-black text-slate-900">₱{q.amount.toLocaleString()}</td>
                <td className="py-3">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    {q.deliveryDays}d
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1 font-black text-indigo-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {q.score}%
                  </div>
                </td>
                <td className="py-3 text-right pr-2">
                  <button className="bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-200 p-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Simulation Notice:</strong> Quote selection is simulated. No real purchase orders or financial obligations are created.
      </div>
    </div>
  );
};
