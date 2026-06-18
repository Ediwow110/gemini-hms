import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const IntegrationShellNotice: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
      <div className="p-2 bg-amber-100 rounded-xl">
        <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0" />
      </div>
      <div className="space-y-1.5">
        <h4
          className="text-sm font-black text-amber-900 tracking-tight"
          data-testid="integration-shell-notice-heading"
        >
          Integration Bridges — Mixed Availability
        </h4>
        <p className="text-xs text-amber-800 font-medium leading-relaxed">
          <span className="font-bold">Prototype shell — no backend implementation yet.</span>{' '}
          The <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">/v1/integration/*</code>{' '}
          namespace is not implemented in the current backend release. All drill-down pages
          (Notifications, Approvals, Global Search, Patient Timeline, Asset Timeline,
          Reconciliation, Activity Audit) will return <span className="font-bold">HTTP 404</span>{' '}
          until that namespace is added.
        </p>
        <p className="text-xs text-amber-800 font-medium leading-relaxed">
          <span className="font-bold">What this page currently shows.</span>{' '}
          Counts on the dashboard cards below reflect the failed fetch state
          (<span className="font-mono">—</span> with a MOCK badge), not real data.
          The &quot;Cross-Domain Bridge Health&quot; card is an explicit honest-stub
          (it has never reported a live value). Approvals that are part of the
          regular billing workflow remain live on the{' '}
          <a
            href="/integration/approvals"
            className="font-bold underline hover:text-amber-900"
          >
            Approval Center
          </a>{' '}
          and{' '}
          <a
            href="/approvals"
            className="font-bold underline hover:text-amber-900"
          >
            /approvals
          </a>{' '}
          routes; this portal is the cross-domain bridge layer above them.
        </p>
      </div>
    </div>
  );
};

export default IntegrationShellNotice;
