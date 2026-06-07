import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useValidatedResults, useReleaseLabResult } from '../../hooks/use-clinical-workflow';
import { ValidatedResultSummaryDto } from '../../services/clinicalWorkflow.service';
import { usePermissions } from '../../hooks/use-user';
import { format } from 'date-fns';
import {
  AlertTriangle,
  FlaskConical,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import axios from 'axios';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
  HmsDrilldownTable,
  HmsStatusChip,
  HmsLoadingSkeleton,
  HmsDataUnavailable,
  HmsEmptyState,
} from '../../components/hms-dashboard';

export const ValidatedResultsPage = () => {
  const navigate = useNavigate();
  const { hasRole } = usePermissions();
  const { data: results, isLoading, error, refetch } = useValidatedResults();
  const releaseMutation = useReleaseLabResult();

  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [confirmRelease, setConfirmRelease] = useState<{
    id: string;
    orderId: string;
    patientId: string;
    version: number;
  } | null>(null);

  const canRelease = hasRole('Branch Admin') || hasRole('Super Admin');

  const handleReleaseConfirm = async () => {
    if (!confirmRelease) return;
    const { patientId, orderId, version } = confirmRelease;
    setReleasingId(orderId);
    setConfirmRelease(null);
    try {
      await releaseMutation.mutateAsync({ patientId, orderId, data: { version } });
    } catch {
      // Error state surfaced via releaseMutation.isError
    } finally {
      setReleasingId(null);
    }
  };

  if (isLoading) {
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Validated Results — Pending Release"
          description="Results that have passed technical review and are awaiting release dispatch."
          badge="LIS QA Queue"
        />
        <HmsLoadingSkeleton rows={6} />
      </HmsDashboardShell>
    );
  }

  if (error) {
    const isForbidden =
      axios.isAxiosError(error) &&
      (error.response?.status === 403 || error.response?.status === 401);
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Validated Results — Pending Release"
          description="Results that have passed technical review and are awaiting release dispatch."
          badge="LIS QA Queue"
        />
        <HmsDataUnavailable
          sectionName={isForbidden ? 'Access Restricted' : 'Connection Error'}
          expectedApi={
            isForbidden
              ? 'You do not have permission to view validated results.'
              : 'Failed to load validated results. Please try again.'
          }
        />
      </HmsDashboardShell>
    );
  }

  const isEmpty = !results || results.length === 0;

  const baseColumns = [
    {
      key: 'patient',
      header: 'Patient',
      render: (row: ValidatedResultSummaryDto) => (
        <span className="font-bold text-slate-800 font-['IBM_Plex_Sans']">
          {row.patientName}
        </span>
      ),
    },
    {
      key: 'mrn',
      header: 'MRN',
      render: (row: ValidatedResultSummaryDto) => (
        <span className="font-['IBM_Plex_Mono'] text-slate-500 text-[10px]">
          {row.patientNumber}
        </span>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      render: (row: ValidatedResultSummaryDto) => (
        <span className="font-['IBM_Plex_Mono'] text-slate-600 font-semibold text-[10px]">
          {row.orderNumber}
        </span>
      ),
    },
    {
      key: 'panel',
      header: 'Panel',
      render: (row: ValidatedResultSummaryDto) => (
        <span className="text-slate-700 font-semibold text-xs">
          {row.panelName || '—'}
        </span>
      ),
    },
    {
      key: 'specimen',
      header: 'Specimen',
      render: (row: ValidatedResultSummaryDto) => (
        <div className="flex items-center gap-1.5 text-slate-500">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-['IBM_Plex_Mono'] text-[10px] font-semibold">
            {row.specimenType}
          </span>
        </div>
      ),
    },
    {
      key: 'validated',
      header: 'Validated',
      render: (row: ValidatedResultSummaryDto) => (
        <span className="font-['IBM_Plex_Mono'] text-slate-600 text-[10px]">
          {format(new Date(row.validatedAt), 'MMM d, HH:mm')}
        </span>
      ),
    },
    {
      key: 'by',
      header: 'By',
      render: (row: ValidatedResultSummaryDto) => (
        <span className="font-['IBM_Plex_Mono'] text-slate-500 text-[10px]">
          {row.validatedById ? row.validatedById.slice(0, 8) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <HmsStatusChip variant="warning" status="Validated" />,
    },
  ];

  const columns = canRelease
    ? [
        ...baseColumns,
        {
          key: 'action',
          header: '',
          render: (row: ValidatedResultSummaryDto) => {
            const isReleasing = releasingId === row.orderId;
            const releaseError = releaseMutation.isError && releasingId === row.orderId;
            const isConflict =
              releaseError &&
              axios.isAxiosError(releaseMutation.error) &&
              releaseMutation.error.response?.status === 409;

            return (
              <div className="text-right">
                {isReleasing ? (
                  <Loader2 className="h-4 w-4 text-indigo-500 animate-spin inline" />
                ) : isConflict ? (
                  <span className="text-[10px] text-amber-600 font-semibold">
                    Stale version — reload
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmRelease({
                        id: row.id,
                        orderId: row.orderId,
                        patientId: row.patientId,
                        version: row.version,
                      });
                    }}
                    className="text-[10px] font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Release
                  </button>
                )}
              </div>
            );
          },
        },
      ]
    : baseColumns;

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar>
          <span className="text-xs text-slate-500 font-medium">
            {isEmpty
              ? 'Queue empty'
              : `${results.length} result${results.length !== 1 ? 's' : ''} pending release`}
          </span>
          <div className="flex-grow" />
          <button
            onClick={() => refetch()}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Refresh
          </button>
        </HmsToolbar>
      }
      footer={<HmsAuditFooter dataSource="useValidatedResults → GET /api/v1/lab/validated-results" />}
    >
      <HmsPageHeader
        title="Validated Results — Pending Release"
        description="Results that have passed technical review and are awaiting release dispatch."
        badge="LIS QA Queue"
      />

      {/* Release Confirmation Modal */}
      {confirmRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 shadow-xl rounded-lg max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">
                Confirm Release
              </h3>
            </div>
            <div className="text-xs text-slate-600 font-medium space-y-2">
              <p>
                Releasing this result for clinical visibility means it will be visible to
                authorized staff and (where applicable) to patients through the patient
                portal.
              </p>
              <p className="font-bold text-slate-700">
                The result cannot be silently edited after release. Amendment or
                correction will require a separate future workflow.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleReleaseConfirm}
                className="flex items-center gap-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-lg transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Release Result
              </button>
              <button
                onClick={() => setConfirmRelease(null)}
                className="text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isEmpty ? (
        <HmsEmptyState
          title="No Validated Results"
          description="All validated results have been processed. New results will appear here after they pass technical review on the QA Verification page."
          action={
            <button
              onClick={() => navigate('/lab/validation')}
              className="text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
            >
              Go to QA Verification
            </button>
          }
        />
      ) : (
        <HmsDrilldownTable
          title="Validated Results Queue"
          keyExtractor={(row: ValidatedResultSummaryDto) => row.id}
          columns={columns}
          data={results}
        />
      )}

      {/* Accurate scope notice — release IS implemented */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="font-medium">
          These results have been technically reviewed and validated, but have{' '}
          <strong>not yet been released</strong>. Release is available to Branch Admin
          and Super Admin roles. Notification, patient portal access, and billing
          integration are not available in this phase.
        </p>
      </div>
    </HmsDashboardShell>
  );
};

export default ValidatedResultsPage;
