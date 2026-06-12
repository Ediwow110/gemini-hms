import React, { useState, useCallback } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import { AuditEventTable } from '../../features/audit/components/AuditEventTable';
import { useAuditEvents } from '../../hooks/use-compliance';
import { useNavigate } from 'react-router-dom';
import { complianceService, AuditLogEntry } from '../../services/compliance.service';
import { Search, Filter, RefreshCw, Download } from 'lucide-react';
import { downloadFile, objectsToCsv } from '../../lib/download';

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchText, setSearchText] = useState('');
  const [eventKeyFilter, setEventKeyFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const navigate = useNavigate();

  const { events, total, loading, error, refetch } = useAuditEvents({
    page, pageSize,
    eventKey: eventKeyFilter || undefined,
  });

  const handleRowClick = (event: AuditLogEntry) => {
    navigate(`/audit/events/${event.id}`);
  };

  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    setExporting(true);
    setExportError(null);
    setExportSuccess(false);
    try {
      const result = await complianceService.exportAuditEvents({
        eventKey: eventKeyFilter || undefined,
        format,
      });
      const timestamp = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        const csv = objectsToCsv(result.data as Record<string, unknown>[]);
        downloadFile(csv, `audit-export-${timestamp}.csv`, 'text/csv;charset=utf-8');
      } else {
        const json = JSON.stringify(result.data, null, 2);
        downloadFile(json, `audit-export-${timestamp}.json`, 'application/json;charset=utf-8');
      }
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      if (msg.includes('403') || msg.includes('Forbidden')) {
        setExportError('Export requires audit.export permission. Contact your administrator.');
      } else {
        setExportError(msg);
      }
    } finally {
      setExporting(false);
    }
  }, [eventKeyFilter]);

  return (
    <HmsDashboardShell widthTier="full"
      footer={<HmsAuditFooter dataSource="Real audit data" />}
    >
      <AdminShellNotice />
      <HmsPageHeader
        title="System Audit Trails"
        description="Trace cryptographically chained event activities, user operations, and resource changes."
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 mb-4">
          {error}
        </div>
      )}

      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" />
            Audit Filters
          </h4>
          <div className="flex items-center gap-2">
            {exportError && (
              <span className="text-[10px] text-rose-600 font-semibold">{exportError}</span>
            )}
            {exportSuccess && (
              <span className="text-[10px] text-emerald-600 font-semibold">Exported</span>
            )}
            <div className="relative group">
              <button
                disabled={exporting}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-3 w-3" />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
              {!exporting && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[140px] hidden group-hover:block z-10">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Download JSON
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={refetch}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Event Type</label>
            <select
              value={eventKeyFilter}
              onChange={(e) => setEventKeyFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">All Events</option>
              <option value="PATIENT_REGISTERED">Patient Registration</option>
              <option value="PAYMENT_COMPLETED">Payment Completed</option>
              <option value="PAYMENT_VOIDED">Payment Voided</option>
              <option value="PAYMENT_REFUNDED">Payment Refunded</option>
              <option value="LOGIN_SUCCESS">Login</option>
              <option value="LOGIN_FAILED">Login Failed</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_ROLE_CHANGED">Role Changed</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Page Size</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="w-full p-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>

      <AuditEventTable
        events={events}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
        showActor
        showChainInfo
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onRowClick={handleRowClick}
      />
    </HmsDashboardShell>
  );
};

export default AuditLogsPage;
