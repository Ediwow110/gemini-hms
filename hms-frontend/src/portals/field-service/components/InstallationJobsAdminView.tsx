import React, { useState, useEffect } from "react";
import { Wrench, AlertCircle } from "lucide-react";
import { fieldServiceService, InstallationJobDto } from "../../../services/field-service.service";
import { HmsLoadingSkeleton, HmsEmptyState } from "../../../components/hms-dashboard";

export const InstallationJobsAdminView: React.FC = () => {
  const [jobs, setJobs] = useState<InstallationJobDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await fieldServiceService.getInstallations();
      setJobs(data);
      setError(null);
    } catch {
      setError("Failed to load installation jobs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpdateStatus = async (id: string, status: InstallationJobDto["status"]) => {
    setUpdatingId(id);
    setMutationError(null);
    try {
      await fieldServiceService.updateInstallationStatus(id, status);
      await fetchJobs();
    } catch (updateError) {
      const apiError = updateError as { response?: { data?: { message?: string } }; message?: string };
      setMutationError(apiError.response?.data?.message || apiError.message || "Failed to update installation status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Installation Management</h3>
      </div>

      {mutationError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
          {mutationError}
        </div>
      )}

      {isLoading ? (
        <HmsLoadingSkeleton variant="table" rows={5} />
      ) : error ? (
        <div className="p-12 text-center bg-white border border-rose-100 rounded-3xl text-rose-500 flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <HmsEmptyState title="No installation jobs" description="No active installations found." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Job ID / Asset</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch / Technician</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Job: {job.id.substring(0, 8)}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{job.asset.model} &middot; {job.asset.serialNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-600">{job.asset.salesOrder?.quote?.rfq?.branch?.name || "Selected branch"}</p>
                    <p className="text-[10px] font-medium text-slate-400">{job.assignedUser?.email || "Unassigned"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase border ${
                      job.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      job.status === "IN_PROGRESS" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                      "bg-amber-100 text-amber-700 border-amber-200"
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={job.status}
                      onChange={(e) => handleUpdateStatus(job.id, e.target.value as InstallationJobDto["status"])}
                      disabled={updatingId === job.id}
                      className="bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMMISSIONED">Commissioned</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InstallationJobsAdminView;
