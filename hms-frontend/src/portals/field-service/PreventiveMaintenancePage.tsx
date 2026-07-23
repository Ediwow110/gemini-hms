import React from 'react';
import { Search, History } from 'lucide-react';
import { useUser } from '../../hooks/use-user';
import { useFieldServiceMaintenanceSLA } from '../../hooks/use-field-service';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import MaintenanceChecklistPanel from './components/MaintenanceChecklistPanel';
import { useFieldServicePreventiveMaintenance } from '../../hooks/use-field-service';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';

export const PreventiveMaintenancePage: React.FC = () => {
  const user = useUser();
  const { data: slaData } = useFieldServiceMaintenanceSLA();
  const { data: jobs, isLoading } = useFieldServicePreventiveMaintenance();
  const isAdmin = Boolean(
    user?.permissions.includes('field_service.job.assign'),
  );

  return (
    <HmsDashboardShell>
      <div className="space-y-6">
        <HmsPageHeader
          title="Preventive Maintenance"
          description={isAdmin ? "Maintenance SLA Compliance & Queue Metrics" : "Scheduled service visits and calibration management"}
          badge={isAdmin ? "Admin" : "Sandbox"}
        />

        <FieldServiceShellNotice />

        {isAdmin ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Asset ID</th>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Model</th>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">SLA Status</th>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Next Due</th>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Priority</th>
                    <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slaData?.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{row.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{row.model}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${row.sla === 'Compliant' ? 'bg-emerald-50 text-emerald-600' : row.sla === 'At Risk' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                          {row.sla}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{row.nextDue}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{row.priority}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{row.compliance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <aside className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Queue Metrics</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Active Jobs', value: '24', color: 'text-indigo-600' },
                    { label: 'Pending Review', value: '7', color: 'text-amber-600' },
                    { label: 'SLA Breaches', value: '2', color: 'text-rose-600' },
                  ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-600">{stat.label}</span>
                      <span className={`text-sm font-black ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : (
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
        )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default PreventiveMaintenancePage;
