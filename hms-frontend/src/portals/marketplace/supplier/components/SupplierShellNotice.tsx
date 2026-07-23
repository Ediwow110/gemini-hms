import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const SupplierShellNotice: React.FC = () => (
  <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
    <div className="shrink-0 rounded-xl bg-sky-100 p-2 text-sky-700">
      <ShieldAlert className="h-5 w-5" aria-hidden="true" />
    </div>
    <div>
      <h4 className="text-sm font-semibold text-sky-950">Mixed supplier data source</h4>
      <p className="mt-1 text-xs leading-5 text-sky-800">
        Order and RFQ panels request the connected supplier APIs. KPI totals, trend charts and settlement values are deterministic synthetic data for non-production layout review and are not payout instructions.
      </p>
    </div>
  </div>
);

export default SupplierShellNotice;
