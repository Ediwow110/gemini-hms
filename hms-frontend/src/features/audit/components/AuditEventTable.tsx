import React from 'react';
import { AuditLogEntry } from '../../../services/compliance.service';
import { History, CheckCircle2 } from 'lucide-react';

interface AuditEventTableProps {
  events: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  showActor?: boolean;
  showChainInfo?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRowClick?: (event: AuditLogEntry) => void;
}

export const AuditEventTable: React.FC<AuditEventTableProps> = ({
  events, total, page, pageSize, loading, showActor = true, showChainInfo = false,
  onPageChange, onPageSizeChange, onRowClick,
}) => {
  const totalPages = Math.ceil(total / pageSize);

  const getEventLabel = (key: string): string => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getRecordLabel = (type: string): string => {
    const map: Record<string, string> = {
      Payment: 'Payment', Invoice: 'Invoice', PaymentReversal: 'Reversal',
      CashierSession: 'Session', Receipt: 'Receipt', Patient: 'Patient',
      Encounter: 'Encounter', LabResult: 'Lab Result', User: 'User',
      ApprovalRequest: 'Approval', Prescription: 'Prescription',
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-10 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center">
        <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No audit events found</p>
        <p className="text-xs text-slate-400 mt-1">Adjust your filters or try a different date range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Event ID</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                {showActor && <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Actor / Role</th>}
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Event</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Record</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">IP / UA</th>
                {showChainInfo && <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Chain</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((e) => (
                <tr
                  key={e.id}
                  className={`hover:bg-indigo-50/10 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(e)}
                >
                  <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                    <span title={e.id}>{e.id.length > 8 ? `${e.id.slice(0, 8)}\u2026` : e.id}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  {showActor && (
                    <td className="px-5 py-4 whitespace-nowrap text-xs">
                      <p className="font-bold text-slate-800">{e.userId?.substring(0, 8)}...</p>
                      {e.activeRole && <p className="text-[10px] text-slate-400 font-medium">{e.activeRole}</p>}
                    </td>
                  )}
                  <td className="px-5 py-4 text-xs">
                    <span className="font-mono font-bold text-slate-700">{getEventLabel(e.eventKey)}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-xs">
                    <p className="font-semibold text-slate-700">{getRecordLabel(e.recordType)}</p>
                    <p className="text-[10px] font-mono text-slate-400">{e.recordId?.substring(0, 8)}...</p>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                    {e.ipAddress || '—'}
                  </td>
                  {showChainInfo && (
                    <td className="px-5 py-4 whitespace-nowrap text-xs">
                      {e.hash ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-[10px] font-mono text-slate-400">{e.hash.substring(0, 8)}...</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{total} event{total !== 1 ? 's' : ''} found</span>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 font-medium hover:bg-white"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Prev
            </button>
            <span className="font-mono">Page {page} of {totalPages || 1}</span>
            <button
              className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 font-medium hover:bg-white"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>
            <select
              className="ml-2 text-xs border border-slate-200 rounded px-2 py-1"
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditEventTable;
