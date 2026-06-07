import { useState, useCallback } from 'react';
import { 
  HmsPageHeader, 
} from '../../components/hms-page';
import { 
  HmsDashboardShell, 
  HmsToolbar, 
  HmsAuditFooter, 
  HmsDrilldownTable, 
  HmsStatusChip,
  HmsStatusVariant,
  HmsLoadingSkeleton,
  HmsDataUnavailable
} from '../../components/hms-dashboard';
import { useCriticalResults } from '../../hooks/use-lab';
import {
  Search,
  PhoneCall,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ShieldX,
  X,
  Loader2,
  LucideIcon,
} from 'lucide-react';

export const CriticalResultsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const { 
    criticalResults, 
    isLoading, 
    error, 
    acknowledge, 
    escalate, 
    acknowledgingId, 
    escalatingId 
  } = useCriticalResults(statusFilter);

  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleOpenAcknowledge = (id: string) => {
    setActiveResultId(id);
    setNotesText('');
    setActionError(null);
    setShowAcknowledgeModal(true);
  };

  const handleOpenEscalate = (id: string) => {
    setActiveResultId(id);
    setNotesText('');
    setActionError(null);
    setShowEscalateModal(true);
  };

  const handleConfirmAcknowledge = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResultId) return;
    setActionError(null);
    setSuccessMsg(null);
    try {
      await acknowledge(activeResultId, notesText || undefined);
      setSuccessMsg('Critical result acknowledged. Physician contact logged.');
      setShowAcknowledgeModal(false);
      setActiveResultId(null);
      setNotesText('');
    } catch {
      setActionError('Failed to acknowledge critical result. Please try again.');
    }
  }, [activeResultId, notesText, acknowledge]);

  const handleConfirmEscalate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResultId || !notesText.trim()) return;
    setActionError(null);
    setSuccessMsg(null);
    try {
      await escalate(activeResultId, notesText);
      setSuccessMsg('Critical result escalated. Supervisor notified.');
      setShowEscalateModal(false);
      setActiveResultId(null);
      setNotesText('');
    } catch {
      setActionError('Failed to escalate critical result. Please try again.');
    }
  }, [activeResultId, notesText, escalate]);

  const filteredResults = criticalResults.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.patientName.toLowerCase().includes(q) ||
      r.patientMrn.toLowerCase().includes(q) ||
      r.orderNumber.toLowerCase().includes(q);
  });

  if (error) {
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Critical Alerts & Notification Registry"
          description="Track panic-level diagnostic results that require direct, immediate physician notification."
          badge="LIS High Alert"
        />
        <HmsDataUnavailable
          sectionName="Critical Alerts Registry"
          expectedApi="GET /api/v1/lab/critical-results"
        />
      </HmsDashboardShell>
    );
  }

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar>
          <div className="flex items-center gap-4 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, MRN, order..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 text-xs py-1.5 w-full bg-slate-50 border-slate-200"
              />
            </div>
            <select
              value={statusFilter || 'ALL'}
              onChange={(e) => setStatusFilter(e.target.value === 'ALL' ? undefined : e.target.value)}
              className="input text-xs py-1.5 w-[180px] bg-white border border-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Alerts</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </HmsToolbar>
      }
      footer={<HmsAuditFooter dataSource="useCriticalResults → GET /api/v1/lab/critical-results" />}
    >
      <div className="bg-rose-950 text-rose-50 px-4 py-3 rounded-xl shadow-lg border border-rose-900 flex items-center gap-4 mb-4">
        <div className="h-10 w-10 bg-rose-900/50 rounded-full flex items-center justify-center animate-pulse">
           <ShieldX className="h-6 w-6 text-rose-200" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest leading-none">High Alert Protocol Active</p>
          <p className="text-[11px] font-medium text-rose-200/80 mt-1">This registry contains panic-level results requiring direct physician notification within 30 minutes.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <HmsPageHeader
          title="Critical Alerts & Notification Registry"
          description="Track panic-level diagnostic results that require direct, immediate physician notification. Log clinician acknowledgment."
        />
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-150 px-3 py-1 rounded-full animate-pulse">
            Live Panic Alerts
          </span>
        </div>
      </div>

      {/* Mock/WIP Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Critical Alerts Registry (Real — Partial)</h5>
          <p className="font-medium mt-0.5">
            Critical result tracking and acknowledgement is backed by the real API. External paging/SMS/email alerting, automatic threshold detection, and full policy engine remain out of scope.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {isLoading ? (
        <HmsLoadingSkeleton rows={6} />
      ) : (
        <HmsDrilldownTable
          title="Active Critical Alerts"
          description={statusFilter ? `Filtered by: ${statusFilter}` : "All identified panic-level results"}
          keyExtractor={(r) => r.id}
          data={filteredResults}
          columns={[
            {
              key: 'patient',
              header: 'Patient Profile',
              render: (r) => (
                <div className="space-y-0.5">
                  <p className="font-black text-slate-800 text-sm leading-tight">{r.patientName}</p>
                  <p className="text-[10px] text-slate-400 font-mono uppercase">MRN: {r.patientMrn}</p>
                  <p className="text-[10px] text-indigo-600 font-mono">{r.orderNumber}</p>
                </div>
              )
            },
            {
              key: 'result',
              header: 'Critical Result',
              render: (r) => (
                <div className="space-y-1">
                  <p className="text-rose-700 font-black">
                    {r.testNames?.join(', ') || 'Lab Result'}
                  </p>
                  {r.results && typeof r.results === 'object' && !Array.isArray(r.results) && (
                    <p className="text-[10px] text-slate-500 font-mono">
                      {Object.entries(r.results as Record<string, unknown>)
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}
                      {Object.keys(r.results as Record<string, unknown>).length > 3 ? '...' : ''}
                    </p>
                  )}
                </div>
              )
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => {
                const statusMap: Record<string, { label: string; variant: HmsStatusVariant; icon: LucideIcon }> = {
                  OPEN: { label: 'Open', variant: 'critical', icon: ShieldAlert },
                  ACKNOWLEDGED: { label: 'Acknowledged', variant: 'warning', icon: CheckCircle },
                  ESCALATED: { label: 'Escalated', variant: 'warning', icon: PhoneCall },
                  RESOLVED: { label: 'Resolved', variant: 'success', icon: CheckCircle },
                };
                const config = statusMap[r.criticalStatus || 'OPEN'] || statusMap.OPEN;
                return (
                  <HmsStatusChip 
                    status={config.label} 
                    variant={config.variant} 
                  />
                );
              }
            },
            {
              key: 'timeline',
              header: 'Timeline',
              render: (r) => (
                <div className="space-y-1 text-[10px]">
                  {r.encodedAt && (
                    <p className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-3 w-3" /> Encoded: {new Date(r.encodedAt).toLocaleString()}
                    </p>
                  )}
                  {r.criticalAcknowledgedAt && (
                    <p className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-3 w-3" /> Ack'd: {new Date(r.criticalAcknowledgedAt).toLocaleString()}
                    </p>
                  )}
                  {r.criticalEscalatedAt && (
                    <p className="flex items-center gap-1 text-orange-600">
                      <Clock className="h-3 w-3" /> Escalated: {new Date(r.criticalEscalatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )
            },
            {
              key: 'actions',
              header: 'Clinical Actions',
              render: (r) => (
                <div className="flex flex-col gap-1.5 min-w-[120px]">
                  {r.criticalStatus === 'OPEN' ? (
                    <>
                      <button
                        onClick={() => handleOpenAcknowledge(r.id)}
                        disabled={acknowledgingId === r.id}
                        className="btn bg-rose-600 hover:bg-rose-700 text-white font-black px-3 py-1.5 rounded-xl text-[10px] shadow-sm flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {acknowledgingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <PhoneCall className="h-3 w-3" />}
                        Log Contact
                      </button>
                      <button
                        onClick={() => handleOpenEscalate(r.id)}
                        disabled={escalatingId === r.id}
                        className="btn border border-orange-200 text-orange-700 hover:bg-orange-50 font-black px-3 py-1 rounded-xl text-[10px] flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {escalatingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3" />}
                        Escalate
                      </button>
                    </>
                  ) : r.criticalStatus === 'RESOLVED' ? (
                    <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> CLOSED
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold italic">
                      Pending follow-up
                    </span>
                  )}
                </div>
              )
            }
          ]}
        />
      )}

      {/* Acknowledge Modal */}
      {showAcknowledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleConfirmAcknowledge} className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-800 text-sm tracking-wider uppercase">
                Log Physician Contact
              </h4>
              <button 
                type="button" 
                onClick={() => setShowAcknowledgeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold">
                {actionError}
              </div>
            )}

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Document direct physician contact to acknowledge receipt of this critical result.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase block">Contact Notes</label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Enter verbal orders or critical receipt notes given by physician..."
                className="input min-h-[90px] text-xs py-2 w-full rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
               <button
                type="button"
                onClick={() => setShowAcknowledgeModal(false)}
                className="btn border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm"
              >
                Log Contact
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleConfirmEscalate} className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in space-y-4">
             <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-800 text-sm tracking-wider uppercase">
                Escalate Critical Result
              </h4>
              <button 
                type="button" 
                onClick={() => setShowEscalateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold">
                {actionError}
              </div>
            )}

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Escalate to a supervisor or lab manager if the primary physician cannot be reached within policy limits.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase block">Escalation Reason *</label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Why is this being escalated? (e.g., physician not reachable)"
                className="input min-h-[90px] text-xs py-2 w-full rounded-xl bg-slate-50 border border-slate-200"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
               <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="btn border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm"
              >
                Confirm Escalation
              </button>
            </div>
          </form>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default CriticalResultsPage;
