import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { useValidatedResults, useReleaseLabResult } from '../../hooks/use-clinical-workflow';
import { usePermissions } from '../../hooks/use-user';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Loader2,
  Clock,
  User,
  FlaskConical,
  SearchX,
  CheckCircle2,
} from 'lucide-react';
import axios from 'axios';

export const ValidatedResultsPage = () => {
  const navigate = useNavigate();
  const { hasRole } = usePermissions();
  const { data: results, isLoading, error } = useValidatedResults();
  const releaseMutation = useReleaseLabResult();

  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [confirmRelease, setConfirmRelease] = useState<{ id: string; orderId: string; patientId: string; version: number } | null>(null);

  const canRelease = hasRole('Branch Admin') || hasRole('Super Admin');

  const handleReleaseConfirm = async () => {
    if (!confirmRelease) return;
    const { patientId, orderId, version } = confirmRelease;
    setReleasingId(orderId);
    setConfirmRelease(null);
    try {
      await releaseMutation.mutateAsync({
        patientId,
        orderId,
        data: { version },
      });
    } catch {
      // Error handled by mutation state
    } finally {
      setReleasingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Validated Results — Pending Release"
          description="Loading validated results queue..."
        />
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
          <Loader2 className="h-10 w-10 text-indigo-500 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading validated results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isForbidden =
      axios.isAxiosError(error) &&
      (error.response?.status === 403 || error.response?.status === 401);
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Validated Results — Pending Release"
          description="Error loading validated results"
        />
        <div className="card p-12 bg-white border border-rose-100 shadow-sm rounded-2xl text-center">
          <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            {isForbidden ? 'Access Restricted' : 'Connection Error'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {isForbidden
              ? 'You do not have permission to view validated results.'
              : 'Failed to load validated results. Please try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isEmpty = !results || results.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Validated Results — Pending Release"
        description="Results that have passed technical review and are awaiting release dispatch."
      />

      {/* Release Confirmation Modal */}
      {confirmRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Confirm Release</h3>
            </div>
            <div className="text-xs text-slate-600 font-medium space-y-2">
              <p>
                Releasing this result for clinical visibility means it will be visible to
                authorized staff and (where applicable) to patients through the patient portal.
              </p>
              <p className="font-bold text-slate-700">
                The result cannot be silently edited after release. Amendment or correction
                will require a separate future workflow.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleReleaseConfirm}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Release Result
              </button>
              <button
                onClick={() => setConfirmRelease(null)}
                className="btn border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-semibold px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
          <SearchX className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">
            No Validated Results
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            All validated results have been processed. New results will appear here 
            after they pass technical review on the QA Verification page.
          </p>
          <button
            onClick={() => navigate('/lab/validation')}
            className="mt-6 btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl"
          >
            Go to QA Verification
          </button>
        </div>
      ) : (
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/60 text-slate-400 font-extrabold uppercase border-b border-slate-150">
                  <th className="px-6 py-3.5">Patient</th>
                  <th className="px-6 py-3.5">MRN</th>
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-6 py-3.5">Panel</th>
                  <th className="px-6 py-3.5">Specimen</th>
                  <th className="px-6 py-3.5">Validated</th>
                  <th className="px-6 py-3.5">By</th>
                  <th className="px-6 py-3.5">Status</th>
                  {canRelease && <th className="px-6 py-3.5"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((result) => {
                  const isReleasing = releasingId === result.orderId;
                  const releaseError = releaseMutation.isError && releasingId === result.orderId;
                  const isConflict = releaseError && axios.isAxiosError(releaseMutation.error) && releaseMutation.error.response?.status === 409;

                  return (
                    <tr
                      key={result.id}
                      className="hover:bg-slate-50/30 transition-all"
                    >
                      <td className="px-6 py-4 font-black text-slate-800">
                        {result.patientName}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500 text-[10px]">
                        {result.patientNumber}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600 font-semibold text-[10px]">
                        {result.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-semibold">
                        {result.panelName || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <FlaskConical className="h-3.5 w-3.5" />
                          <span className="font-semibold text-[10px]">
                            {result.specimenType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="font-medium text-[10px]">
                            {format(new Date(result.validatedAt), 'MMM d, HH:mm')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <User className="h-3.5 w-3.5" />
                          <span className="font-medium text-[10px]">
                            {result.validatedById
                              ? result.validatedById.slice(0, 8)
                              : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150">
                          Validated
                        </span>
                      </td>
                      {canRelease && (
                        <td className="px-6 py-4 text-right">
                          {isReleasing ? (
                            <Loader2 className="h-4 w-4 text-indigo-500 animate-spin inline" />
                          ) : isConflict ? (
                            <span className="text-[10px] text-amber-600 font-semibold">
                              Stale version — reload
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                setConfirmRelease({
                                  id: result.id,
                                  orderId: result.orderId,
                                  patientId: result.patientId,
                                  version: result.version,
                                })
                              }
                              className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl"
                            >
                              Release
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card p-5 bg-amber-50 border border-amber-150 rounded-2xl text-xs text-amber-800 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="font-medium">
          <p>
            These results have been technically reviewed and validated, but have 
            <strong> not yet been released</strong>. Release, notification, patient 
            portal access, and billing workflows are not available in this phase 
            and will be implemented in a future phase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ValidatedResultsPage;
