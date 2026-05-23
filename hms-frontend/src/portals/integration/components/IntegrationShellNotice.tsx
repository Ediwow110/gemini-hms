import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const IntegrationShellNotice: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
      <div className="p-2 bg-amber-100 rounded-xl">
        <ShieldAlert className="h-5 w-5 text-amber-600" />
      </div>
      <div>
        <h4 className="text-sm font-black text-amber-900 tracking-tight">Integration Bridges Sandbox</h4>
        <p className="text-xs text-amber-700 font-medium leading-relaxed mt-0.5">
          This integration portal is a <strong>functional prototype shell</strong>. Notifications, approvals, search results, timelines, reconciliation, and audit events are mock-generated for demonstration purposes. No real cross-domain aggregation, notification delivery, approval mutation, search indexing, or audit mutation is performed in this phase.
        </p>
      </div>
    </div>
  );
};

export default IntegrationShellNotice;
