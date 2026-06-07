import { useState, useCallback } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
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
    <div className="space-y-4 animate-fade-in font-sans text-slate-700">
      {/* Sandbox Warning Banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5 text-xs text-amber-800">
        <AlertTriangle className="h-4.5 w-4.5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-bold uppercase text-[10px] tracking-wider">Diagnostic Dispatch (Partial — Real)</h5>
          <p className="font-medium mt-0.5">
            Result release uses the real API with signature, audit log, and notification. Full LIS release policy automation and critical-result escalation remain out of scope.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <HmsPageHeader
          title="Diagnostic Dispatch & Release Desk"
          description="Review and release validated lab results. Released results are signed, audited, and dispatched to patient EMR."
        />

        <div className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-150 px-2.5 py-1 rounded-lg select-none">
          LIS Director Desk
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-scale-in font-sans">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {releaseError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2 font-sans">
          <XCircle className="h-4 w-4 text-rose-600" />
          {releaseError}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-slate-200 p-8 rounded-lg shadow-sm text-center space-y-2">
          <Loader2 className="h-6 w-6 text-blue-600 mx-auto animate-spin" />
          <p className="text-xs font-bold text-slate-500 animate-pulse font-sans">Loading validated results awaiting release...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm text-center space-y-2">
          <XCircle className="h-6 w-6 text-rose-500 mx-auto" />
          <p className="text-xs font-bold text-slate-700 font-sans">Unable to load results</p>
          <p className="text-[11px] text-slate-550">{error}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-slate-200 p-8 rounded-lg shadow-sm text-center space-y-2">
          <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto" />
          <p className="text-xs font-bold text-slate-605 font-sans">No results awaiting release</p>
          <p className="text-[11px] text-slate-455 font-sans">All validated results have been released.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-455 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Tests</th>
                  <th className="px-4 py-3">Validated</th>
                  <th className="px-4 py-3">Validated At</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-655">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/30">
                    <td className="px-4 py-3 font-sans">
                      <p className="font-bold text-slate-800 text-xs leading-tight">{r.patientName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">MRN: {r.patientMrn}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-blue-650 font-bold">{r.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className="text-[10px] text-slate-600 font-semibold">
                        {r.testNames?.join(', ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold uppercase">
                        Approved
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-slate-500">
                        {r.validatedAt ? new Date(r.validatedAt).toLocaleString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-sans">
                      <button
                        onClick={() => handleRelease(r.id)}
                        disabled={releasingId === r.id}
                        className="bg-blue-650 hover:bg-blue-755 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm flex items-center gap-1 mx-auto disabled:opacity-50 cursor-pointer"
                      >
                        {releasingId === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Release Result
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
        <div className="p-3 bg-blue-50/30 border border-blue-100/60 rounded-lg text-xs text-blue-800 font-medium space-y-1">
          <h4 className="font-bold text-blue-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5" />
            Release Authorization Protocol
          </h4>
          <p className="text-[10.5px] leading-relaxed">
            Releasing a result is officially recorded and audited. This updates the result status for downstream clinical visibility and patient EMR access. Only validated (APPROVED) results can be released.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultReleasePage;
