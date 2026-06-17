import React from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import IntegrationShellNotice from './components/IntegrationShellNotice';
import ReconciliationIssueCard from './components/ReconciliationIssueCard';
import { useIntegrationReconciliation } from '../../hooks/use-integration';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';

export const ReconciliationMonitorPage: React.FC = () => {
  const { data: issues, isLoading, error } = useIntegrationReconciliation();
  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Reconciliation Monitor"
          description="Cross-domain mismatch detection and resolution tracking"
        />

        <IntegrationShellNotice />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Issues</p>
            </div>
            <p className="text-2xl font-black text-slate-900">{issues?.length || 0}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Under Review</p>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {issues?.filter(i => i.status === 'UNDER_REVIEW').length || 0}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolved</p>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {issues?.filter(i => i.status === 'RESOLVED').length || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-full">
              <HmsLoadingSkeleton />
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm font-bold text-rose-500 col-span-full">
              {(error as { response?: { status: number } })?.response?.status === 401 || (error as { response?: { status: number } })?.response?.status === 403 
                ? 'Unauthorized to view reconciliation issues.' 
                : 'Failed to load reconciliation issues.'}
            </div>
          ) : !issues || issues.length === 0 ? (
            <div className="col-span-full">
              <HmsEmptyState title="No issues found" description="No reconciliation issues found." />
            </div>
          ) : (
            issues.map((issue) => (
              <ReconciliationIssueCard 
                key={issue.id}
                id={issue.id} 
                domainPair={issue.domainPair} 
                severity={issue.severity} 
                category={issue.category} 
                suggestedResolution={issue.suggestedResolution || "Manual review required"} 
                isMock={issue.isMock}
              />
            ))
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900">No Automatic Mutation</p>
            <p className="text-[10px] text-amber-700 font-medium mt-0.5">Reconciliation issues are UI placeholders. No automatic mutation, self-healing, or real reconciliation is performed in this phase. Mark reviewed is a shell action only.</p>
          </div>
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default ReconciliationMonitorPage;
