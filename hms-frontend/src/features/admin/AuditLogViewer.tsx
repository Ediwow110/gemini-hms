import { useState } from "react";
import { PageHeader } from "../../components/ui/page-header";
import { ApprovalRiskBadge } from "../../components/ui/approval-badges";

interface AuditEvent {
  id: string;
  createdAt: string;
  user: string;
  role: string;
  branch: string;
  module: string;
  action: string;
  recordType: string;
  recordId: string;
  reason: string;
  ipAddress: string;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
  oldValues?: string;
  newValues?: string;
}

const MOCK_LOGS: AuditEvent[] = [
  { id: "EVT-001", createdAt: "2026-05-09 10:00:23", user: "Mark Santos", role: "Cashier", branch: "Main", module: "Billing", action: "Payment Voided", recordType: "Receipt", recordId: "RCP-124", reason: "Wrong amount entered", ipAddress: "192.168.1.55", risk: "High", status: "Success", oldValues: '{"status": "Paid"}', newValues: '{"status": "Voided"}' },
  { id: "EVT-002", createdAt: "2026-05-09 10:15:45", user: "Dr. Smith", role: "Pathologist", branch: "Main", module: "Laboratory", action: "Result Amended", recordType: "LabResult", recordId: "LAB-311", reason: "Corrected WBC reference range", ipAddress: "192.168.1.102", risk: "Critical", status: "Success", oldValues: '{"wbc": "10.5"}', newValues: '{"wbc": "18.5"}' },
  { id: "EVT-003", createdAt: "2026-05-09 11:00:01", user: "Unknown", role: "System", branch: "Global", module: "Auth", action: "Login Failure", recordType: "User", recordId: "-", reason: "Invalid credentials", ipAddress: "203.0.113.42", risk: "Critical", status: "Failed" },
];

export const AuditLogViewer = () => {
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader title="Audit Logs" description="Immutable event trail for system actions, security, and data changes." />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {["Total Events (24h)", "High-Risk Actions", "Failed Logins", "Data Exports"].map((s, i) => (
          <div key={s} className={`card-hover p-5 text-center animate-slide-up stagger-${i + 1}`}>
            <div className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {i === 0 ? "1,245" : i === 1 ? "12" : i === 2 ? "3" : "8"}
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">{s}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">User & Role</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Action</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-center">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_LOGS.map(a => (
                <tr key={a.id} className="cursor-pointer hover:bg-indigo-50/30 transition-colors group" onClick={() => setSelected(a)}>
                  <td className="px-6 py-4 text-slate-600 font-mono text-xs">{a.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{a.user}</div>
                    <div className="text-xs text-slate-400">{a.role} · {a.branch}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{a.action}</div>
                    <div className="text-xs text-slate-500">{a.recordType}: {a.recordId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <ApprovalRiskBadge risk={a.risk} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-6 h-fit space-y-5">
          <h2 className="font-bold text-slate-900 border-b border-slate-100 pb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Audit Record Details</h2>
          {selected ? (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event ID</p>
                  <p className="text-sm font-semibold text-slate-900">{selected.id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IP Address</p>
                  <p className="text-sm font-semibold text-slate-900">{selected.ipAddress}</p>
                </div>
              </div>
              
              <hr className="border-slate-100" />
              
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason / Context</p>
                <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-100 text-sm font-medium">
                  {selected.reason}
                </div>
              </div>

              {selected.oldValues && selected.newValues && (
                <div className="space-y-3 pt-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Old Values</p>
                    <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-xs font-mono text-rose-800 break-all">
                      {selected.oldValues}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Values</p>
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs font-mono text-emerald-800 break-all">
                      {selected.newValues}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-slate-400 text-xl">🔍</span>
              </div>
              <p className="text-sm font-medium text-slate-500">Select an audit record to view detailed payload, before/after values, and IP context.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
