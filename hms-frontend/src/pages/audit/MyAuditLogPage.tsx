import React, { useState, useCallback } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';
import { AuditEventTable } from '../../features/audit/components/AuditEventTable';
import { useMyAuditEvents } from '../../hooks/use-compliance';
import { useNavigate } from 'react-router-dom';
import { complianceService, AuditLogEntry } from '../../services/compliance.service';
import { Search, Download } from 'lucide-react';
import { downloadFile, objectsToCsv } from '../../lib/download';

export const MyAuditLogPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportTruncated, setExportTruncated] = useState(false);
  const [exportInfo, setExportInfo] = useState<{ exportedCount: number; totalAvailable: number } | null>(null);
  const navigate = useNavigate();

  const { events, total, loading, error, refetch } = useMyAuditEvents({ page, pageSize });

  const handleRowClick = (event: AuditLogEntry) => {
    navigate(`/audit/my-events/${event.id}`);
  };

  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    setExporting(true);
    setExportError(null);
    setExportSuccess(false);
    setExportTruncated(false);
    setExportInfo(null);
    try {
      const result = await complianceService.exportMyAuditEvents({
        format,
      });
      const timestamp = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        const csv = objectsToCsv(result.data as Record<string, unknown>[]);
        downloadFile(csv, `audit-export-self-${timestamp}.csv`, 'text/csv;charset=utf-8');
      } else {
        const json = JSON.stringify(result.data, null, 2);
        downloadFile(json, `audit-export-self-${timestamp}.json`, 'application/json;charset=utf-8');
      }
      setExportSuccess(true);
      setExportTruncated(result.truncated);
      setExportInfo({ exportedCount: result.exportedCount, totalAvailable: result.totalAvailable });
      if (!result.truncated) {
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      if (msg.includes('403') || msg.includes('Forbidden')) {
        setExportError('Self-export requires audit.self permission. Contact your administrator.');
      } else {
        setExportError(msg);
      }
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <HmsDashboardShell
      footer={<HmsAuditFooter dataSource="Real-time audit stream" />}
    >
      <HmsPageHeader
        title="My Audit Log"
        description="Events initiated by you across all modules"
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 mb-4">
          {error}
        </div>
      )}

      <div className="card p-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex items-center justify-between mb-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search events..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          {exportError && (
            <span className="text-[10px] text-rose-600 font-semibold">{exportError}</span>
          )}
          {exportTruncated && exportInfo && (
            <span className="text-[10px] text-amber-600 font-semibold">Exported first {exportInfo.exportedCount} of {exportInfo.totalAvailable} records</span>
          )}
          {exportSuccess && !exportTruncated && (
            <span className="text-[10px] text-emerald-600 font-semibold">Exported</span>
          )}
          <div className="relative group">
            <button
              disabled={exporting}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <AuditEventTable
        events={events}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
        showActor={false}
        showChainInfo
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        onRowClick={handleRowClick}
      />
    </HmsDashboardShell>
  );
};

export default MyAuditLogPage;
