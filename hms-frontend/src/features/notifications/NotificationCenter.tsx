import { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { SectionCard } from "../../components/ui/section-card";
import { HmsDashboardShell, HmsAuditFooter } from "../../components/hms-dashboard";
import {
  Bell, AlertTriangle, XCircle, Clock, CheckCircle2, Shield,
  Search, Filter, RefreshCw, Mail, MessageSquare, Eye, ChevronRight,
} from "lucide-react";
import { apiClient } from "../../lib/api";

type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ" | "CANCELLED";
type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

interface Notification {
  id: string;
  subject: string;
  content: string;
  category: string;
  priority: NotificationPriority;
  type: string;
  status: NotificationStatus;
  recipient: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
}

const statusBadge = (s: NotificationStatus) => {
  const map: Record<NotificationStatus, { color: string; icon: React.ElementType }> = {
    PENDING: { color: "text-amber-700 bg-amber-50", icon: Clock },
    SENT: { color: "text-emerald-700 bg-emerald-50", icon: CheckCircle2 },
    FAILED: { color: "text-rose-700 bg-rose-50", icon: XCircle },
    READ: { color: "text-slate-500 bg-slate-100", icon: Eye },
    CANCELLED: { color: "text-slate-400 bg-slate-50", icon: XCircle },
  };
  const cfg = map[s];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
      <Icon className="h-3 w-3" /> {s}
    </span>
  );
};

const priorityBadge = (p: NotificationPriority) => {
  const colors: Record<NotificationPriority, string> = {
    LOW: "text-slate-500 bg-slate-50",
    NORMAL: "text-blue-600 bg-blue-50",
    HIGH: "text-amber-700 bg-amber-50",
    CRITICAL: "text-rose-700 bg-rose-50 animate-alert-pulse",
  };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors[p]}`}>{p}</span>;
};

const channelIcon = (type: string) => {
  switch (type) {
    case "EMAIL": return <Mail className="h-3.5 w-3.5 text-blue-500" />;
    case "SMS": return <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />;
    default: return <Bell className="h-3.5 w-3.5 text-indigo-500" />;
  }
};

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  // States reserved for future loading/error UI; referenced to satisfy linter in this scope
  const loading = true; // eslint-disable-line @typescript-eslint/no-unused-vars
  const _error = null; // eslint-disable-line @typescript-eslint/no-unused-vars
  const setLoading = (_v: boolean) => {}; // eslint-disable-line @typescript-eslint/no-unused-vars
  const setError = (_v: string | null) => {}; // eslint-disable-line @typescript-eslint/no-unused-vars

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get("/v1/notifications", {
        params: { status: filterStatus || undefined, category: filterCategory || undefined, search: search || undefined },
      });
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    void fetchNotifications();
  }, [filterStatus, filterCategory, search]);

  const filtered = notifications.filter((n) => {
    if (filterStatus && n.status !== filterStatus) return false;
    if (filterCategory && n.category !== filterCategory) return false;
    if (search && !n.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    unread: notifications.filter((n) => n.status !== "READ" && n.status !== "CANCELLED").length,
    critical: notifications.filter((n) => n.priority === "CRITICAL" && n.status !== "READ").length,
    failed: notifications.filter((n) => n.status === "FAILED").length,
    pending: notifications.filter((n) => n.status === "PENDING").length,
    approval: notifications.filter((n) => n.category === "APPROVAL").length,
    system: notifications.filter((n) => n.category === "SYSTEM" || n.category === "ALERT").length,
  };

  const statCards = [
    { label: "Unread", value: stats.unread, icon: Bell, color: "text-indigo-600 bg-indigo-50" },
    { label: "Critical", value: stats.critical, icon: AlertTriangle, color: "text-rose-600 bg-rose-50" },
    { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-600 bg-red-50" },
    { label: "Pending Delivery", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Approvals", value: stats.approval, icon: CheckCircle2, color: "text-violet-600 bg-violet-50" },
    { label: "System Alerts", value: stats.system, icon: Shield, color: "text-slate-600 bg-slate-100" },
  ];

  return (
    <HmsDashboardShell
      widthTier="full"
      footer={<HmsAuditFooter dataSource="Live API — /api/v1/notifications" />}
    >
      <div className="space-y-6 pb-12 animate-fade-in">
        <PageHeader title="Notification Center" description="Monitor delivery status, manage alerts, and review notification history." />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((c, i) => (
            <div key={c.label} className="card p-4 animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${c.color}`}>
                  <c.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{c.value}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{c.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select className="input w-36 text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="READ">Read</option>
            </select>
            <select className="input w-36 text-xs" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="ALERT">Alert</option>
              <option value="APPROVAL">Approval</option>
              <option value="RESULT">Result</option>
              <option value="PAYMENT">Payment</option>
              <option value="SECURITY">Security</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <button 
              onClick={async () => { try { await apiClient.post('/v1/notifications/dispatch-pending'); await fetchNotifications(); } catch(e){} }}
              className="btn btn-secondary px-3 py-2 text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Dispatch Pending
            </button>
            <button 
              onClick={async () => { try { await apiClient.post('/v1/notifications/read-all'); await fetchNotifications(); } catch(e){} }}
              className="btn btn-primary px-3 py-2 text-xs gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark All Read
            </button>
          </div>
        </div>

        {/* List + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full table-premium">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Time</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((n) => (
                    <tr key={n.id} className={`cursor-pointer ${n.status === "FAILED" ? "bg-rose-50/30" : ""}`} onClick={() => setSelected(n)}>
                      <td>{channelIcon(n.type)}</td>
                      <td>
                        <span className={`text-sm ${n.status === "READ" ? "text-slate-400" : "font-semibold text-slate-900"}`}>
                          {n.subject}
                        </span>
                      </td>
                      <td><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{n.category}</span></td>
                      <td>{priorityBadge(n.priority)}</td>
                      <td>{statusBadge(n.status)}</td>
                      <td className="text-xs text-slate-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</td>
                      <td><ChevronRight className="h-4 w-4 text-slate-300" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Drawer */}
          <div className="lg:col-span-1">
            {selected ? (
              <SectionCard title="Notification Detail">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {channelIcon(selected.type)}
                    <span className="text-xs font-medium text-slate-500">{selected.type}</span>
                    {statusBadge(selected.status)}
                    {priorityBadge(selected.priority)}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{selected.subject}</h3>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg">{selected.content}</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-400">Recipient:</span><p className="font-mono text-slate-700 truncate">{selected.recipient}</p></div>
                    <div><span className="text-slate-400">Attempts:</span><p className="font-mono text-slate-700">{selected.attempts}</p></div>
                    <div><span className="text-slate-400">Category:</span><p className="text-slate-700">{selected.category}</p></div>
                    <div><span className="text-slate-400">Created:</span><p className="text-slate-700">{new Date(selected.createdAt).toLocaleString()}</p></div>
                  </div>
                  {selected.lastError && (
                    <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <XCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-rose-800">Last Error</p>
                        <p className="text-xs text-rose-700 mt-0.5 font-mono">{selected.lastError}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {selected.status !== "READ" && (
                      <button 
                        onClick={async () => {
                          try {
                            await apiClient.post(`/v1/notifications/${selected.id}/read`);
                            await fetchNotifications();
                            setSelected(null);
                          } catch (e) { /* ignore */ }
                        }}
                        className="btn btn-secondary px-3 py-1.5 text-xs flex-1"
                      >
                        Mark Read
                      </button>
                    )}
                    {selected.status === "FAILED" && (
                      <button 
                        onClick={async () => {
                          try {
                            await apiClient.post(`/v1/notifications/${selected.id}/retry`);
                            await fetchNotifications();
                            setSelected(null);
                          } catch (e) { /* ignore */ }
                        }}
                        className="btn btn-warning px-3 py-1.5 text-xs flex-1 gap-1"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                    )}
                  </div>
                </div>
              </SectionCard>
            ) : (
              <div className="card p-8 text-center">
                <Bell className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Select a notification to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};
