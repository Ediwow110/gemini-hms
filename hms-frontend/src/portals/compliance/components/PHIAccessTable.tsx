import React, { useState } from 'react';
import { AlertTriangle, Eye, FileSearch } from 'lucide-react';
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
  isDemo?: boolean;
}

const maskText = (text: string, type: 'name' | 'id') => {
  if (type === 'name') {
    return text
      .split(' ')
      .map((part) =>
        part.length <= 2
          ? `${part[0] ?? '*'}*`
          : `${part[0]}${'*'.repeat(part.length - 2)}${part[part.length - 1]}`,
      )
      .join(' ');
  }

  if (text.length <= 4) return '*'.repeat(text.length);
  return `${text.slice(0, 2)}${'*'.repeat(Math.max(3, text.length - 4))}${text.slice(-2)}`;
};

const AccessTypeBadge = ({ type }: { type: PHIAccessEvent['accessType'] }) => {
  if (type === 'UNAUTHORIZED') return <StatusBadge status={type} type="danger" />;
  if (type === 'EMERGENCY') return <StatusBadge status="EMERGENCY (BREAK-GLASS)" type="warning" />;
  return <StatusBadge status={type} type="success" />;
};

export const PHIAccessTable: React.FC<PHIAccessTableProps> = ({
  events,
  isDemo = false,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<PHIAccessEvent | null>(null);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['Timestamp', 'User / role', 'Patient (masked)', 'Tenant / branch', 'Access reason', 'Risk', ''].map((header) => (
                  <th key={header} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {events.map((event) => (
                <tr key={event.id} className={event.riskScore >= 70 ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50'}>
                  <td className="px-5 py-4 font-mono text-slate-500">{event.timestamp}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{event.actorName}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{event.actorRole}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-indigo-900">{maskText(event.patientName, 'name')}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">{maskText(event.patientId, 'id')}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <p className="font-medium">{event.tenantName || 'Current tenant'}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{event.branchName || 'Branch context unavailable'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <AccessTypeBadge type={event.accessType} />
                    <p className="mt-1 text-[10px] text-slate-500">{event.reason}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex min-w-10 justify-center rounded-lg border px-2 py-1 font-mono text-xs font-semibold ${event.riskScore >= 75 ? 'border-rose-200 bg-rose-100 text-rose-800' : event.riskScore >= 40 ? 'border-amber-200 bg-amber-100 text-amber-800' : 'border-emerald-200 bg-emerald-100 text-emerald-800'}`}>
                      {event.riskScore}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Eye className="h-3.5 w-3.5" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isDemo && (
          <div className="border-t border-sky-100 bg-sky-50 px-5 py-3 text-[10px] font-semibold text-sky-800">
            Synthetic PHI events contain no real patient or workforce information.
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="phi-event-title" className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex gap-3">
              <div className="h-fit rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-600">
                <FileSearch className="h-6 w-6" />
              </div>
              <div>
                <h3 id="phi-event-title" className="text-sm font-semibold text-slate-900">PHI access event</h3>
                <p className="mt-0.5 text-xs text-slate-500">Read-only audit context</p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Actor</dt>
                <dd className="mt-1 font-semibold text-slate-800">{selectedEvent.actorName}</dd>
                <dd className="text-[10px] text-slate-500">{selectedEvent.actorRole}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Patient</dt>
                <dd className="mt-1 font-semibold text-indigo-900">{maskText(selectedEvent.patientName, 'name')}</dd>
                <dd className="font-mono text-[10px] text-slate-500">{maskText(selectedEvent.patientId, 'id')}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Recorded reason</p>
              <p className="mt-1 text-xs font-medium text-slate-700">{selectedEvent.reason}</p>
            </div>

            {selectedEvent.riskScore >= 40 && (
              <div className="mt-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>This event should be reviewed in the dedicated compliance workflow.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="mt-5 w-full min-h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PHIAccessTable;
