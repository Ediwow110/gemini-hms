import React from 'react';
import SupplierShellNotice from './components/SupplierShellNotice';
import RFQInboxTable from './components/RFQInboxTable';

export const SupplierRFQInboxPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">RFQ Inbox</h2>
        <p className="text-xs text-slate-500 font-medium">New multi-vendor price requests from healthcare facilities</p>
      </div>

      <SupplierShellNotice />

      <RFQInboxTable />
    </div>
  );
};

export default SupplierRFQInboxPage;
