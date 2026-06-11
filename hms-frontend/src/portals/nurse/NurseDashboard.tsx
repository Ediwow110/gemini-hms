import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  CheckSquare,
  UserPlus,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
  HmsKpiStrip,
  HmsAlertRail,
  HmsWorkQueue,
  HmsSlaPanel,
  HmsDrilldownTable,
  HmsQuickActions,
  HmsLoadingSkeleton,
} from '../../components/hms-dashboard';
import { useClinicalDashboardSummary, useClinicalWorkQueue } from '../../hooks/use-clinical-workflow';
import { useNursingTasks } from '../../hooks/use-nursing-tasks';
import { format } from 'date-fns';
import axios from 'axios';
import type { ClinicalWorkQueueDto } from '../../services/clinicalWorkflow.service';

export const NurseDashboard = () => {
  const navigate = useNavigate();

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useClinicalDashboardSummary();
  const { data: queueData, isLoading: isQueueLoading, error: queueError } = useClinicalWorkQueue();
  const { tasks: nursingTasks, isLoading: isNursingLoading } = useNursingTasks();

  const isLoading = isSummaryLoading || isQueueLoading || isNursingLoading;
  const errorObj = summaryError || queueError;
  const realTaskCount = Array.isArray(nursingTasks)
    ? nursingTasks.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length
    : 0;

  // ── Error State ──
  if (errorObj) {
    const isForbidden = axios.isAxiosError(errorObj) && (errorObj.response?.status === 403 || errorObj.response?.status === 401);
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-16 text-center space-y-4">
        <div className="mx-auto w-14 h-14 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center border border-rose-100">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          {isForbidden ? 'Access Restricted' : 'Connection Error'}
        </h2>
        <p className="text-[13px] text-slate-500 max-w-md mx-auto">
          {isForbidden
            ? 'You do not have permission to view the nursing dashboard. Please contact your administrator if you believe this is an error.'
            : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-4 space-y-6">
        <div className="flex flex-wrap gap-x-6 gap-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1 border-l-2 border-l-slate-200 pl-3">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-5 w-16 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8 space-y-6">
            <HmsLoadingSkeleton variant="table" />
            <HmsLoadingSkeleton variant="table" />
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
  const metrics = [
    {
      id: 'triage-waiting',
      label: 'Triage Waiting',
      value: summary?.pendingTriage ?? '—',
      severity: 'info' as const,
      href: '/nurse/triage',
    },
    {
      id: 'vitals-due',
      label: 'Vitals Due',
      value: summary?.pendingTriage ?? '—',
      severity: 'warning' as const,
      href: '/nurse/vitals',
    },
    {
      id: 'specimens',
      label: 'Specimen Queue',
      value: queueData?.filter((q: ClinicalWorkQueueDto) => q.serviceType === 'LABORATORY' && q.status !== 'COMPLETED').length ?? 0,
      severity: 'info' as const,
      href: '/nurse/specimens',
    },
    {
      id: 'nursing-tasks',
      label: 'Nursing Tasks',
      value: realTaskCount,
      severity: realTaskCount > 10 ? 'warning' as const : 'info' as const,
      href: '/nurse/tasks',
    },
    {
      id: 'handoff',
      label: 'Ready for Doctor',
      value: summary?.waitingForDoctor ?? '—',
      severity: 'success' as const,
      href: '/doctor/queue',
    },
    {
      id: 'critical-vitals',
      label: 'Critical Vitals',
      value: '—',
      severity: 'info' as const,
    },
  ];

  // ── Alerts ──
  const alerts: Array<{ id: string; severity: 'critical' | 'warning' | 'success'; title: string; message: string }> = [];

  // ── Triage Queue ──
  const triageItems = queueData
    ? queueData
        .filter((item: ClinicalWorkQueueDto) => item.status !== 'COMPLETED' && item.status !== 'CANCELLED')
        .slice(0, 5)
        .map((item: ClinicalWorkQueueDto) => ({
          id: item.id,
          patientId: item.patientId,
          name: item.patientName || '[REDACTED]',
          time: item.timestamp ? format(new Date(item.timestamp), 'hh:mm a') : 'N/A',
          priority: item.category === 'EMERGENCY' ? 'emergency' as const
                    : item.category === 'PRIORITY' ? 'critical' as const
                    : item.category === 'URGENT' ? 'urgent' as const
                    : 'routine' as const,
        }))
    : [];

  // ── Specimen Queue ──
  const specimenItems = queueData
    ? queueData
        .filter((q: ClinicalWorkQueueDto) => q.serviceType === 'LABORATORY' && q.status !== 'COMPLETED')
        .slice(0, 5)
        .map((item: ClinicalWorkQueueDto) => ({
          id: item.id,
          patientId: item.patientId,
          name: item.patientName || '[REDACTED]',
          time: item.timestamp ? format(new Date(item.timestamp), 'hh:mm a') : 'N/A',
        }))
    : [];

  // ── Nursing Tasks by Urgency ──
  const taskItems = Array.isArray(nursingTasks)
    ? nursingTasks
        .filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS')
        .slice(0, 8)
        .map(t => ({
          id: t.id,
          title: t.title || 'Unnamed Task',
          patientName: t.patientName || '—',
          priority: t.priority === 'HIGH' || t.priority === 'URGENT' ? 'critical' as const
                    : t.priority === 'MEDIUM' ? 'urgent' as const
                    : 'routine' as const,
          status: t.status === 'IN_PROGRESS' ? ('In Progress' as const) : ('Open' as const),
          statusVariant: t.status === 'IN_PROGRESS' ? ('success' as const) : ('warning' as const),
          patientId: t.patientId,
        }))
    : [];

  // ── SLA — Vitals Compliance ──
  const slaItems = summary ? [
    {
      id: 'vitals-overdue',
      label: 'Vitals Overdue',
      value: summary.pendingTriage > 0 ? summary.pendingTriage : 0,
      status: (summary.pendingTriage ?? 0) > 5 ? 'at_risk' as const
              : (summary.pendingTriage ?? 0) > 0 ? 'at_risk' as const
              : 'on_track' as const,
      drilldownHref: '/nurse/vitals',
    },
    {
      id: 'handoff-ready',
      label: 'Handoff Ready',
      value: summary.waitingForDoctor ?? 0,
      status: (summary.waitingForDoctor ?? 0) > 3 ? 'at_risk' as const : 'on_track' as const,
      drilldownHref: '/doctor/queue',
    },
  ] : [];

  // ── Quick Actions ──
  const actions = [
    { id: 'intake', label: 'Patient Intake', icon: <UserPlus className="h-4 w-4" />, href: '/nurse/intake' },
    { id: 'vitals', label: 'Record Vitals', icon: <Activity className="h-4 w-4" />, href: '/nurse/vitals' },
    { id: 'tasks', label: 'Task Board', icon: <CheckSquare className="h-4 w-4" />, href: '/nurse/tasks' },
    { id: 'specimens', label: 'Specimen Collection', icon: <FlaskConical className="h-4 w-4" />, href: '/nurse/specimens' },
  ];

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName={summary?.branchId ?? undefined}
          role="Nurse"
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
      <HmsKpiStrip metrics={metrics} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column — 8/12 cols desktop, 12 cols tablet/mobile */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          {/* Triage Queue */}
          <HmsWorkQueue
            title="Triage Queue"
            data={triageItems}
            keyExtractor={(item) => item.id}
            columns={[
              { key: 'priority', header: 'Priority', width: 'w-24', render: (item) => (
                <span className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${
                    item.priority === 'emergency' ? 'bg-rose-500'
                    : item.priority === 'critical' ? 'bg-amber-500'
                    : item.priority === 'urgent' ? 'bg-blue-500'
                    : 'bg-slate-400'
                  }`} />
                  <span className={`text-[11px] font-semibold ${
                    item.priority === 'emergency' ? 'text-rose-700'
                    : item.priority === 'critical' ? 'text-amber-700'
                    : item.priority === 'urgent' ? 'text-blue-700'
                    : 'text-slate-500'
                  }`}>
                    {item.priority.toUpperCase()}
                  </span>
                </span>
              )},
              { key: 'patient', header: 'Patient', render: (item) => (
                <span className="font-semibold text-slate-800">{item.name}</span>
              )},
              { key: 'time', header: 'Since', width: 'w-20', render: (item) => (
                <span className="font-mono text-slate-400">{item.time}</span>
              )},
              { key: 'action', header: '', width: 'w-24', render: (item) => (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); navigate(`/nurse/triage?patientId=${item.patientId}`); }}
                  className="text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  Start Triage →
                </button>
              )},
            ]}
            loading={isLoading}
            emptyMessage="No patients in triage queue"
            maxRows={5}
            viewAllLink="/nurse/triage"
          />

          {/* Specimen Collection Queue */}
          <HmsWorkQueue
            title="Specimen Collection"
            data={specimenItems}
            keyExtractor={(item) => item.id}
            emptyMessage="No specimens pending collection"
            columns={[
              { key: 'patient', header: 'Patient', render: (item) => (
                <span className="font-semibold text-slate-800">{item.name}</span>
              )},
              { key: 'time', header: 'Since', width: 'w-20', render: (item) => (
                <span className="font-mono text-slate-400">{item.time}</span>
              )},
              { key: 'action', header: '', width: 'w-28', render: (item) => (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); navigate(`/nurse/specimens?patientId=${item.patientId}`); }}
                  className="text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  Collect →
                </button>
              )},
            ]}
            loading={isLoading}
            maxRows={5}
            viewAllLink="/nurse/specimens"
          />

          {/* Nursing Tasks by Urgency */}
          <HmsDrilldownTable
            title="Nursing Tasks by Urgency"
            data={taskItems}
            keyExtractor={(item) => item.id}
            emptyMessage="No open nursing tasks"
            columns={[
              { key: 'task', header: 'Task', render: (item) => (
                <span className="font-semibold text-slate-800">{item.title}</span>
              )},
              { key: 'patient', header: 'Patient', render: (item) => (
                <span className="text-slate-600">{item.patientName}</span>
              )},
              { key: 'priority', header: 'Priority', width: 'w-20', render: (item) => (
                <span className={`text-[11px] font-semibold ${
                  item.priority === 'critical' ? 'text-rose-700'
                  : item.priority === 'urgent' ? 'text-blue-700'
                  : 'text-slate-500'
                }`}>
                  {item.priority.toUpperCase()}
                </span>
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
                  onClick={(e) => { e.stopPropagation(); navigate(`/nurse/tasks?taskId=${item.id}`); }}
                  className="text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  Open →
                </button>
              )},
            ]}
          />
        </div>

        {/* Right Column — 4/12 cols desktop, 12 cols tablet/mobile */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* SLA Panel — Vitals Compliance */}
          {slaItems.length > 0 && (
            <HmsSlaPanel title="Vitals &amp; Handoff" items={slaItems} />
          )}

          {/* Quick Actions */}
          <HmsQuickActions actions={actions} title="Actions" />
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default NurseDashboard;
