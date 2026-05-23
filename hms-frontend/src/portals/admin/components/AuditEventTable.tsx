import React from 'react';
import { History, CheckCircle2 } from 'lucide-react';

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  ipAddress: string;
  tenant: string;
  branch: string;
  hash: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface AuditEventTableProps {
  events: AuditEvent[];
}

export const AuditEventTable: React.FC<AuditEventTableProps> = ({ events }) => {
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border border-rose-100 font-extrabold';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border border-amber-100 font-extrabold';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200 font-semibold';
    }
  };

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Operator / Role</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Action Event</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Context Scope</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">IP / Network</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Chain Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-indigo-50/10 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                    {e.timestamp}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-xs">
                    <p className="font-bold text-slate-800">{e.actor}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{e.role}</p>
                  </td>
                  <td className="px-5 py-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${getRiskBadge(e.risk)}`}>
                        {e.risk}
                      </span>
                      <span className="font-mono font-bold text-slate-700">{e.action}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-xs">
                    <p className="font-semibold text-slate-700">{e.tenant}</p>
                    <p className="text-[10px] text-slate-400">{e.branch}</p>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                    {e.ipAddress}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        {e.hash.substring(0, 8)}...
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit Readiness Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2 font-medium">
          <History className="h-4.5 w-4.5 text-slate-400" />
          <span>HMS System-wide Audit Log: Events are cryptographically chained and cannot be modified or deleted.</span>
        </div>
      </div>
    </div>
  );
};
export default AuditEventTable;
