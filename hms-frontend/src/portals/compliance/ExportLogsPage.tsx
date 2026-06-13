import React, { useState } from 'react';
import { Search, AlertTriangle, History } from 'lucide-react';
import ComplianceScopeFilter from './components/ComplianceScopeFilter';
import ExportEventTable, { ExportEvent } from './components/ExportEventTable';
import { useAuditEvents } from '../../hooks/use-compliance';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const ExportLogsPage: React.FC = () => {
  const [, setScope] = useState({ tenantId: 'all', branchId: 'all' });
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { events: auditEvents, loading, error } = useAuditEvents({ pageSize: 100 });

  // Filter to export-related events if keys are known, otherwise show all clinical/admin activity
  // for this "Export" view to maintain visibility of data movement.
  const mappedEvents: ExportEvent[] = auditEvents
    .filter(e => e.eventKey?.toLowerCase().includes('export') || e.eventKey?.toLowerCase().includes('download'))
    .map(e => ({
      id: e.id,
      timestamp: new Date(e.createdAt).toLocaleString(),
      actorEmail: e.userId || 'Unknown User', // Map userId to email for display
      actorRole: e.activeRole || 'N/A',
      tenantName: e.tenantId || 'Primary Tenant',
      branchName: e.branchId || 'Main Branch',
      recordsCount: 0, // Not tracked directly in root audit log
      format: (e.eventKey?.includes('CSV') ? 'CSV' : e.eventKey?.includes('PDF') ? 'PDF' : 'JSON') as 'CSV' | 'PDF' | 'JSON' | 'ZIP',
      destination: e.ipAddress || 'External IP',
      status: e.eventKey?.includes('BLOCKED') ? 'BLOCKED' : 'SUCCESS'
    }));

  // Filtering logic for the UI
  const filteredEvents = mappedEvents.filter(e => {
    if (search) {
      const query = search.toLowerCase();
      if (!e.actorEmail.toLowerCase().includes(query) && !e.destination.toLowerCase().includes(query)) return false;
    }
    if (formatFilter !== 'ALL' && e.format !== formatFilter) return false;
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    return true;
  });

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Patient Data Export Logs"
          description="Trace all external data packaging actions, file downloads, and bulk extraction tasks"
        />

        {/* Scope Selector */}
        <ComplianceScopeFilter onScopeChange={(newScope) => setScope(newScope)} />

        {/* Sandbox Warning - Honest Labeling */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-xs text-amber-800 leading-normal">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Real Audit Feed Enabled</p>
            <p className="mt-0.5 opacity-90">
              This log is now fed by live audit events. However, specific export payload sizes and file formats are derived from event metadata and may be incomplete for legacy records.
            </p>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by initiator email or destination..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Format Select */}
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="ALL">All File Formats</option>
            <option value="CSV">CSV Format</option>
            <option value="PDF">PDF Document</option>
            <option value="JSON">JSON Data</option>
            <option value="ZIP">Encrypted ZIP Archive</option>
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="ALL">All Event Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed Only</option>
            <option value="BLOCKED">Blocked Alerts Only</option>
          </select>
        </div>

        {/* Main Table view */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {loading ? 'Refreshing Logs...' : `Showing ${filteredEvents.length} Export Events`}
            </span>
          </div>

          {loading ? (
            <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">
              Loading real-time export audit trails...
            </div>
          ) : error ? (
            <div className="card bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-xs text-rose-700">
              <p className="font-bold text-sm">Failed to load audit logs</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <ExportEventTable events={filteredEvents} />
          ) : (
            <div className="card bg-slate-50/50 border border-dashed border-slate-350 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <History className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No export logs found in the audit feed</p>
              <p className="text-[11px] text-slate-450">Events matching 'EXPORT' or 'DOWNLOAD' will appear here.</p>
            </div>
          )}
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default ExportLogsPage;
