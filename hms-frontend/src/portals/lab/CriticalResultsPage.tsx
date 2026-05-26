import { useState, useCallback } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { useCriticalResults } from '../../hooks/use-lab';
import {
  Search,
  PhoneCall,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  XCircle,
} from 'lucide-react';

export const CriticalResultsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const { criticalResults, isLoading, error, acknowledge, escalate, acknowledgingId, escalatingId } =
    useCriticalResults(statusFilter);

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

  return (
    <div className="space-y-6 animate-fade-in">
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

      <PageHeader
        title="Critical Alerts & Notification Registry"
        description="Track panic-level diagnostic results that require direct, immediate physician notification. Log caller identity and clinician acknowledgment."
      />

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <XCircle className="h-4 w-4 text-rose-600" />
          {error}
        </div>
      )}

      {/* Filter and search bar */}
      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, MRN, order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9.5 text-xs py-2 w-full rounded-xl bg-slate-50 border-slate-200/80"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter || 'ALL'}
            onChange={(e) => setStatusFilter(e.target.value === 'ALL' ? undefined : e.target.value)}
            className="input text-xs py-2 w-full md:w-[200px] rounded-xl bg-white border border-slate-200"
          >
            <option value="ALL">All Critical Results</option>
            <option value="OPEN">Open / Pending</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Critical Results Queue */}
      {isLoading ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
          <Loader2 className="h-8 w-8 text-rose-500 mx-auto animate-spin" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading critical results...</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
          <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">No critical results found</p>
          <p className="text-xs text-slate-400">
            {statusFilter
              ? `No results with status "${statusFilter}".`
              : 'No lab results have been marked as critical.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-455 font-black uppercase tracking-wider border-b border-slate-150">
                  <th className="px-6 py-4">Patient Profile</th>
                  <th className="px-6 py-4">Critical Result</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-655">
                {filteredResults.map(r => (
                  <tr key={r.id} className={r.criticalStatus === 'OPEN' ? 'bg-rose-50/10' : ''}>
                    <td className="px-6 py-4 space-y-0.5">
                      <p className="font-black text-slate-800 text-sm leading-tight">{r.patientName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">MRN: {r.patientMrn}</p>
                      <p className="text-[10px] text-indigo-600 font-mono">{r.orderNumber}</p>
                    </td>

                    <td className="px-6 py-4 space-y-1">
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
                    </td>

                    <td className="px-6 py-4">
                      {r.criticalStatus === 'OPEN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 font-extrabold text-[9px] border border-rose-150 animate-pulse select-none">
                          <ShieldAlert className="h-3 w-3" /> Open
                        </span>
                      )}
                      {r.criticalStatus === 'ACKNOWLEDGED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 font-extrabold text-[9px] border border-amber-100 select-none">
                          <CheckCircle className="h-3 w-3" /> Acknowledged
                        </span>
                      )}
                      {r.criticalStatus === 'ESCALATED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-orange-50 text-orange-700 font-extrabold text-[9px] border border-orange-100 select-none">
                          <PhoneCall className="h-3 w-3" /> Escalated
                        </span>
                      )}
                      {r.criticalStatus === 'RESOLVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-extrabold text-[9px] border border-emerald-100 select-none">
                          <CheckCircle className="h-3 w-3" /> Resolved
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 space-y-1 text-[10px]">
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
                      {r.criticalEscalationNotes && (
                        <p className="text-slate-400 italic max-w-[200px] truncate" title={r.criticalEscalationNotes}>
                          "{r.criticalEscalationNotes}"
                        </p>
                      )}
                      {r.criticalResolvedAt && (
                        <p className="flex items-center gap-1 text-emerald-600">
                          <Clock className="h-3 w-3" /> Resolved: {new Date(r.criticalResolvedAt).toLocaleString()}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center space-y-1.5">
                      {r.criticalStatus === 'OPEN' && (
                        <>
                          <button
                            onClick={() => handleOpenAcknowledge(r.id)}
                            disabled={acknowledgingId === r.id}
                            className="btn bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] shadow-sm flex items-center gap-1 mx-auto disabled:opacity-50 w-full"
                          >
                            {acknowledgingId === r.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <PhoneCall className="h-3 w-3" />
                            )}
                            Log Contact
                          </button>
                          <button
                            onClick={() => handleOpenEscalate(r.id)}
                            disabled={escalatingId === r.id}
                            className="btn border border-orange-200 text-orange-700 hover:bg-orange-50 font-extrabold px-3 py-1 rounded-xl text-[10px] flex items-center gap-1 mx-auto disabled:opacity-50 w-full"
                          >
                            {escalatingId === r.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ShieldAlert className="h-3 w-3" />
                            )}
                            Escalate
                          </button>
                        </>
                      )}
                      {(r.criticalStatus === 'ACKNOWLEDGED' || r.criticalStatus === 'ESCALATED') && (
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Pending follow-up
                        </span>
                      )}
                      {r.criticalStatus === 'RESOLVED' && (
                        <span className="text-[10px] text-emerald-600 font-bold block">✓ Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Acknowledge Modal */}
      {showAcknowledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleConfirmAcknowledge} className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
              Log Physician Contact
            </h4>

            {actionError && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold">
                {actionError}
              </div>
            )}

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Document physician contact to acknowledge this critical result. This creates an audit log entry.
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

            <div className="flex gap-2 justify-end">
              <button
                type="submit"
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm"
              >
                Log Contact
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAcknowledgeModal(false);
                  setActiveResultId(null);
                  setNotesText('');
                  setActionError(null);
                }}
                className="btn border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleConfirmEscalate} className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
              Escalate Critical Result
            </h4>

            {actionError && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold">
                {actionError}
              </div>
            )}

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Escalate to a supervisor or lab manager. Provide the reason for escalation.
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

            <div className="flex gap-2 justify-end">
              <button
                type="submit"
                className="btn bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm"
              >
                Escalate
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEscalateModal(false);
                  setActiveResultId(null);
                  setNotesText('');
                  setActionError(null);
                }}
                className="btn border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Audit info box */}
      {criticalResults.length > 0 && (
        <div className="p-4 bg-indigo-50/20 border border-indigo-100/60 rounded-2xl text-xs text-indigo-800 font-semibold space-y-1">
          <h4 className="font-bold text-indigo-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" />
            Critical Result Workflow
          </h4>
          <p className="text-[10.5px] leading-relaxed">
            All critical result state changes are audited (marked critical, acknowledged, escalated, resolved).
            External paging, SMS, email, and automatic threshold detection remain out of scope.
          </p>
        </div>
      )}
    </div>
  );
};

export default CriticalResultsPage;
