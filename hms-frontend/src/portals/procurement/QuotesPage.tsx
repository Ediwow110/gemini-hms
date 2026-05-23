import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { QuoteComparisonTable, Quote } from './components/QuoteComparisonTable';
import { BadgeDollarSign } from 'lucide-react';

export const QuotesPage: React.FC = () => {
  const mockQuotes: Quote[] = [
    { id: 'Q-001', supplier: 'Apex Medical Corp', amount: 125000, deliveryDays: 3, warrantyMonths: 12, score: 95, status: 'PENDING' },
    { id: 'Q-002', supplier: 'Global Pharma Inc', amount: 132000, deliveryDays: 2, warrantyMonths: 24, score: 92, status: 'PENDING' },
    { id: 'Q-003', supplier: 'Metro Lab Tech', amount: 118000, deliveryDays: 5, warrantyMonths: 6, score: 85, status: 'PENDING' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Quote Comparison & Selection
          </h2>
          <p className="text-xs text-slate-500 font-medium">Evaluate supplier bids for open RFQs and approve the best proposals</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
          <strong>Sandbox Notice:</strong> Quote data is simulated. Selection does not trigger real financial obligations.
        </div>
      </div>

      <ProcurementScopeFilter />

      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="h-9 w-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
            <BadgeDollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-mono">Comparing Quotes for RFQ/2026/05/MED-SUP</p>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Medical Grade Consumables Pack</h3>
          </div>
        </div>

        <QuoteComparisonTable quotes={mockQuotes} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-indigo-900 uppercase">Selection Criteria Shell</h4>
          <p className="text-[10px] text-indigo-800 leading-relaxed font-medium">
            System score is calculated based on: Price (40%), Warranty (20%), Delivery Speed (20%), and Vendor Performance History (20%).
          </p>
        </div>
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase">Approval Workflow Shell</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            Approved quotes are automatically routed to the Purchase Order generation queue. Procurement Managers can override system rankings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuotesPage;
