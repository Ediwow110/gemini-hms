import React from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import BuyerActivityTable from './components/BuyerActivityTable';

export const BuyerManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Buyer Management</h2>
          <p className="text-xs text-slate-500 font-medium">Customer directory, verification status, and activity monitoring</p>
        </div>
      </div>

      <MarketplaceAdminShellNotice />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search by organization or ID..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Buyers (Mock)</p>
          <p className="text-2xl font-black text-slate-900">142</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified (Mock)</p>
          <p className="text-2xl font-black text-emerald-600">138</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Restricted (Mock)</p>
          <p className="text-2xl font-black text-rose-600">4</p>
        </div>
      </div>

      <BuyerActivityTable />

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-900">Risk / Verification Placeholder</p>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">Buyer verification, KYC status, and risk scoring are UI placeholders. No real verification or restriction mutations are performed in this phase.</p>
        </div>
      </div>
    </div>
  );
};

export default BuyerManagementPage;
