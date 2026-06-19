import React, { useState } from 'react';
import { Send } from 'lucide-react';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';
import RFQStatusCard, { RFQ } from './components/RFQStatusCard';

export const MarketplaceRFQPage: React.FC = () => {
  // RFQ creation and inbox not backed by live buyer endpoints in current release.
  const [rfqs] = useState<RFQ[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Request for Quotes (RFQ)</h2>
          <p className="text-xs text-slate-500 font-medium">Manage multi-vendor pricing requests and bid comparisons</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer" disabled title="RFQ creation is shell-only until backend RFQ endpoints are implemented">
          <Send className="h-4 w-4" /> Create New RFQ (Shell)
        </button>
      </div>

      <MarketplaceShellNotice />

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Active RFQs</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {rfqs.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No RFQs. Buyer RFQ management is currently a prototype shell without live backend submission or quote retrieval.</div>
          ) : rfqs.map((rfq) => (
            <RFQStatusCard key={rfq.id} rfq={rfq} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceRFQPage;
