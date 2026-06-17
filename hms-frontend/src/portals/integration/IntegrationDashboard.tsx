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

        {/* Primary Work Row: Notifications & Approvals (XL Card) + Cross-Domain Health (Honest Unavailable Stub) */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <NotificationInbox />
          <ApprovalQueuePanel approvals={approvals} isLoading={apprLoading} error={apprError} />
        </div>

        <div className="col-span-12 xl:col-span-4 flex flex-col">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-700 space-y-3 shadow-sm flex-grow flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Cross-Domain Bridge Health
              </p>
              <p className="text-xl font-extrabold text-slate-800 tracking-tight" data-testid="integration-health-value">
                Not available
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                Real bridge health not yet implemented
              </p>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Live FHIR / HL7 bridge health monitoring is reserved for a future
              release. The page-level shell notice describes what is currently
              live. No health percentage is shown until the real provider
              integration is wired and verified.
            </p>
            <button
              onClick={() => navigate('/integration/activity-audit')}
              className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
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
