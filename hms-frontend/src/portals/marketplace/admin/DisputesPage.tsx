import React from 'react';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import DisputeQueuePanel from './components/DisputeQueuePanel';

export const DisputesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Disputes</h2>
        <p className="text-xs text-slate-500 font-medium">Marketplace dispute resolution and escalation oversight</p>
      </div>

      <MarketplaceAdminShellNotice />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open (Mock)</p>
          <p className="text-2xl font-black text-rose-600">5</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Under Review (Mock)</p>
          <p className="text-2xl font-black text-blue-600">3</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolved (Mock)</p>
          <p className="text-2xl font-black text-emerald-600">18</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escalated (Mock)</p>
          <p className="text-2xl font-black text-amber-600">2</p>
        </div>
      </div>

      <DisputeQueuePanel />
    </div>
  );
};

export default DisputesPage;
