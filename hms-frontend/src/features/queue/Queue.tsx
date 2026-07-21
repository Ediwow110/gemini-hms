import { useState } from "react";
import { StatusBadge } from "../../components/ui/status-badge";
import { PageHeader } from "../../components/ui/page-header";
import { Clock, UserCheck, CheckCircle2, SkipForward, Plus, Megaphone, Search, X } from "lucide-react";
import { RequirePermission } from "../../components/ui/RequirePermission";
import { HmsDashboardShell, HmsToolbar, HmsAuditFooter } from "../../components/hms-dashboard";
import { useQueue } from "../../hooks/use-queue";
import { useUser } from "../../hooks/use-user";
import { apiClient } from "../../lib/api";
import type { AxiosError } from "axios";

interface PatientSearchResult {
  id: string;
  firstName: string;
  lastName: string;
}

export const Queue = () => {
  const user = useUser();
  const branchId = user?.branchId;
  const { queue, stats, isLoading, error, joinQueue, callNext, isUpdating } = useQueue(branchId ?? '');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<PatientSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState("GENERAL");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const handleSearchPatients = async () => {
    if (!searchQuery) return;
    setSearchError(null);
    try {
      const res = await apiClient.get(`/v1/patients/search?q=${searchQuery}`);
      setPatients(res.data);
    } catch (e) {
      const err = e as AxiosError;
      const msg = err.response?.status === 404
        ? 'Patient search is not available (endpoint not implemented)'
        : err.message || 'Search failed';
      setSearchError(msg);
      setPatients([]);
    }
  };

  const handleJoinQueue = async () => {
    if (!selectedPatient) return;
    setJoinError(null);
    try {
      await joinQueue({
        patientId: selectedPatient,
        serviceType: selectedService,
        category: 'REGULAR',
        branchId: branchId!,
      });
      setIsModalOpen(false);
      setSelectedPatient(null);
      setSearchQuery("");
    } catch {
      setJoinError("Failed to join queue. Please try again.");
    }
  };

  const handleCallNext = async () => {
    setCallError(null);
    try {
      await callNext("GENERAL");
    } catch (e) {
      const err = e as AxiosError<{ message?: string }>;
      setCallError(err.response?.data?.message || "No patients waiting");
    }
  };

  if (!branchId) {
    return <div className="p-10 text-center text-slate-500">No primary branch assigned to your account.</div>;
  }

  const derivedStats = [
    { label: "Waiting", val: stats?.waiting?.toString() || '0', icon: Clock, color: "from-amber-500 to-orange-500 shadow-amber-200/50" },
    { label: "Calling", val: stats?.calling?.toString() || '0', icon: UserCheck, color: "from-indigo-500 to-violet-500 shadow-indigo-200/50" },
    { label: "Served", val: stats?.served?.toString() || '0', icon: CheckCircle2, color: "from-emerald-500 to-teal-500 shadow-emerald-200/50" },
    { label: "Skipped", val: stats?.skipped?.toString() || '0', icon: SkipForward, color: "from-slate-400 to-slate-500 shadow-slate-200/50" },
  ];

  return (
    <HmsDashboardShell
      toolbar={<HmsToolbar role="Queue Manager" />}
      footer={<HmsAuditFooter dataSource="Live API (Queue entries)" />}
    >
      <div className="flex justify-between items-center bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <PageHeader title="Queue Monitor" description="Real-time patient queue status and progress." />
        <div className="flex items-center gap-4">
          <RequirePermission permission="queue.manage">
            <button
              onClick={handleCallNext}
              disabled={isUpdating}
              className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-extrabold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-250/50 flex items-center gap-2 cursor-pointer border-0 disabled:opacity-50"
            >
              <Megaphone className="h-4 w-4" />
              {isUpdating ? 'Calling...' : 'Call Next'}
            </button>
          </RequirePermission>
          <RequirePermission permission="queue.manage">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add to Queue
            </button>
          </RequirePermission>
        </div>
      </div>
      
      {(joinError || callError) && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700" role="alert">
          {joinError || callError}
        </div>
      )}
      
      {isLoading ? (
        <div className="p-20 text-center text-slate-400">Loading live queue data...</div>
      ) : error ? (
        <div className="p-20 text-center text-rose-500 font-bold">Error loading queue: {error instanceof Error ? error.message : 'Unknown error'}</div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {derivedStats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`col-span-12 sm:col-span-6 xl:col-span-3 card-hover p-5 text-center animate-slide-up stagger-${i + 1}`}>
                <div className={`mx-auto w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} shadow-md flex items-center justify-center mb-3`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.val}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            );
          })}

          <div className="col-span-12 card overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Wait Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue && queue.length > 0 ? (
                  queue.map(q => {
                    const initials = q.patientName?.split(" ").map(n => n[0]).join("") || "??";
                    return (
                      <tr key={q.id} className="hover:bg-indigo-50/30 transition-colors duration-150 cursor-pointer group">
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-slate-500" title={q.id}>{q.id.length > 8 ? `${q.id.slice(0, 8)}\u2026` : q.id}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-600">{q.queueNumber}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:from-indigo-100 group-hover:to-violet-100 group-hover:text-indigo-700 transition-all duration-200">
                              {initials}
                            </div>
                            <span className="font-semibold text-slate-900">{q.patientName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{q.serviceType}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <StatusBadge status={q.status} />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                          {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">
                      No patients currently in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add to Queue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full animate-slide-up border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Add Patient to Queue</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient by name or ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPatients()}
                />
                <button 
                  onClick={handleSearchPatients}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg"
                >
                  Search
                </button>
              </div>

              {searchError && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 font-bold text-rose-700 text-xs">
                  {searchError}
                </p>
              )}
              <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                {patients.length > 0 ? (
                  patients.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedPatient(p.id)}
                      className={`p-3 cursor-pointer transition-colors text-sm flex justify-between items-center ${selectedPatient === p.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <span className="font-medium">{p.firstName} {p.lastName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{p.id.substring(0, 8)}...</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">No patients found. Try searching.</div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Type</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="GENERAL">General Consultation</option>
                  <option value="LABORATORY">Laboratory</option>
                  <option value="CASHIER">Cashier/Billing</option>
                  <option value="DOCTOR">Specialist Doctor</option>
                  <option value="PHARMACY">Pharmacy</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary px-6">Cancel</button>
              <button 
                onClick={handleJoinQueue} 
                disabled={!selectedPatient || isUpdating}
                className="btn btn-primary px-6 disabled:opacity-50"
              >
                Join Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};
