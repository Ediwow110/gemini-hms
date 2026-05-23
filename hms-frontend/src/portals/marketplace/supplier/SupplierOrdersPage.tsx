import React from 'react';
import SupplierShellNotice from './components/SupplierShellNotice';
import SupplierOrderQueue from './components/SupplierOrderQueue';

export const SupplierOrdersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Order Management</h2>
        <p className="text-xs text-slate-500 font-medium">Confirmed purchase orders awaiting fulfillment</p>
      </div>

      <SupplierShellNotice />

      <SupplierOrderQueue />
    </div>
  );
};

export default SupplierOrdersPage;
