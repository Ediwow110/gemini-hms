import { useState, useCallback } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { useReleasableResults } from '../../hooks/use-lab';
import { apiClient } from '../../lib/api';
import {
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export const ResultReleasePage = () => {
  const { results, isLoading, error, refetch } = useReleasableResults();
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRelease = useCallback(async (resultId: string) => {
    setReleasingId(resultId);
    setReleaseError(null);
    setSuccessMsg(null);
    try {
      await apiClient.post(`/v1/lab/results/${resultId}/release`);
      setSuccessMsg('Result released successfully. Signature and notification logged.');
      await refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setReleaseError(axiosErr?.response?.data?.message || axiosErr?.message || 'Failed to release result');
    } finally {
      setReleasingId(null);
    }
  }, [refetch]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Mock/WIP Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Diagnostic Dispatch (Partial — Real)</h5>
          <p className="font-medium mt-0.5">
            Result release uses the real API with signature, audit log, and notification. Full LIS release policy automation and critical-result escalation remain out of scope.
          </p>
        </div>
      </div>

      <PageHeader
        title="Diagnostic Dispatch & Release Desk"
        description="Review and release validated lab results. Released results are signed, audited, and dispatched to patient EMR."
      />

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {releaseError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
          <XCircle className="h-4 w-4 text-rose-600" />
          {releaseError}
        </div>
      )}

      {isLoading ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-500 mx-auto animate-spin" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading validated results awaiting release...</p>
        </div>
      ) : error ? (
        <div className="card p-8 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
          <XCircle className="h-8 w-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Unable to load results</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3">
          <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">No results awaiting release</p>
          <p className="text-xs text-slate-400">All validated results have been released.</p>
        </div>
      ) : (
        <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-455 font-black uppercase tracking-wider border-b border-slate-150">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Tests</th>
                  <th className="px-6 py-4">Validated By</th>
                  <th className="px-6 py-4">Validated At</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-655">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4 space-y-0.5">
                      <p className="font-black text-slate-800 text-sm leading-tight">{r.patientName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{r.patientMrn}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">{r.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] text-slate-600 font-medium">
                        {r.testNames?.join(', ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate.600">{r.validatedById ? 'Yes' : 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] text-slate-500">
                        {r.validatedAt ? new Date(r.validatedAt).toLocaleString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleRelease(r.id)}
                        disabled={releasingId === r.id}
                        className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] shadow-sm flex items-center gap-1 mx-auto disabled:opacity-50"
                      >
                        {releasingId === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Release
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit info box */}
      {results.length > 0 && (
        <div className="p-4 bg-indigo-50/20 border border-indigo-100/60 rounded-2xl text-xs text-indigo-800 font-semibold space-y-1">
          <h4 className="font-bold text-indigo-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" />
            Release Authorization
          </h4>
          <p className="text-[10.5px] leading-relaxed">
            Releasing a result creates an electronic signature, audit log entry, and patient notification. Only validated (APPROVED) results can be released.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultReleasePage;
