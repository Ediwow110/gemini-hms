import React from "react";
import { Wrench } from "lucide-react";
import FieldServiceShellNotice from "./components/FieldServiceShellNotice";
import InstallationChecklist from "./components/InstallationChecklist";
import InstallationJobsAdminView from "./components/InstallationJobsAdminView";
import { useFieldServiceInstallations, useUpdateInstallationStatus } from "../../hooks/use-field-service";
import { useUser } from "../../hooks/use-user";
import { HmsPageHeader } from "../../components/hms-page";
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from "../../components/hms-dashboard";

export const InstallationJobsPage: React.FC = () => {
  const user = useUser();
  const isAdmin = !!user && (user.roles.includes("Super Admin") || user.roles.includes("Branch Admin"));
  const { data: jobs, isLoading, error } = useFieldServiceInstallations();
  const { mutate: updateStatus, isPending: mutating } = useUpdateInstallationStatus();

  const handleStartJob = (id: string) => {
    updateStatus({ id, status: "IN_PROGRESS" });
  };

  return (
    <HmsDashboardShell>
      <div className="space-y-6">
        <HmsPageHeader
          title="Installation Jobs"
          description="Monitor equipment setup and facility commissioning tasks"
        />

        <FieldServiceShellNotice />

        {isAdmin ? (
          <InstallationJobsAdminView />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {isLoading ? (
                <HmsLoadingSkeleton variant="panel" rows={3} />
              ) : error ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center">
                  <p className="text-rose-500 text-sm font-bold uppercase tracking-widest">Failed to load installation jobs.</p>
                </div>
              ) : !jobs || jobs.length === 0 ? (
                <HmsEmptyState title="No installation jobs" description="No installation jobs found." />
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Wrench className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Job: {job.id.substring(0, 8)}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{job.asset.model} &middot; {job.asset.serialNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tight ${
                        job.status === "ASSIGNED" ? "bg-amber-100 text-amber-700" :
                        job.status === "IN_PROGRESS" ? "bg-indigo-100 text-indigo-700" :
                        job.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {job.status}
                      </span>
                      {job.status === "ASSIGNED" && (
                        <button
                          onClick={() => handleStartJob(job.id)}
                          disabled={mutating}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-black transition-colors disabled:opacity-50"
                        >
                          {mutating ? "Starting..." : "Start Job"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <aside>
              <InstallationChecklist />
            </aside>
          </div>
        )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default InstallationJobsPage;
