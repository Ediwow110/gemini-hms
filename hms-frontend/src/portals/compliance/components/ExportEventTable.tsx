import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface ExportEvent {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: string;
  tenantName: string;
  branchName: string;
  recordsCount: number;
  format: 'CSV' | 'PDF' | 'JSON' | 'ZIP';
  destination: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
}

interface ExportEventTableProps {
  events: ExportEvent[];
}

export const ExportEventTable: React.FC<ExportEventTableProps> = ({ events }) => {
  return (
    <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Initiator</th>
              <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant / Branch</th>
              <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Payload Size</th>
              <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Format</th>
              <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</th>
              <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {events.map((e) => (
              <tr key={e.id} className={`hover:bg-indigo-50/10 ${e.status === 'BLOCKED' ? 'bg-rose-50/10' : ''}`}>
                <td className="px-6 py-4 font-mono text-slate-500">{e.timestamp}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-bold text-slate-800">{e.actorEmail}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{e.actorRole}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">
                  <p>{e.tenantName}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{e.branchName}</p>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700">
                  {e.recordsCount} Patient Records
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 border text-slate-700 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                    {e.format}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 font-mono font-medium">{e.destination}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <StatusBadge 
                      status={e.status} 
                      type={e.status === 'SUCCESS' ? 'success' : e.status === 'FAILED' ? 'warning' : 'danger'} 
                    />
                    {e.status === 'BLOCKED' && (
                      <AlertTriangle className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ExportEventTable;
