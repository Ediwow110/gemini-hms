import React from 'react';
import SupplierShellNotice from './components/SupplierShellNotice';
import WarrantyClaimPanel from './components/WarrantyClaimPanel';

export const SupplierWarrantyClaimsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Warranty & Returns</h2>
        <p className="text-xs text-slate-500 font-medium">Manage support requests and equipment failure claims</p>
      </div>

      <SupplierShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <WarrantyClaimPanel />
        </div>
        <aside className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
           <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Resolution SLA</h4>
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Critical Issues</span>
                <span className="text-xs font-black text-rose-600">4 Hrs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Standard Repairs</span>
                <span className="text-xs font-black text-slate-800">48 Hrs</span>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default SupplierWarrantyClaimsPage;
