import React, { useState } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';
import { AuditEventTable } from '../../features/audit/components/AuditEventTable';
import { useMyAuditEvents } from '../../hooks/use-compliance';
import { useNavigate } from 'react-router-dom';
import { AuditLogEntry } from '../../services/compliance.service';
import { Search } from 'lucide-react';

export const MyAuditLogPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const navigate = useNavigate();

  const { events, total, loading, error, refetch } = useMyAuditEvents({ page, pageSize });

  const handleRowClick = (event: AuditLogEntry) => {
    navigate(`/audit/events/${event.id}`);
  };

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
        <button
          onClick={refetch}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          Refresh
        </button>
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
