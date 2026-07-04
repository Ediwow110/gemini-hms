import { PlusCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { ReportExportButton } from "../../components/analytics/ReportExportButton";
import { StatusBadge } from "../../components/ui/status-badge";
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from "../../components/hms-dashboard";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/api";

interface PatientRow {
  id: string;
  patientNumber?: string;
  firstName: string;
  lastName: string;
  status?: string;
}

export const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchPatients = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/v1/patients", {
        params: q ? { search: q } : undefined,
      });
      setPatients(res.data || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = e?.response?.data?.message || e?.message || "Failed to load patients.";
      setError(msg);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPatients();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    // Simple immediate fetch for minimal change (debounce can be follow-up)
    void fetchPatients(val);
  };

  if (loading) {
    return (
      <HmsDashboardShell widthTier="full" footer={<HmsAuditFooter dataSource="Live API — /api/v1/patients" />}>
        <HmsLoadingSkeleton />
      </HmsDashboardShell>
    );
  }

  return (
    <HmsDashboardShell
      widthTier="full"
      footer={<HmsAuditFooter dataSource="Live API — /api/v1/patients" />}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <PageHeader title="Patients" description="Manage and view all registered patients." />
          <div className="flex gap-2">
            <ReportExportButton label="Export patient CSV" sensitive requiresReason />
            <button onClick={() => navigate('/patients/new')} className="btn btn-primary flex items-center gap-2 px-5 py-2.5">
              <PlusCircle className="h-4 w-4" />
              Register Patient
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="card p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or patient number..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            {error} <button onClick={() => fetchPatients(search)} className="underline ml-2">Retry</button>
          </div>
        )}

        <div className="card overflow-hidden">
          {patients.length === 0 ? (
            <HmsEmptyState title="No patients found" description="Try a different search or register a new patient." />
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Number</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => {
                  const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
                  const initials = fullName.split(/\s+/).map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "?";
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/patients/${p.id}`)}
                      className="hover:bg-indigo-50/30 transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-slate-500" title={p.id}>{p.id.length > 8 ? `${p.id.slice(0, 8)}\u2026` : p.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:from-indigo-100 group-hover:to-violet-100 group-hover:text-indigo-700 transition-all duration-200">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{fullName || "(unnamed)"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm font-mono">
                        {p.patientNumber || p.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <StatusBadge status={p.status || "Active"} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </HmsDashboardShell>
  );
};
