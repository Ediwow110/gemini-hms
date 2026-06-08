import React from 'react';
import { Search, History } from 'lucide-react';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import MaintenanceChecklistPanel from './components/MaintenanceChecklistPanel';
import { useFieldServicePreventiveMaintenance } from '../../hooks/use-field-service';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';

export const PreventiveMaintenancePage: React.FC = () => {
  const { data: jobs, isLoading } = useFieldServicePreventiveMaintenance();

  return (
    <HmsDashboardShell>
      <div className="space-y-6">
        <HmsPageHeader
          title="Preventive Maintenance"
          description="Scheduled service visits and calibration management"
          badge="Sandbox"
        />

        <FieldServiceShellNotice />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search PM job queue..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium" />
            </div>

            {isLoading ? (
              <HmsLoadingSkeleton variant="panel" rows={2} />
            ) : !jobs || jobs.length === 0 ? (
              <HmsEmptyState title="No PM jobs" description="No preventive maintenance jobs." />
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <History className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">Job: {job.id}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{job.asset.model} &middot; {job.asset.location}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-indigo-700 transition-colors">
                    Open PM Log (Shell)
                  </button>
                </div>
              ))
            )}
          </div>
          <aside>
            <MaintenanceChecklistPanel />
          </aside>
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default PreventiveMaintenancePage;
