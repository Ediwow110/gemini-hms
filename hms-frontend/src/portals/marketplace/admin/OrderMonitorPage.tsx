import React from 'react';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import OrderMonitorTable from './components/OrderMonitorTable';

export const OrderMonitorPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Order Monitor</h2>
        <p className="text-xs text-slate-500 font-medium">Marketplace order oversight, SLA tracking, and risk flagging</p>
      </div>

      <MarketplaceAdminShellNotice />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Orders (Mock)</p>
          <p className="text-2xl font-black text-slate-900">342</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending (Mock)</p>
          <p className="text-2xl font-black text-amber-600">34</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disputed (Mock)</p>
          <p className="text-2xl font-black text-rose-600">5</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA Breach (Mock)</p>
          <p className="text-2xl font-black text-rose-600">2</p>
        </div>
      </div>

      <OrderMonitorTable />
    </div>
  );
};

export default OrderMonitorPage;
