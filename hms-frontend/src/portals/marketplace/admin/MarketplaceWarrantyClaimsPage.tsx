import React from 'react';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import WarrantyClaimReviewPanel from './components/WarrantyClaimReviewPanel';

export const MarketplaceWarrantyClaimsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Warranty Claims</h2>
        <p className="text-xs text-slate-500 font-medium">Review warranty claims across all marketplace suppliers and buyers</p>
      </div>

      <MarketplaceAdminShellNotice />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Claims (Mock)</p>
          <p className="text-2xl font-black text-amber-600">8</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Under Review (Mock)</p>
          <p className="text-2xl font-black text-blue-600">3</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved (Mock)</p>
          <p className="text-2xl font-black text-emerald-600">24</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Denied (Mock)</p>
          <p className="text-2xl font-black text-rose-600">6</p>
        </div>
      </div>

      <WarrantyClaimReviewPanel />
    </div>
  );
};

export default MarketplaceWarrantyClaimsPage;
