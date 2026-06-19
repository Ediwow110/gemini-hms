import { useState } from "react";
import { StatusBadge } from "../../components/ui/status-badge";
import { PageHeader } from "../../components/ui/page-header";
import { Clock, UserCheck, CheckCircle2, SkipForward, Plus, Megaphone } from "lucide-react";
import { RequirePermission } from "../../components/ui/RequirePermission";
import { HmsDashboardShell, HmsToolbar, HmsAuditFooter } from "../../components/hms-dashboard";

interface QueueEntry {
  num: string;
  name: string;
  service: string;
  status: string;
  time: string;
}

interface ToastNotification {
  message: string;
  id: number;
}

export const Queue = () => {
  const [queue, setQueue] = useState<QueueEntry[]>([
    { num: "Q001", name: "John Doe", service: "CBC", status: "Waiting", time: "10 mins" },
    { num: "Q002", name: "Jane Smith", service: "X-Ray", status: "Calling", time: "2 mins" },
  ]);

  const waitingCount = queue.filter(q => q.status.toUpperCase() === "WAITING").length;
  const callingCount = queue.filter(q => q.status.toUpperCase() === "CALLING").length;
  const servedCount = 42;
  const skippedCount = 2;

  const derivedStats = [
    { label: "Waiting", val: waitingCount.toString(), icon: Clock, color: "from-amber-500 to-orange-500 shadow-amber-200/50" },
    { label: "Calling", val: callingCount.toString(), icon: UserCheck, color: "from-indigo-500 to-violet-500 shadow-indigo-200/50" },
    { label: "Served", val: servedCount.toString(), icon: CheckCircle2, color: "from-emerald-500 to-teal-500 shadow-emerald-200/50" },
    { label: "Skipped", val: skippedCount.toString(), icon: SkipForward, color: "from-slate-400 to-slate-500 shadow-slate-200/50" },
  ];
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = (message: string) => {
    setToast({ message, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCallNext = () => {
    const updated = [...queue];
    const nextIdx = updated.findIndex(q => q.status.toUpperCase() === "WAITING");
    if (nextIdx !== -1) {
      const p = updated[nextIdx];
      p.status = "Calling";
      setQueue(updated);
      showToast(`Now calling: ${p.num} - ${p.name}`);
    } else {
      showToast("No patients waiting in queue.");
    }
  };

  const handleJoinQueue = () => {
    // In real app, calls POST /api/v1/queue/join
    setQueue([...queue, { 
      num: `Q00${queue.length + 1}`, 
      name: "Walk-in Patient", 
      service: "General", 
      status: "Waiting", 
      time: "0 mins" 
    }]);
  };

  return (
    <HmsDashboardShell
      toolbar={<HmsToolbar role="Queue Manager" />}
      footer={<HmsAuditFooter dataSource="Queue state (local demo - backend sync pending)" />}
    >
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 text-white px-6 py-3.5 rounded-xl shadow-xl font-semibold text-sm animate-fade-in border border-indigo-500/30 flex items-center gap-2">
          <Megaphone className="h-4 w-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <PageHeader title="Queue Monitor" description="Real-time patient queue status and progress." />
        <div className="flex items-center gap-4">
          <RequirePermission permission="queue.manage">
            <button
              onClick={handleCallNext}
              className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-extrabold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-250/50 flex items-center gap-2 cursor-pointer border-0"
            >
              <Megaphone className="h-4 w-4" />
              Call Next
            </button>
          </RequirePermission>
          <RequirePermission permission="queue.manage">
            <button
              onClick={handleJoinQueue}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add to Queue
            </button>
          </RequirePermission>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        {/* KPI metrics - 4 S-size Cards (3 cols desktop, 6 tablet, 12 mobile) */}
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

        {/* Queue Monitor Table (Full-Width Card - 12 cols) */}
        <div className="col-span-12 card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Wait Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map(q => {
                const initials = q.name.split(" ").map(n => n[0]).join("");
                return (
                  <tr key={q.num} className="hover:bg-indigo-50/30 transition-colors duration-150 cursor-pointer group">
                    <td className="px-6 py-4 font-bold text-indigo-600">{q.num}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:from-indigo-100 group-hover:to-violet-100 group-hover:text-indigo-700 transition-all duration-200">
                          {initials}
                        </div>
                        <span className="font-semibold text-slate-900">{q.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{q.service}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <StatusBadge status={q.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">{q.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </HmsDashboardShell>
  );
};
