import React from 'react';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import IntegrationShellNotice from './components/IntegrationShellNotice';
import ApprovalQueuePanel from './components/ApprovalQueuePanel';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';
import { useIntegrationApprovals } from '../../hooks/use-integration';

export const ApprovalCenterPage: React.FC = () => {
  const { data: approvals, isLoading, error } = useIntegrationApprovals();

  const pendingCount = approvals?.filter(a => a.status === 'PENDING').length ?? 0;
  const approvedCount = approvals?.filter(a => a.status === 'APPROVED' || a.status === 'APPLIED').length ?? 0;
  const rejectedCount = approvals?.filter(a => a.status === 'REJECTED').length ?? 0;
  const criticalCount = approvals?.filter(a => a.riskLevel === 'CRITICAL').length ?? 0;

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Approval Center"
          description="Cross-domain approval queue with role-aware filtering"
          badge="Sandbox"
        />

        <IntegrationShellNotice />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{isLoading ? '...' : pendingCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{isLoading ? '...' : approvedCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejected</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{isLoading ? '...' : rejectedCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Risk</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{isLoading ? '...' : criticalCount}</p>
          </div>
        </div>

        <ApprovalQueuePanel approvals={approvals} isLoading={isLoading} error={error} />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default ApprovalCenterPage;
