import React, { useState, useMemo } from 'react';
import { Database, Cpu, HardDrive, ShieldAlert } from 'lucide-react';
import { RetentionJobCard, RetentionJob } from './components/RetentionJobCard';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';
import { useRetentionStatus } from '../../hooks/use-compliance';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const RetentionManagementPage: React.FC = () => {
  const [scope, setScope] = useState({ tenantId: 'all', branchId: 'all' });
  const { status: retentionData, loading } = useRetentionStatus();

  // Policies remain mock until a Policy Management API is implemented
  const [jobs, setJobs] = useState<RetentionJob[]>([
    {
      id: "RET-101",
      policyName: "Clinical EMR SOAP Notes Policy",
      description: "Retain clinical SOAP notes and consultation history logs. Legal requirement: 10 years minimum.",
      retentionPeriodYears: 10,
      targetCategory: "Clinical EMR Data",
      lastRun: "2026-05-01 02:00:00",
      nextRun: "2026-06-01 02:00:00",
      status: "IDLE",
      recordsProcessed: 1205,
      tenantName: "St. Jude Hospital Network",
      branchName: "All Branches"
    },
    {
      id: "RET-102",
      policyName: "Financial Billing Ledger Policy",
      description: "Prune or archive invoice drafts, cashier transaction ledger notes. Tax/Audit requirement: 7 years minimum.",
      retentionPeriodYears: 7,
      targetCategory: "Financial Ledger Records",
      lastRun: "2026-05-15 03:30:00",
      nextRun: "2026-06-15 03:30:00",
      status: "IDLE",
      recordsProcessed: 432,
      tenantName: "St. Jude Hospital Network",
      branchName: "St. Jude Metro"
    }
  ]);

  const handleTriggerDryRun = (id: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        return { ...j, status: 'RUNNING' };
      }
      return j;
    }));
  };

  // Aggregate real stats from the backend
  const stats = useMemo(() => {
    if (!retentionData) return { totalScanned: 0, archived: 0 };
    const values = Object.values(retentionData) as { active: number; archived: number }[];
    const total = values.reduce((acc, curr) => acc + curr.active + curr.archived, 0);
    const archived = values.reduce((acc, curr) => acc + curr.archived, 0);
    return { totalScanned: total, archived };
  }, [retentionData]);

  // Filter jobs based on selected tenant/branch scopes
  const filteredJobs = jobs.filter(j => {
    if (scope.tenantId !== 'all') {
      const matchTenant = scope.tenantId === 'TEN-001' ? 'St. Jude Hospital Network' : scope.tenantId === 'TEN-002' ? 'MediClinics Group' : 'Apex Healthcare Services';
      if (j.tenantName !== matchTenant) return false;
    }
    return true;
  });

  return (
    <HmsDashboardShell>
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Data Retention & Archive Management"
          description="Configure automated database clean-up rules, set PHI retention timelines, and trigger policy dry-runs"
        />

        {/* Scope Selector */}
        <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

        {/* Honest Labeling Banner */}
        <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-2xl flex gap-3 text-xs text-indigo-900 leading-normal">
          <Database className="h-5 w-5 text-indigo-600 flex-shrink-0" />
          <div>
            <p className="font-bold uppercase tracking-tight">Backend Connectivity Enabled</p>
            <p className="mt-0.5 opacity-90">
              Retention statistics are now derived from the live database. Policy management and enforcement execution remain in simulation mode until the Governance API is finalized.
            </p>
          </div>
        </div>

        {/* Storage stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Total Scanned Records</p>
              <p className="text-xl font-extrabold text-slate-850 tracking-tight font-mono">
                {loading ? '...' : stats.totalScanned.toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-xl">
              <Database className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Archived Records</p>
              <p className="text-xl font-extrabold text-indigo-650 tracking-tight font-mono">
                {loading ? '...' : stats.archived.toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-xl">
              <HardDrive className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Active Policy Rules</p>
              <p className="text-xl font-extrabold text-slate-850 tracking-tight font-mono">{filteredJobs.length} Configured</p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-xl">
              <Cpu className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Data Pruning Policies (Simulated)</h3>
            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase">Sandbox Mode</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <RetentionJobCard
                key={job.id}
                job={job}
                onTriggerDryRun={handleTriggerDryRun}
              />
            ))}
          </div>
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default RetentionManagementPage;
