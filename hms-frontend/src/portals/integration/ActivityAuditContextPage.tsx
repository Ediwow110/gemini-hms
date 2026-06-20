import React from 'react';
import { Activity, Shield, AlertTriangle, FileText } from 'lucide-react';
import IntegrationShellNotice from './components/IntegrationShellNotice';
import ActivityAuditEventTable from './components/ActivityAuditEventTable';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const ActivityAuditContextPage: React.FC = () => {
  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Activity & Audit Context"
          description="Live audit trail from /v1/integration/activity-audit (JWT-scoped, role-aware)"
        />

        <IntegrationShellNotice />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Events (24h)</p>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {/* Derived from live data: using total events as a proxy for 24h since global aggregate API is unavailable */}
              {/* In a real scenario, this would be a separate endpoint */}
              {/*- a simple proxy for now: just use a placeholder since the API doesn't provide a 24h count */}
              —
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High Risk</p>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {/* Not yet available from API as an aggregate count */}
              —
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Events</p>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {/* Not yet available from API as an aggregate count */}
              —
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-4">
          <FileText className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            disabled
            readOnly
            aria-disabled="true"
            title="Filter is not wired — use /audit-logs for full audit search in this release"
            placeholder="Filter not available here — events below are live from the audit log feed"
            className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed"
          />
        </div>

        <ActivityAuditEventTable />

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900">Audit Log Visibility</p>
            <p className="text-[10px] text-amber-700 font-medium mt-0.5">Events in the table are live audit-log records scoped to your JWT tenant/branch permissions. Aggregate KPI counts (24h, high-risk) are not yet implemented. Patient and supplier portals cannot access this staff audit feed.</p>
          </div>
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default ActivityAuditContextPage;
