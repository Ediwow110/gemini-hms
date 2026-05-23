import React from 'react';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import ListingApprovalQueue from './components/ListingApprovalQueue';

export const ListingApprovalPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Listing Approval</h2>
        <p className="text-xs text-slate-500 font-medium">Review and approve new marketplace listings from suppliers</p>
      </div>

      <MarketplaceAdminShellNotice />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending (Mock)</p>
          <p className="text-2xl font-black text-amber-600">12</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved (Mock)</p>
          <p className="text-2xl font-black text-emerald-600">84</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejected (Mock)</p>
          <p className="text-2xl font-black text-rose-600">7</p>
        </div>
      </div>

      <ListingApprovalQueue />
    </div>
  );
};

export default ListingApprovalPage;
