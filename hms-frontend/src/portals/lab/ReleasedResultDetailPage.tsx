import { useParams, useNavigate } from 'react-router-dom';
import { useReleasedLabResultDetail } from '../../hooks/use-clinical-workflow';
import { format } from 'date-fns';
import {
  AlertTriangle,
  FlaskConical,
  Eye,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import axios from 'axios';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsDashboardShell,
  HmsAuditFooter,
  HmsLoadingSkeleton,
  HmsDataUnavailable,
  HmsStatusChip,
} from '../../components/hms-dashboard';

export const ReleasedResultDetailPage = () => {
  const { patientId, orderId } = useParams<{ patientId: string; orderId: string }>();
  const navigate = useNavigate();
  const { data: result, isLoading, error } = useReleasedLabResultDetail(patientId!, orderId!);

  if (isLoading) {
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Released Lab Result"
          description="Read-only detail view of a released lab result."
          badge="LIS Registry"
        />
        <HmsLoadingSkeleton rows={5} />
      </HmsDashboardShell>
    );
  }

  if (error) {
    const isForbidden =
      axios.isAxiosError(error) &&
      (error.response?.status === 403 || error.response?.status === 401);
    const isNotFound =
      axios.isAxiosError(error) && error.response?.status === 404;
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Released Lab Result"
          description="Read-only detail view of a released lab result."
          badge="LIS Registry"
        />
        <HmsDataUnavailable
          sectionName={
            isForbidden
              ? 'Access Restricted'
              : isNotFound
              ? 'Result Not Found'
              : 'Connection Error'
          }
          expectedApi={
            isForbidden
              ? 'You do not have permission to view this released result.'
              : isNotFound
              ? 'This released lab result could not be found. It may have been archived or removed.'
              : 'Failed to load released result. Please try again.'
          }
        />
      </HmsDashboardShell>
    );
  }

  if (!result) {
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Released Lab Result"
          description="Read-only detail view of a released lab result."
          badge="LIS Registry"
        />
        <HmsDataUnavailable
          sectionName="No Result Found"
          expectedApi="This released lab result is not available."
        />
      </HmsDashboardShell>
    );
  }

  const resultsEntries = result.results
    ? Object.entries(result.results).map(([key, value]) => ({ key, value }))
    : [];

  return (
    <HmsDashboardShell
      toolbar={
        <div className="flex justify-between items-center">
          <div />
          <button
            onClick={() => navigate('/lab/released')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            ← Back to Released Results
          </button>
        </div>
      }
      footer={<HmsAuditFooter dataSource="useReleasedLabResultDetail → GET /api/v1/lab/released-results/:patientId/:orderId" />}
    >
      <HmsPageHeader
        title="Released Lab Result"
        description={`Detail view — Order ${result.orderId ?? orderId}`}
        badge="LIS Registry"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content — left 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Result Values */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-indigo-50 border-b border-slate-200 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                Result Values
              </span>
            </div>
            {resultsEntries.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {resultsEntries.map(({ key, value }) => (
                  <div key={key} className="px-5 py-3.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">{key}</span>
                    <span className="font-['IBM_Plex_Mono'] text-sm font-black text-slate-800">
                      {String(value ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-400">No result values recorded.</p>
              </div>
            )}
          </div>

          {/* Remarks */}
          {result.remarks && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Remarks
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{result.remarks}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — right 1/3 */}
        <div className="space-y-4">
          {/* Status card */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Status
              </span>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <HmsStatusChip variant="success" status="Released" />
              </div>
              <div className="font-['IBM_Plex_Mono'] text-[10px] text-slate-400">
                v{result.version}
              </div>
            </div>
          </div>

          {/* Timeline card */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Timeline
              </span>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-start gap-2.5">
                <Eye className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Validated
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {result.validatedAt
                      ? format(new Date(result.validatedAt), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </p>
                  {result.validatedById && (
                    <p className="font-['IBM_Plex_Mono'] text-[10px] text-slate-400 mt-0.5">
                      {result.validatedById.slice(0, 8)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Released
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {result.releasedAt
                      ? format(new Date(result.releasedAt), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </p>
                  {result.releasedById && (
                    <p className="font-['IBM_Plex_Mono'] text-[10px] text-slate-400 mt-0.5">
                      {result.releasedById.slice(0, 8)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scope notice */}
          <div className="flex items-start gap-2.5 p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
            <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="font-medium space-y-1">
              <p>
                This result has been <strong>released</strong> for clinical visibility.
              </p>
              <p>
                Notification, billing integration, and patient portal delivery are
                separate workflows and are not available in this view.
              </p>
            </div>
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default ReleasedResultDetailPage;