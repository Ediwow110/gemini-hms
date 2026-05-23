import React, { useState } from 'react';
import { Database, AlertTriangle, Cpu, HardDrive } from 'lucide-react';
import { RetentionJobCard, RetentionJob } from './components/RetentionJobCard';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';

export const RetentionManagementPage: React.FC = () => {
  const [scope, setScope] = useState({ tenantId: 'all', branchId: 'all' });
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
    },
    {
      id: "RET-103",
      policyName: "Temporary Patient Intake Queue Records",
      description: "Prune active triage tickets and intake forms. Operational requirement: 1 year maximum.",
      retentionPeriodYears: 1,
      targetCategory: "Triage & Queue Metadata",
      lastRun: "2026-05-20 01:00:00",
      nextRun: "2026-05-22 01:00:00",
      status: "IDLE",
      recordsProcessed: 98,
      tenantName: "MediClinics Group",
      branchName: "MediClinics Central"
    }
  ]);

  const handleTriggerDryRun = (id: string) => {
    // Notify dry-run start
    setJobs(prev => prev.map(j => {
      if (j.id === id) {
        return { ...j, status: 'RUNNING' };
      }
      return j;
    }));
  };

  // Filter jobs based on selected tenant/branch scopes
  const filteredJobs = jobs.filter(j => {
    if (scope.tenantId !== 'all') {
      const matchTenant = scope.tenantId === 'TEN-001' ? 'St. Jude Hospital Network' : scope.tenantId === 'TEN-002' ? 'MediClinics Group' : 'Apex Healthcare Services';
      if (j.tenantName !== matchTenant) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Data Retention & Archive Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">Configure automated database clean-up rules, set PHI retention timelines, and trigger policy dry-runs</p>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[10px] text-amber-800 leading-normal max-w-md">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Sandbox Safety Rule:</strong> Database pruning and storage optimization tools execute solely in sandbox mode. No real delete or delete-cascade commands are dispatched to database structures.
          </p>
        </div>
      </div>

      {/* Scope Selector */}
      <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

      {/* Storage stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Total Scanned Records</p>
            <p className="text-xl font-extrabold text-slate-850 tracking-tight font-mono">1,735 Records</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-xl">
            <Database className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Simulated Savings</p>
            <p className="text-xl font-extrabold text-indigo-650 tracking-tight font-mono">41.8 MB Free</p>
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
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Data Pruning Policies</h3>
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
  );
};

export default RetentionManagementPage;
