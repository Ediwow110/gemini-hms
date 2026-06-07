import { useNavigate } from 'react-router-dom';
import { useReleasedResults } from '../../hooks/use-clinical-workflow';
import { ReleasedResultQueueDto } from '../../services/clinicalWorkflow.service';
import { format } from 'date-fns';
import { AlertTriangle, FlaskConical } from 'lucide-react';
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

export const ReleasedResultsPage = () => {
  const navigate = useNavigate();
  const { data: results, isLoading, error, refetch } = useReleasedResults();

  if (isLoading) {
    return (
      <HmsDashboardShell>
        <HmsPageHeader
          title="Released Results"
          description="Results approved and released for clinical visibility."
          badge="LIS Registry"
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
          title="Released Results"
          description="Results approved and released for clinical visibility."
          badge="LIS Registry"
        />
        <HmsDataUnavailable
          sectionName={isForbidden ? 'Access Restricted' : 'Connection Error'}
          expectedApi={
            isForbidden
              ? 'You do not have permission to view released results.'
              : 'Failed to load released results. Please try again.'
          }
        />
      </HmsDashboardShell>
    );
  }

  const isEmpty = !results || results.length === 0;

  const columns = [
    {
      key: 'patient',
      header: 'Patient',
      render: (row: ReleasedResultQueueDto) => (
        <span className="font-bold text-slate-800 font-['IBM_Plex_Sans']">
          {row.patientName}
        </span>
      ),
    },
    {
      key: 'mrn',
      header: 'MRN',
      render: (row: ReleasedResultQueueDto) => (
        <span className="font-['IBM_Plex_Mono'] text-slate-500 text-[10px]">
          {row.patientNumber}
        </span>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      render: (row: ReleasedResultQueueDto) => (
        <span className="font-['IBM_Plex_Mono'] text-slate-600 font-semibold text-[10px]">
          {row.orderNumber}
        </span>
      ),
    },
    {
      key: 'panel',
      header: 'Panel',
      render: (row: ReleasedResultQueueDto) => (
        <span className="text-slate-700 font-semibold text-xs">
          {row.panelName || '—'}
        </span>
      ),
    },
    {
      key: 'specimen',
      header: 'Specimen',
      render: (row: ReleasedResultQueueDto) => (
        <div className="flex items-center gap-1.5 text-slate-500">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-['IBM_Plex_Mono'] text-[10px] font-semibold">
            {row.specimenType}
          </span>
        </div>
      ),
    },
    {
      key: 'released',
      header: 'Released',
      render: (row: ReleasedResultQueueDto) => (
        <span className="font-['IBM_Plex_Mono'] text-slate-600 text-[10px]">
          {format(new Date(row.releasedAt), 'MMM d, HH:mm')}
        </span>
      ),
    },
    {
      key: 'releasedBy',
      header: 'Released By',
      render: (row: ReleasedResultQueueDto) => (
        <span className="font-['IBM_Plex_Mono'] text-slate-500 text-[10px]">
          {row.releasedById ? row.releasedById.slice(0, 8) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <HmsStatusChip variant="success" status="Released" />,
    },
  ];

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar>
          <span className="text-xs text-slate-500 font-medium">
            {isEmpty
              ? 'No released results'
              : `${results.length} result${results.length !== 1 ? 's' : ''} released`}
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
      footer={<HmsAuditFooter dataSource="useReleasedResults → GET /api/v1/lab/released-results" />}
    >
      <HmsPageHeader
        title="Released Results"
        description="Results approved and released for clinical visibility."
        badge="LIS Registry"
      />

      {isEmpty ? (
        <HmsEmptyState
          title="No Released Results"
          description="No results have been released yet. Release validated results from the Pending Release queue."
          action={
            <button
              onClick={() => navigate('/lab/validated')}
              className="text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
            >
              Go to Pending Release
            </button>
          }
        />
      ) : (
        <HmsDrilldownTable
          title="Released Results Log"
          keyExtractor={(row: ReleasedResultQueueDto) => row.id}
          columns={columns}
          data={results}
          onRowClick={(row: ReleasedResultQueueDto) => navigate(`/lab/released/${row.patientId}/${row.orderId}`)}
        />
      )}

      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
        <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="font-medium">
          These results have been <strong>released</strong> for clinical visibility.
          Notification, billing integration, and further amendment workflows are not
          available in this phase.
        </p>
      </div>
    </HmsDashboardShell>
  );
};

export default ReleasedResultsPage;
