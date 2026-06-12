import { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { useAuditEvents } from '../../hooks/use-compliance';
import { useNavigate } from 'react-router-dom';
import { AuditLogEntry } from '../../services/compliance.service';
import { History, Search, RefreshCw } from 'lucide-react';

export const AuditLogViewer = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  const { events, total, loading, error, refetch } = useAuditEvents({ page, pageSize });

  const filteredEvents = searchText
    ? events.filter(e =>
        e.eventKey.toLowerCase().includes(searchText.toLowerCase()) ||
        e.recordType.toLowerCase().includes(searchText.toLowerCase()) ||
        e.userId.toLowerCase().includes(searchText.toLowerCase())
      )
    : events;

  const getEventLabel = (key: string): string =>
    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const getRecordLabel = (type: string): string => {
    const map: Record<string, string> = {
      Payment: 'Payment', Invoice: 'Invoice', PaymentReversal: 'Reversal',
      CashierSession: 'Session', Receipt: 'Receipt', Patient: 'Patient',
      Encounter: 'Encounter', LabResult: 'Lab Result', User: 'User',
      ApprovalRequest: 'Approval', Prescription: 'Prescription',
    };
    return map[type] || type;
  };

  const handleRowClick = (event: AuditLogEntry) => {
    navigate(`/audit/events/${event.id}`);
  };

  const displayTotal = searchText ? filteredEvents.length : total;
  const totalLabel = searchText
    ? `${filteredEvents.length} shown (page-local filter)`
    : `${total} total`;
  const totalPages = Math.ceil(displayTotal / pageSize);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader title="Branch Audit Logs" description="Immutable event trail for system actions, security, and data changes." />

      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="relative group">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
                className="w-64 pl-9 pr-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            {searchText && (
              <div className="absolute left-0 top-full mt-1 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 whitespace-nowrap z-10 shadow-sm">
                Searches current page only — totals reflect page-local results
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <button
              onClick={refetch}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl" />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center">
            <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No audit events found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Record</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map((e) => (
                    <tr
                      key={e.id}
                      className="cursor-pointer hover:bg-indigo-50/30 transition-colors group"
                      onClick={() => handleRowClick(e)}
                    >
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {getEventLabel(e.eventKey)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="font-semibold text-slate-700">{getRecordLabel(e.recordType)}</span>
                        <span className="text-slate-400 ml-1 font-mono">({e.recordId?.substring(0, 8)}...)</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">
                        {e.ipAddress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{totalLabel}</span>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 font-medium hover:bg-white"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Prev
                </button>
                <span className="font-mono">Page {page} of {totalPages || 1}</span>
                <button
                  className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 font-medium hover:bg-white"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
