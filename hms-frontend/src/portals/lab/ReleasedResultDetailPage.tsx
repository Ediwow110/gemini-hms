import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { useReleasedLabResultDetail } from '../../hooks/use-clinical-workflow';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Loader2,
  FlaskConical,
  Clock,
  CheckCircle2,
  FileText,
  Eye,
} from 'lucide-react';
import axios from 'axios';

export const ReleasedResultDetailPage = () => {
  const { patientId, orderId } = useParams<{ patientId: string; orderId: string }>();
  const navigate = useNavigate();
  const { data: result, isLoading, error } = useReleasedLabResultDetail(patientId!, orderId!);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Released Lab Result"
          description="Loading released result details..."
        />
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
          <Loader2 className="h-10 w-10 text-indigo-500 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading released result...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isForbidden =
      axios.isAxiosError(error) &&
      (error.response?.status === 403 || error.response?.status === 401);
    const isNotFound =
      axios.isAxiosError(error) && error.response?.status === 404;
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Released Lab Result"
          description="Error loading released result"
        />
        <div className="card p-12 bg-white border border-rose-100 shadow-sm rounded-2xl text-center">
          <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            {isForbidden ? 'Access Restricted' : isNotFound ? 'Result Not Found' : 'Connection Error'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {isForbidden
              ? 'You do not have permission to view this released result.'
              : isNotFound
                ? 'This released lab result could not be found. It may have been archived or removed.'
                : 'Failed to load released result. Please try again.'}
          </p>
          <button
            onClick={() => navigate('/lab/released')}
            className="mt-6 btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl"
          >
            Back to Released Results
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Released Lab Result"
          description="Result not found"
        />
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">No Result Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            This released lab result is not available.
          </p>
          <button
            onClick={() => navigate('/lab/released')}
            className="mt-6 btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl"
          >
            Back to Released Results
          </button>
        </div>
      </div>
    );
  }

  const resultsEntries = result.results
    ? Object.entries(result.results).map(([key, value]) => ({ key, value }))
    : [];

  const breadcrumbs = [
    { label: "Lab", to: "/lab" },
    { label: "Released Results", to: "/lab/released" },
    { label: "Result Detail", current: true }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Released Lab Result"
        description="Read-only detail view of a released lab result."
        backFallback="/lab/released"
        backLabel="Back to Released"
        breadcrumbs={breadcrumbs}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-6 py-4 bg-indigo-50/40 border-b border-slate-150 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                Result Values
              </span>
            </div>
            {resultsEntries.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {resultsEntries.map(({ key, value }) => (
                  <div key={key} className="px-6 py-3.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">{key}</span>
                    <span className="text-sm font-black text-slate-800">
                      {String(value ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-slate-400">No result values recorded.</p>
              </div>
            )}
          </div>

          {result.remarks && (
            <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/40 border-b border-slate-150 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Remarks
                </span>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{result.remarks}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/40 border-b border-slate-150">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Status
              </span>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs font-extrabold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                  Released
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                v{result.version}
              </div>
            </div>
          </div>

          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/40 border-b border-slate-150">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Timeline
              </span>
            </div>
            <div className="px-5 py-4 space-y-3.5">
              <div className="flex items-start gap-2.5">
                <Eye className="h-3.5 w-3.5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">
                    Validated
                  </p>
                  <p className="text-xs font-semibold text-slate-700">
                    {result.validatedAt
                      ? format(new Date(result.validatedAt), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </p>
                  {result.validatedById && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      {result.validatedById.slice(0, 8)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="h-3.5 w-3.5 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">
                    Released
                  </p>
                  <p className="text-xs font-semibold text-slate-700">
                    {result.releasedAt
                      ? format(new Date(result.releasedAt), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </p>
                  {result.releasedById && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      {result.releasedById.slice(0, 8)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-amber-50 border border-amber-150 rounded-2xl text-xs text-amber-800 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="font-medium space-y-1">
                <p>
                  This result has been <strong>released</strong> for clinical visibility.
                </p>
                <p>
                  Notification, billing integration, and patient portal delivery are separate workflows
                  and are not available in this view.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleasedResultDetailPage;