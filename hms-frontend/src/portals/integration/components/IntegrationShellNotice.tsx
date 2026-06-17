import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const IntegrationShellNotice: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
      <div className="p-2 bg-amber-100 rounded-xl">
        <ShieldAlert className="h-5 w-5 text-amber-600" />
      </div>
      <div>
        <h4 className="text-sm font-black text-amber-900 tracking-tight">Integration Bridges — Mixed Availability</h4>
        <p className="text-xs text-amber-700 font-medium leading-relaxed mt-0.5">
          This portal is in a transitional state. <span className="font-bold">Billing approvals and basic event listings are live-wired to the HMS backend.</span> However, advanced cross-domain aggregation, global search indexing, and automated reconciliation remain functional prototypes. Please refer to individual page badges for the current state of specific features.
        </p>
      </div>
    </div>
  );
};

export default IntegrationShellNotice;
