import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsLoadingSkeleton } from '../../components/hms-dashboard';
import { complianceService, AuditLogEntry } from '../../services/compliance.service';
import { ArrowLeft, CheckCircle2, ShieldCheck, Globe, Monitor } from 'lucide-react';

export const AuditEventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isSelf = location.pathname.includes('/my-events/');
  const [event, setEvent] = useState<AuditLogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const fetch = isSelf
      ? complianceService.getMyAuditEvent(id)
      : complianceService.getAuditEvent(id);
    fetch
      .then(setEvent)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load event'))
      .finally(() => setLoading(false));
  }, [id, isSelf]);

  const getEventLabel = (key: string): string =>
    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (loading) {
    return (
      <HmsDashboardShell>
        <HmsLoadingSkeleton />
      </HmsDashboardShell>
    );
  }

  if (error || !event) {
    return (
      <HmsDashboardShell>
        <HmsPageHeader title="Audit Event" description="Event details" />
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          {error || 'Event not found'}
        </div>
      </HmsDashboardShell>
    );
  }

  return (
    <HmsDashboardShell>
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
        title="Audit Event Detail"
        description={`Event ${event.id}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Event Information</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <DetailField label="Event ID" value={event.id} />
              <DetailField label="Event Key" value={getEventLabel(event.eventKey)} />
              <DetailField label="Timestamp" value={new Date(event.createdAt).toLocaleString()} />
              <DetailField label="User ID" value={event.userId} />
              <DetailField label="Active Role" value={event.activeRole || '—'} />
              <DetailField label="Tenant ID" value={event.tenantId} />
              <DetailField label="Branch ID" value={event.branchId || '—'} />
              <DetailField label="Record Type" value={event.recordType} />
              <DetailField label="Record ID" value={event.recordId || '—'} />
              <DetailField label="IP Address" value={event.ipAddress || '—'} />
              <DetailField label="User Agent" value={event.userAgent || '—'} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {event.hash && (
            <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Chain Integrity
              </h3>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-bold">Linked</span>
              </div>
              <div className="text-xs space-y-1.5">
                <div><span className="font-bold text-slate-400">Hash:</span>
                  <span className="font-mono text-slate-600 ml-1 break-all">{event.hash.substring(0, 16)}...</span>
                </div>
                {event.previousHash && (
                  <div><span className="font-bold text-slate-400">Prev Hash:</span>
                    <span className="font-mono text-slate-600 ml-1 break-all">{event.previousHash.substring(0, 16)}...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Source</h3>
            <div className="flex items-center gap-2 text-xs">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-600">{event.ipAddress || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Monitor className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-600">{event.userAgent || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

const DetailField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-xs font-semibold text-slate-800 font-mono break-all">{value}</p>
  </div>
);

export default AuditEventDetailPage;
