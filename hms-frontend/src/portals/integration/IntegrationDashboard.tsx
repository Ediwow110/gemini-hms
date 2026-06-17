import React from 'react';
import {
  Bell, ShieldCheck, AlertTriangle, Users, Package,
  TrendingUp, Activity, Zap, ArrowRight, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import IntegrationShellNotice from './components/IntegrationShellNotice';
import IntegrationScopeFilter from './components/IntegrationScopeFilter';
import CrossDomainContextCard from './components/CrossDomainContextCard';
import NotificationInbox from './components/NotificationInbox';
import ApprovalQueuePanel from './components/ApprovalQueuePanel';
import ActivityAuditEventTable from './components/ActivityAuditEventTable';
import { useIntegrationNotifications, useIntegrationApprovals, useIntegrationActivityAudit, useIntegrationReconciliation } from '../../hooks/use-integration';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton } from '../../components/hms-dashboard';

export const IntegrationDashboard: React.FC = () => {
  const { data: notifications, isLoading: notifLoading } = useIntegrationNotifications();
  const { data: approvals, isLoading: apprLoading, error: apprError } = useIntegrationApprovals();
  const { data: audits, isLoading: auditLoading } = useIntegrationActivityAudit();
  const { data: issues, isLoading: recLoading } = useIntegrationReconciliation();

  const navigate = useNavigate();

  const isLoading = notifLoading || apprLoading || auditLoading || recLoading;

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Integration Bridges Command Center"
          description="Cross-domain monitoring, notifications, and activity oversight"
          actions={<IntegrationScopeFilter />}
        />

        <IntegrationShellNotice />

      {/* Alert Strip: Integration Link Failures */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <div>
            <span className="text-[12px] font-bold text-rose-900 block">HL7 ADAPTER ALERT: CENTRAL LIS LINK DOWN</span>
            <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">Connection to central Lab Information System (LIS) timed out. Auto-failover is retrying the sync adapter.</span>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-md px-2.5 py-1 cursor-pointer transition-colors"
        >
          Force HL7 Reconnect
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {isLoading ? (
          <div className="col-span-12">
            <HmsLoadingSkeleton variant="kpi" />
          </div>
        ) : (
          <>
            {/* KPI Metrics Row 1 */}
            <div className="col-span-12 sm:col-span-6 xl:col-span-3">
              <CrossDomainContextCard title="Notifications Pending" value={notifications?.length.toString() || "0"} source="All Portals" icon={Bell} color="bg-indigo-50 text-indigo-600" isMock={notifications?.[0]?.isMock} />
            </div>
            <div className="col-span-12 sm:col-span-6 xl:col-span-3">
              <CrossDomainContextCard title="Approvals Pending" value={approvals?.length.toString() || "0"} source="Cross-Domain" icon={ShieldCheck} color="bg-emerald-50 text-emerald-600" isMock={approvals?.[0]?.isMock} />
            </div>
            <div className="col-span-12 sm:col-span-6 xl:col-span-3">
              <CrossDomainContextCard title="Activity Events" value={audits?.length.toString() || "0"} source="Audit Trail" icon={AlertTriangle} color="bg-rose-50 text-rose-600" isMock={audits?.[0]?.isMock} />
            </div>
            <div className="col-span-12 sm:col-span-6 xl:col-span-3">
              <CrossDomainContextCard title="Patient Timeline Events" value="—" source="Clinical" icon={Users} color="bg-blue-50 text-blue-600" isMock />
            </div>

            {/* KPI Metrics Row 2 */}
            <div className="col-span-12 sm:col-span-6 xl:col-span-3">
              <CrossDomainContextCard title="Asset Timeline Events" value="—" source="Marketplace" icon={Package} color="bg-violet-50 text-violet-600" isMock />
            </div>
            <div className="col-span-12 sm:col-span-6 xl:col-span-3">
              <CrossDomainContextCard title="Reconciliation Issues" value={issues?.length.toString() || "0"} source="Finance" icon={TrendingUp} color="bg-amber-50 text-amber-600" isMock={issues?.[0]?.isMock} />
            </div>
            <div className="col-span-12 sm:col-span-6 xl:col-span-3">
              <CrossDomainContextCard title="Recent Cross Activity" value="—" source="All" icon={Activity} color="bg-indigo-50 text-indigo-600" isMock />
            </div>
            <div className="col-span-12 sm:col-span-6 xl:col-span-3">
              <CrossDomainContextCard title="Integration Health" value="—" source="System" icon={TrendingUp} color="bg-emerald-50 text-emerald-600" isMock />
            </div>
          </>
        )}

        {/* Primary Work Row: Notifications & Approvals (XL Card) + Cross-Domain Health (L Card) */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <NotificationInbox />
          <ApprovalQueuePanel approvals={approvals} isLoading={apprLoading} error={apprError} />
        </div>

        <div className="col-span-12 xl:col-span-4 flex flex-col">
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-6 shadow-xl flex-grow flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cross-Domain Health (Mock)</p>
              <p className="text-3xl font-black tracking-tight">98.2%</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">All bridges operational</p>
            </div>
            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              Standard secure routing pathways for FHIR resources and HL7 pipelines are active. Health monitoring detects zero frame loss in sync logs.
            </p>
            <button
              onClick={() => navigate('/integration/activity-audit')}
              className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              View Audit Trail <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Secondary Insight Row: Activity Audit Event Table (Full-Width Card) */}
        <div className="col-span-12">
          <ActivityAuditEventTable />
        </div>

        {/* Bottom Supporting Row: Quick Actions (Full-Width Card) */}
        <div className="col-span-12 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button onClick={() => navigate('/integration/notifications')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group cursor-pointer">
              <Bell className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Notifications</span>
            </button>
            <button onClick={() => navigate('/integration/approvals')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group cursor-pointer">
              <ShieldCheck className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Approvals</span>
            </button>
            <button onClick={() => navigate('/integration/global-search')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group cursor-pointer">
              <BarChart3 className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Global Search</span>
            </button>
            <button onClick={() => navigate('/integration/patient-timeline')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group cursor-pointer">
              <Users className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Patient Timeline</span>
            </button>
            <button onClick={() => navigate('/integration/reconciliation')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group cursor-pointer">
              <TrendingUp className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Reconciliation</span>
            </button>
            <button onClick={() => navigate('/integration/activity-audit')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group cursor-pointer">
              <Activity className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Activity Audit</span>
            </button>
          </div>
        </div>
      </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default IntegrationDashboard;
