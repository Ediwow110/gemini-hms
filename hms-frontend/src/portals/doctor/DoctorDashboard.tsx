import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  AlertTriangle,
  FilePlus,
  ListOrdered,
} from 'lucide-react';
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
  HmsKpiStrip,
  HmsAlertRail,
  HmsWorkQueue,
  HmsSlaPanel,
  HmsQuickActions,
  HmsDataUnavailable,
  HmsLoadingSkeleton,
} from '../../components/hms-dashboard';
import { useClinicalDashboardSummary, useClinicalWorkQueue } from '../../hooks/use-clinical-workflow';
import { format } from 'date-fns';
import axios from 'axios';
import type { ClinicalWorkQueueDto } from '../../services/clinicalWorkflow.service';

export const DoctorDashboard = () => {
  const navigate = useNavigate();

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useClinicalDashboardSummary();
  const { data: queueData, isLoading: isQueueLoading, error: queueError } = useClinicalWorkQueue();

  const isLoading = isSummaryLoading || isQueueLoading;
  const errorObj = summaryError || queueError;

  // ── Error State ──
  if (errorObj) {
    const isForbidden = axios.isAxiosError(errorObj) && (errorObj.response?.status === 403 || errorObj.response?.status === 401);
    return (
      <div className="mx-auto py-16 text-center space-y-4">
        <div className="mx-auto w-14 h-14 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center border border-rose-100">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          {isForbidden ? 'Access Restricted' : 'Connection Error'}
        </h2>
        <p className="text-[13px] text-slate-500 max-w-md mx-auto">
          {isForbidden
            ? 'You do not have permission to view the clinical dashboard. Please contact your administrator if you believe this is an error.'
            : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="mx-auto py-4 space-y-6">
        <div className="flex flex-wrap gap-x-6 gap-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1 border-l-2 border-l-slate-300 pl-3">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-5 w-16 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8 space-y-6">
            <HmsLoadingSkeleton variant="table" />
            <HmsLoadingSkeleton variant="panel" />
          </div>
          <div className="col-span-12 xl:col-span-4 space-y-6">
            <HmsLoadingSkeleton variant="panel" />
            <HmsLoadingSkeleton variant="panel" />
          </div>
        </div>
      </div>
    );
  }

  // ── Derived Metrics ──
  const metrics = summary ? [
    {
      id: 'assigned',
      label: 'Assigned Patients',
      value: summary.waitingForDoctor,
      severity: 'info' as const,
      href: '/doctor/queue',
    },
    {
      id: 'active',
      label: 'Active Encounters',
      value: summary.activePatients,
      severity: 'info' as const,
      href: '/doctor/queue',
    },
    {
      id: 'pending-triage',
      label: 'Pending Triage',
      value: summary.pendingTriage,
      severity: 'warning' as const,
    },
    {
      id: 'pending-lab',
      label: 'Pending Lab Results',
      value: summary.pendingLabResults,
      severity: 'warning' as const,
      href: '/doctor/emr',
    },
    {
      id: 'unsigned-notes',
      label: 'Unsigned Notes',
      value: '—',
      severity: 'info' as const,
    },
    {
      id: 'appointments',
      label: "Today's Appointments",
      value: '—',
      severity: 'info' as const,
    },
  ] : [];

  // ── Alerts ──
  const alerts: Array<{ id: string; severity: 'critical' | 'warning' | 'success'; title: string; message: string; }> = [];

  // ── Queue Data ──
  const queueItems = (queueData ?? []).slice(0, 8).map((item: ClinicalWorkQueueDto) => ({
    id: item.id,
    patientId: item.patientId,
    patientName: item.patientName || '[REDACTED]',
    time: item.timestamp ? format(new Date(item.timestamp), 'hh:mm a') : 'N/A',
    priority: item.category === 'EMERGENCY' ? 'emergency' as const
              : item.category === 'PRIORITY' ? 'critical' as const
              : item.category === 'URGENT' ? 'urgent' as const
              : 'routine' as const,
    status: item.status === 'SERVING' ? ('In Progress' as const) : ('Waiting' as const),
    statusVariant: item.status === 'SERVING' ? ('success' as const) : ('warning' as const),
  }));

  // ── SLA Data (derived from queue waiting times) ──
  const totalQueue = queueData?.length ?? 0;
  const waitingCount = queueData?.filter((q: ClinicalWorkQueueDto) => q.status !== 'SERVING' && q.status !== 'COMPLETED').length ?? 0;
  const slaItems = totalQueue > 0 ? [
    {
      id: 'queue-total',
      label: 'Patients in Queue',
      value: totalQueue,
      status: waitingCount > 10 ? 'at_risk' as const : 'on_track' as const,
      drilldownHref: '/doctor/queue',
    },
    {
      id: 'waiting',
      label: 'Waiting for Service',
      value: waitingCount,
      status: waitingCount > 5 ? 'at_risk' as const : 'on_track' as const,
      drilldownHref: '/doctor/queue',
    },
  ] : [];

  // ── Quick Actions ──
  const actions = [
    { id: 'queue', label: 'Patient Queue', icon: <ListOrdered className="h-4 w-4" />, href: '/doctor/queue' },
    { id: 'chart', label: 'Open Patient Chart', icon: <FileText className="h-4 w-4" />, href: '/doctor/emr' },
    { id: 'patients', label: 'Search Patients', icon: <Users className="h-4 w-4" />, href: '/doctor/patients' },
    { id: 'orders', label: 'New Orders', icon: <FilePlus className="h-4 w-4" />, href: '/doctor/emr' },
  ];

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName={summary?.branchId ?? undefined}
          role="Doctor"
          lastRefreshed={summary?.timestamp ? new Date(summary.timestamp) : undefined}
        />
      }
      footer={
        <HmsAuditFooter
          lastRefreshed={summary?.timestamp ? new Date(summary.timestamp) : undefined}
          dataSource={summary?.accessLabel === 'PUBLIC' ? 'Live API' : 'Clinical API'}
        />
      }
    >
      {/* Alert Rail */}
      <HmsAlertRail alerts={alerts} />

      {/* KPI Strip */}
      {metrics.length > 0 && <HmsKpiStrip metrics={metrics} />}

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left Column — 8/12 cols desktop, 12 cols tablet/mobile */}
        <div className="col-span-12 xl:col-span-8 space-y-5">
          {/* Patient Queue */}
          <HmsWorkQueue
            title="My Patient Queue"
            data={queueItems}
            keyExtractor={(item) => item.id}
            columns={[
              { key: 'priority', header: 'Priority', width: 'w-24', render: (item) => (
                <span className={`inline-flex items-center gap-1.5`}>
                  <span className={`h-2 w-2 rounded-full ${
                    item.priority === 'emergency' ? 'bg-rose-500'
                    : item.priority === 'critical' ? 'bg-amber-500'
                    : item.priority === 'urgent' ? 'bg-sky-500'
                    : 'bg-slate-400'
                  }`} />
                  <span className={`text-[11px] font-semibold ${
                    item.priority === 'emergency' ? 'text-rose-700'
                    : item.priority === 'critical' ? 'text-amber-700'
                    : item.priority === 'urgent' ? 'text-sky-700'
                    : 'text-slate-500'
                  }`}>
                    {item.priority.toUpperCase()}
                  </span>
                </span>
              )},
              { key: 'patient', header: 'Patient', render: (item) => (
                <span className="font-semibold text-slate-800">{item.patientName}</span>
              )},
              { key: 'time', header: 'Since', width: 'w-20', render: (item) => (
                <span className="font-mono text-slate-400">{item.time}</span>
              )},
              { key: 'status', header: 'Status', width: 'w-24', render: (item) => (
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                  item.statusVariant === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {item.status}
                </span>
              )},
              { key: 'action', header: '', width: 'w-20', render: (item) => (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); navigate(`/doctor/emr?patientId=${item.patientId}`); }}
                  className="text-[12px] font-semibold text-sky-600 hover:text-sky-700"
                >
                  Chart →
                </button>
              )},
            ]}
            loading={isLoading}
            emptyMessage="No active patients in queue"
            maxRows={8}
            viewAllLink="/doctor/queue"
          />

          {/* Schedule — data unavailable */}
          <HmsDataUnavailable
            sectionName="Today's Schedule"
            expectedApi="/api/v1/doctor/schedule"
            expectedPhase="Phase 2"
          />

          {/* Pending Orders — data unavailable */}
          <HmsDataUnavailable
            sectionName="Pending Orders & Results"
            expectedApi="/api/v1/doctor/orders/pending"
            expectedPhase="Phase 2"
          />
        </div>

        {/* Right Column — 4/12 cols desktop, 12 cols tablet/mobile */}
        <div className="col-span-12 xl:col-span-4 space-y-5">
          {/* SLA Panel */}
          {slaItems.length > 0 && (
            <HmsSlaPanel title="Queue Thresholds" items={slaItems} />
          )}

          {/* Critical Results — data unavailable (no dedicated doctor-critical endpoint) */}
          <HmsDataUnavailable
            sectionName="Critical Results"
            expectedApi="/api/v1/doctor/critical-results"
            expectedPhase="Phase 2"
          />

          {/* Quick Actions */}
          <HmsQuickActions actions={actions} title="Quick Actions" />
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default DoctorDashboard;
