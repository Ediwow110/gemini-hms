import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';
import { AuditEventTable } from '../../features/audit/components/AuditEventTable';
import { useEntityAuditTimeline } from '../../hooks/use-compliance';
import { AuditLogEntry } from '../../services/compliance.service';
import { ArrowLeft } from 'lucide-react';

export const EntityAuditTimelinePage: React.FC = () => {
  const { recordType, recordId } = useParams<{ recordType: string; recordId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { events, total, loading, error } = useEntityAuditTimeline(recordType || '', recordId || '', { page, pageSize });

  const handleRowClick = (event: AuditLogEntry) => {
    navigate(`/audit/events/${event.id}`);
  };

  return (
    <HmsDashboardShell
      footer={<HmsAuditFooter dataSource="Entity audit timeline" />}
    >
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>

      <HmsPageHeader
        title="Entity Audit Timeline"
        description={`Changes for ${recordType} / ${recordId?.substring(0, 8)}...`}
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 mb-4">
          {error}
        </div>
      )}

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

export default EntityAuditTimelinePage;
