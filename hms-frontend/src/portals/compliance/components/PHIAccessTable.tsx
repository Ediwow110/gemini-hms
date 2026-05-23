import React, { useState } from 'react';
import { Eye, AlertTriangle, FileSearch } from 'lucide-react';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export interface PHIAccessEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  patientName: string;
  patientId: string;
  tenantName: string;
  branchName: string;
  accessType: 'EMERGENCY' | 'ROUTINE' | 'UNAUTHORIZED';
  reason: string;
  riskScore: number;
}

interface PHIAccessTableProps {
  events: PHIAccessEvent[];
}

export const PHIAccessTable: React.FC<PHIAccessTableProps> = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState<PHIAccessEvent | null>(null);

  // Helper to mask patient name/ID for demo compliance
  const maskText = (text: string, type: 'name' | 'id') => {
    if (type === 'name') {
      const parts = text.split(' ');
      return parts.map(p => {
        if (p.length <= 2) return p[0] + '*';
        return p[0] + '*'.repeat(p.length - 2) + p[p.length - 1];
      }).join(' ');
    } else {
      // Mask clinical IDs (e.g., PAT-12345 to P**-1**45)
      return text.substring(0, 2) + '*'.repeat(3) + '-' + '*'.repeat(3) + text.slice(-2);
    }
  };

  const getAccessTypeBadge = (type: string) => {
    switch (type) {
      case 'UNAUTHORIZED':
        return <StatusBadge status={type} type="danger" />;
      case 'EMERGENCY':
        return <StatusBadge status="EMERGENCY (BREAK-GLASS)" type="warning" />;
      default:
        return <StatusBadge status={type} type="success" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Card */}
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">User / Role</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient (Masked)</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant / Branch</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Access Reason</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Risk Score</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {events.map((e) => (
                <tr key={e.id} className={`hover:bg-indigo-50/10 ${e.riskScore >= 70 ? 'bg-rose-50/20' : ''}`}>
                  <td className="px-6 py-4 font-mono text-slate-500">{e.timestamp}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-800">{e.actorName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{e.actorRole}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-indigo-900">{maskText(e.patientName, 'name')}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {maskText(e.patientId, 'id')}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    <p>{e.tenantName}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{e.branchName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {getAccessTypeBadge(e.accessType)}
                      <p className="text-slate-500 font-medium">{e.reason}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
                      e.riskScore >= 75 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' 
                        : e.riskScore >= 40 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {e.riskScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedEvent(e)}
                      className="btn border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-indigo-500" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in relative">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit border border-indigo-100">
                <FileSearch className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                  Access Incident Audit
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Mock Investigation Panel</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4 my-2">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Actor</p>
                  <p className="font-bold text-slate-700">{selectedEvent.actorName}</p>
                  <p className="text-[10px] text-slate-500">{selectedEvent.actorRole}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Patient Target</p>
                  <p className="font-bold text-indigo-900">{maskText(selectedEvent.patientName, 'name')}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{maskText(selectedEvent.patientId, 'id')}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-700">Access Rationale & Headers</h5>
                <p className="bg-slate-50 border p-2.5 rounded-xl text-slate-500 font-medium">
                  {selectedEvent.reason}
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[11px] text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="font-medium">
                  <strong>Sandbox Notice:</strong> Raising flags, dispatching alerts to CISO, or triggering user lockout policies is simulated. No backend audit mutations or email alerts will be dispatched.
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button 
                onClick={() => {
                  alert("Audit Flag queued in sandbox memory.");
                  setSelectedEvent(null);
                }}
                className="w-full btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Flag for Verification
              </button>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-full btn border border-slate-200 hover:bg-slate-50 font-bold py-2 rounded-xl text-slate-700 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PHIAccessTable;
