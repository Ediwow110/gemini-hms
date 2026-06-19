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
          <span className="font-bold">Partial namespace implementation.</span>{' '}
          The <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">/v1/integration/*</code>{' '}
          namespace has <span className="font-bold">2 of 7</span> live endpoints
          backed by existing controllers:{' '}
          <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">/v1/integration/notifications</code>{' '}
          (re-uses <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">/v1/notifications</code>)
          and{' '}
          <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">/v1/integration/approvals</code>{' '}
          (re-uses <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">/v1/approvals</code>).
        </p>
        <p className="text-xs text-amber-800 font-medium leading-relaxed">
          <span className="font-bold">5 endpoints are shell placeholders (HTTP 200, empty arrays):</span>{' '}
          <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">activity-audit</code>,{' '}
          <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">global-search</code>,{' '}
          <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">patient-timeline</code>,{' '}
          <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">asset-timeline</code>,{' '}
          <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">reconciliation</code>.
          Routes exist and respond successfully, but return{' '}
          <code className="px-1 py-0.5 bg-amber-100 rounded text-[11px]">[]</code>{' '}
          until cross-domain sources are implemented (no reconciliation model,
          no asset model, no cross-domain search in this release).
        </p>
        <p className="text-xs text-amber-800 font-medium leading-relaxed">
          <span className="font-bold">What this page currently shows.</span>{' '}
          Counts on the dashboard cards reflect the live state for the 2
          wired endpoints and <span className="font-mono">—</span> + MOCK
          for the 5 shell-empty endpoints (not real zero metrics). The &quot;Cross-Domain Bridge
          Health&quot; card remains an explicit honest-stub (no live value
          is shown until a real provider integration is wired). Approvals
          that are part of the regular billing workflow remain live on
          the{' '}
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
