import React from 'react';
import { Link } from 'react-router-dom';
import { Construction, ArrowRight, ListChecks } from 'lucide-react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const SuperAdminDashboard: React.FC = () => {
  return (
    <HmsDashboardShell
      widthTier="full"
      footer={
        <HmsAuditFooter dataSource="Not implemented in this release" />
      }
    >
      <HmsPageHeader
        title="Platform Command Center"
        description="Multi-tenant operations, security posture, system health, and drilldown-ready governance signals."
        badge="Not Available"
      />

      <div className="max-w-3xl mx-auto py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-100 rounded-2xl">
              <Construction
                className="h-7 w-7 text-slate-500"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
                Not yet implemented in this release
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                The platform-wide command center is reserved for a future
                release. There are no live KPIs, charts, drilldowns, or
                insights on this page. The data previously shown here was
                mock-generated and has been removed.
              </p>

              <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Live operational data is available now
                </p>
                <p className="mt-1 text-xs text-indigo-800 leading-relaxed">
                  For the live admin executive dashboard (patient volume trend,
                  revenue trend, KPI strip), open{' '}
                  <Link
                    to="/admin/executive"
                    className="font-bold underline decoration-indigo-400 hover:decoration-indigo-700"
                  >
                    Admin Executive
                  </Link>
                  . Tenant / branch / user / role / audit data is also live
                  from the left sidebar.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <ListChecks
                    className="h-4 w-4 text-slate-500"
                    aria-hidden="true"
                  />
                  Planned functionality
                </div>
                <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                  <li>Tenant growth and active-user trend (live, per-tenant)</li>
                  <li>Security event severity breakdown (live, from audit log)</li>
                  <li>API latency and database pressure trend (live, from probes)</li>
                  <li>Branch / department load heatmap (live, from queue + clinical)</li>
                  <li>Tenant health drilldown table (live, from branches + users)</li>
                </ul>
              </div>

              <div className="mt-6 flex gap-3">
                <Link
                  to="/admin/executive"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs font-bold hover:bg-indigo-700"
                >
                  Open Live Admin Executive
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default SuperAdminDashboard;
