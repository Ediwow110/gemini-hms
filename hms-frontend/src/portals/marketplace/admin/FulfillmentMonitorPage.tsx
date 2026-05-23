import React from 'react';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import FulfillmentSLAWidget from './components/FulfillmentSLAWidget';

export const FulfillmentMonitorPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Fulfillment Monitor</h2>
        <p className="text-xs text-slate-500 font-medium">Fulfillment pipeline, supplier SLA, and delivery tracking</p>
      </div>

      <MarketplaceAdminShellNotice />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Packed (Mock)</p>
          <p className="text-2xl font-black text-amber-600">8</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shipped (Mock)</p>
          <p className="text-2xl font-black text-blue-600">15</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivered (Mock)</p>
          <p className="text-2xl font-black text-emerald-600">289</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delayed (Mock)</p>
          <p className="text-2xl font-black text-rose-600">3</p>
        </div>
      </div>

      <FulfillmentSLAWidget />

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <p className="text-xs font-bold text-amber-900">Courier / Tracking Placeholder</p>
        <p className="text-[10px] text-amber-700 font-medium mt-0.5">Courier assignments and tracking data are UI placeholders. No real fulfillment mutations are performed in this phase.</p>
      </div>
    </div>
  );
};

export default FulfillmentMonitorPage;
