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
  const { data: approvals, isLoading: apprLoading } = useIntegrationApprovals();
  const { data: audits, isLoading: auditLoading } = useIntegrationActivityAudit();
  const { data: issues, isLoading: recLoading } = useIntegrationReconciliation();

  const navigate = useNavigate();

  const isLoading = notifLoading || apprLoading || auditLoading || recLoading;

  return (
    <HmsDashboardShell>
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Integration Bridges Command Center"
          description="Cross-domain monitoring, notifications, and activity oversight"
          actions={<IntegrationScopeFilter />}
        />

        <IntegrationShellNotice />

        {isLoading ? (
          <HmsLoadingSkeleton variant="kpi" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CrossDomainContextCard title="Notifications Pending" value={notifications?.length.toString() || "0"} source="All Portals" icon={Bell} color="bg-indigo-50 text-indigo-600" isMock={notifications?.[0]?.isMock} />
              <CrossDomainContextCard title="Approvals Pending" value={approvals?.length.toString() || "0"} source="Cross-Domain" icon={ShieldCheck} color="bg-emerald-50 text-emerald-600" isMock={approvals?.[0]?.isMock || true} />
              <CrossDomainContextCard title="Activity Events" value={audits?.length.toString() || "0"} source="Audit Trail" icon={AlertTriangle} color="bg-rose-50 text-rose-600" isMock={audits?.[0]?.isMock} />
              <CrossDomainContextCard title="Patient Timeline Events" value="28" source="Clinical" icon={Users} color="bg-blue-50 text-blue-600" isMock />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CrossDomainContextCard title="Asset Timeline Events" value="15" source="Marketplace" icon={Package} color="bg-violet-50 text-violet-600" isMock />
              <CrossDomainContextCard title="Reconciliation Issues" value={issues?.length.toString() || "0"} source="Finance" icon={TrendingUp} color="bg-amber-50 text-amber-600" isMock={issues?.[0]?.isMock} />
              <CrossDomainContextCard title="Recent Cross Activity" value="47" source="All" icon={Activity} color="bg-indigo-50 text-indigo-600" isMock />
              <CrossDomainContextCard title="Integration Health" value="98.2%" source="System" icon={TrendingUp} color="bg-emerald-50 text-emerald-600" isMock />
            </div>
          </>
        )}

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button onClick={() => navigate('/integration/notifications')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
              <Bell className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Notifications</span>
            </button>
            <button onClick={() => navigate('/integration/approvals')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
              <ShieldCheck className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Approvals</span>
            </button>
            <button onClick={() => navigate('/integration/global-search')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
              <BarChart3 className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Global Search</span>
            </button>
            <button onClick={() => navigate('/integration/patient-timeline')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
              <Users className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Patient Timeline</span>
            </button>
            <button onClick={() => navigate('/integration/reconciliation')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
              <TrendingUp className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Reconciliation</span>
            </button>
            <button onClick={() => navigate('/integration/activity-audit')} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
              <Activity className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-2" />
              <span className="text-[10px] font-black text-slate-600 uppercase">Activity Audit</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <NotificationInbox />
            <ApprovalQueuePanel />
            <ActivityAuditEventTable />
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-6 shadow-xl">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cross-Domain Health (Mock)</p>
                <p className="text-3xl font-black tracking-tight">98.2%</p>
                <p className="text-[10px] text-emerald-400 font-bold uppercase mt-1">All bridges operational</p>
              </div>
              <button
                onClick={() => navigate('/integration/activity-audit')}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2"
              >
                View Audit Trail <ArrowRight className="h-4 w-4" />
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
