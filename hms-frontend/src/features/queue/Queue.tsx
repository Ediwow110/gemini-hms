import { useState } from "react";
import { StatusBadge } from "../../components/ui/status-badge";
import { PageHeader } from "../../components/ui/page-header";
import { Clock, UserCheck, CheckCircle2, SkipForward, Plus, Megaphone } from "lucide-react";
import { RequirePermission } from "../../components/ui/RequirePermission";

const QUEUE_STATS = [
  { label: "Waiting", val: "12", icon: Clock, color: "from-amber-500 to-orange-500 shadow-amber-200/50" },
  { label: "Called", val: "3", icon: UserCheck, color: "from-indigo-500 to-violet-500 shadow-indigo-200/50" },
  { label: "Served", val: "42", icon: CheckCircle2, color: "from-emerald-500 to-teal-500 shadow-emerald-200/50" },
  { label: "Skipped", val: "2", icon: SkipForward, color: "from-slate-400 to-slate-500 shadow-slate-200/50" },
];

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
      alert("No patients waiting in queue.");
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
    <div className="space-y-6 animate-fade-in">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 text-white px-6 py-3.5 rounded-xl shadow-xl font-semibold text-sm animate-fade-in border border-indigo-500/30 flex items-center gap-2">
          <Megaphone className="h-4 w-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <PageHeader title="Queue Monitor" description="Real-time patient queue status and progress." />
        <div className="flex gap-3">
          <RequirePermission permission="queue.manage">
            <button onClick={handleCallNext} className="btn btn-primary flex items-center gap-2 shadow-md shadow-indigo-200">
              <Megaphone className="h-4 w-4" />
              Call Next
            </button>
          </RequirePermission>
          <RequirePermission permission="queue.manage">
            <button onClick={handleJoinQueue} className="btn btn-secondary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add to Queue
            </button>
          </RequirePermission>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUEUE_STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`card-hover p-5 text-center animate-slide-up stagger-${i + 1}`}>
              <div className={`mx-auto w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} shadow-md flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.val}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
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
  );
};
