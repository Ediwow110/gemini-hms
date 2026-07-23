import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  FlaskConical,
  FileText,
  AlertTriangle,
  Send,
  Inbox,
  FileCheck2,
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
  HmsTrendChart,
  HmsDataUnavailable,
} from '../../components/hms-dashboard';
import { usePendingSpecimens, useCriticalResults, useTurnaroundMetrics } from '../../hooks/use-lab';
import { format } from 'date-fns';
import type { PendingSpecimenDto, CriticalResultDto, TurnaroundMetricDto } from '../../services/lab.service';

export const LabDashboard = () => {
  const navigate = useNavigate();

  // ──── Real API Hooks ────
  const { specimens: pendingSpecimens, isLoading: loadingSpecimens, error: errorSpecimens } = usePendingSpecimens();
  const { criticalResults: openCriticalResults, isLoading: loadingCritical, error: errorCritical } = useCriticalResults('OPEN');
  const { data: tatData, isLoading: loadingTat, error: errorTat } = useTurnaroundMetrics();

  const isLoading = loadingSpecimens || loadingCritical || loadingTat;
  const hasError = errorSpecimens || errorCritical || errorTat;

  // ── Load timestamp (captured once when loading completes) ──
  const [loadedTimestamp, setLoadedTimestamp] = useState(null as Date | null);
  useEffect(() => {
    if (!isLoading && !loadedTimestamp) {
      setLoadedTimestamp(new Date());
    }
  }, [isLoading, loadedTimestamp]);

  // ──── Derived Metrics ────
  const pendingCount = Array.isArray(pendingSpecimens) ? pendingSpecimens.length : 0;
  const criticalOpenCount = Array.isArray(openCriticalResults) ? openCriticalResults.length : 0;
  const releasedCount = tatData?.releasedCount ?? 0;
  const pendingResultsCount = tatData?.pendingCount ?? 0;

  const avgSpecToRelease = tatData?.metrics
    ?.find((m: TurnaroundMetricDto) => m.field === 'specimenToRelease')?.averageMinutes ?? null;

  const missingTimestampCount = tatData?.metrics
    ?.reduce((sum: number, m: TurnaroundMetricDto) => sum + (m.missingTimestampCount ?? 0), 0) ?? 0;

  // ──── Map specimens ────
  const specimenItems = (Array.isArray(pendingSpecimens) ? pendingSpecimens : []).map((s: PendingSpecimenDto) => ({
    id: s.id,
    patientName: s.patientName || '—',
    mrn: s.patientMrn || '—',
    specimenType: s.specimenType || '—',
    testName: Array.isArray(s.testNames) ? s.testNames.join(', ') : s.specimenType || '—',
    collectedTime: s.collectedAt ? format(new Date(s.collectedAt), 'hh:mm a') : '—',
    status: s.status === 'RECEIVED' ? 'Received' as const : 'Collected' as const,
  }));

  // ──── Map critical results ────
  const criticalItems = (Array.isArray(openCriticalResults) ? openCriticalResults : []).map((r: CriticalResultDto) => ({
    id: r.id,
    patientName: r.patientName || '—',
    mrn: r.patientMrn || '—',
    testName: Array.isArray(r.testNames) ? r.testNames.join(', ') : 'Lab Result',
    reportedAt: r.encodedAt ? format(new Date(r.encodedAt), 'MMM dd, hh:mm a') : 'Unknown',
  }));

  // ──── TAT cards ────
  const tatCards = tatData?.metrics
    ?.filter((m: TurnaroundMetricDto) => m.count > 0)
    ?.map((m: TurnaroundMetricDto) => ({
      id: m.field || m.label,
      label: m.label || m.field,
      value: m.averageMinutes ? `${Math.round(m.averageMinutes)}m` : '—',
      status: (m.averageMinutes !== null && m.averageMinutes > 120 ? 'breached' : m.averageMinutes !== null && m.averageMinutes > 60 ? 'at_risk' : 'on_track') as 'breached' | 'at_risk' | 'on_track',
      drilldownHref: '/lab/turnaround',
      threshold: 120,
      current: m.averageMinutes ? Math.round(m.averageMinutes) : 0,
    })) ?? [];

  // ──── Error State ────
  if (hasError && !isLoading) {
    return (
      <div className="mx-auto py-16 text-center space-y-4">
        <div className="mx-auto w-14 h-14 bg-rose-50 text-rose-600 rounded-md flex items-center justify-center border border-rose-200">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Connection Error</h2>
        <p className="text-[13px] text-slate-500 max-w-md mx-auto">
          Failed to load lab dashboard data. Please check your network connection or try again later.
        </p>
      </div>
    );
  }

  // ──── Loading State ────
  if (isLoading) {
    return (
      <div className="mx-auto py-4 space-y-5">
        <div className="flex flex-wrap gap-x-6 gap-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1 border-l-2 border-l-slate-300 pl-3">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-5 w-16 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 xl:col-span-8 space-y-5">
            <div className="h-48 animate-pulse rounded-md bg-slate-100" />
            <div className="h-32 animate-pulse rounded-md bg-slate-100" />
          </div>
          <div className="col-span-12 xl:col-span-4 space-y-5">
            <div className="h-48 animate-pulse rounded-md bg-slate-100" />
            <div className="h-24 animate-pulse rounded-md bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  // ── Metrics ──
  const metrics = [
    { id: 'pending-spec', label: 'Pending Specimens', value: pendingCount, severity: 'info' as const, href: '/lab/specimens' },
    { id: 'in-progress', label: 'In Progress', value: pendingResultsCount, severity: 'warning' as const, href: '/lab/encoding' },
    { id: 'released', label: 'Released Today', value: releasedCount, severity: 'success' as const, href: '/lab/released' },
    { id: 'critical', label: 'Open Critical', value: criticalOpenCount, severity: criticalOpenCount > 0 ? 'critical' as const : 'success' as const, href: '/lab/critical-results' },
    { id: 'avg-tat', label: 'Avg TAT', value: avgSpecToRelease !== null ? `${avgSpecToRelease}m` : '—', severity: 'info' as const, href: '/lab/turnaround' },
    { id: 'missing-ts', label: 'Missing TS', value: missingTimestampCount, severity: missingTimestampCount > 0 ? 'warning' as const : 'success' as const, href: '/lab/turnaround' },
  ];

  // ── Alerts ──
  const alertItems = criticalItems.slice(0, 3).map((r) => ({
    id: `crit-${r.id}`,
    severity: 'critical' as const,
    title: `Critical: ${r.testName}`,
    message: `${r.patientName} — ${r.reportedAt}`,
    actionLabel: 'View Result',
    actionHref: `/lab/critical-results?resultId=${r.id}`,
  }));

  // ── Pending work stages ──
  const pendingWorkItems = tatData?.metrics
    ?.filter((m: TurnaroundMetricDto) => m.field?.includes('pending') || m.field?.includes('encode') || m.field?.includes('validate'))
    ?.map((m: TurnaroundMetricDto) => ({
      id: m.field || m.label,
      label: m.label || m.field,
      count: m.count ?? 0,
    })) ?? [];

  const pendingTableItems = pendingWorkItems.length > 0
    ? pendingWorkItems.map((w) => ({
        id: w.id,
        stage: w.label,
        count: w.count,
      }))
    : [];

  // ── Quick Actions ──
  const actions = [
    { id: 'orders', label: 'Lab Orders Queue', icon: <Inbox className="h-4 w-4" />, href: '/lab/orders' },
    { id: 'specimens', label: 'Specimen Receiving', icon: <FlaskConical className="h-4 w-4" />, href: '/lab/specimens' },
    { id: 'encode', label: 'Result Encoding', icon: <FileText className="h-4 w-4" />, href: '/lab/encoding' },
    { id: 'validate', label: 'Verification', icon: <FileCheck2 className="h-4 w-4" />, href: '/lab/validation' },
    { id: 'release', label: 'Release Results', icon: <Send className="h-4 w-4" />, href: '/lab/released' },
  ];

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          role="Lab Technician"
          lastRefreshed={loadedTimestamp ?? undefined}
        />
      }
      footer={
        <HmsAuditFooter
          lastRefreshed={loadedTimestamp ?? undefined}
          dataSource="Live API (specimens, critical results, TAT)"
        />
      }
    >
      {/* Alert Rail */}
      <HmsAlertRail alerts={alertItems} />

      {/* KPI Strip */}
      <HmsKpiStrip metrics={metrics} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left Column — 8/12 cols desktop, 12 cols tablet/mobile */}
        <div className="col-span-12 xl:col-span-8 space-y-5">
          {/* Specimen Work Queue */}
          <HmsWorkQueue
            title="Specimen Work Queue"
            data={specimenItems}
            keyExtractor={(item) => item.id}
            columns={[
              { key: 'patient', header: 'Patient', render: (item) => (
                <span className="font-semibold text-slate-800">{item.patientName}</span>
              )},
              { key: 'specimen', header: 'Specimen', render: (item) => (
                <span className="text-slate-600">{item.specimenType}</span>
              )},
              { key: 'test', header: 'Test', render: (item) => (
                <span className="text-slate-600 truncate max-w-[160px] inline-block">{item.testName}</span>
              )},
              { key: 'collected', header: 'Collected', width: 'w-20', render: (item) => (
                <span className="font-mono text-slate-400">{item.collectedTime}</span>
              )},
              { key: 'status', header: 'Status', width: 'w-24', render: (item) => (
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                  item.status === 'Received'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {item.status}
                </span>
              )},
              { key: 'action', header: '', width: 'w-20', render: (item) => (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); navigate(`/lab/specimens?specimenId=${item.id}`); }}
                  className="text-[12px] font-semibold text-sky-600 hover:text-sky-700"
                >
                  Process →
                </button>
              )},
            ]}
            loading={isLoading}
            emptyMessage="No pending specimens"
            maxRows={6}
            viewAllLink="/lab/specimens"
          />

          {/* Pending Validation/Release Table */}
          {pendingTableItems.length > 0 ? (
            <HmsDrilldownTable
              title="Pending Work by Stage"
              data={pendingTableItems}
              keyExtractor={(item) => item.id}
              columns={[
                { key: 'stage', header: 'Stage', render: (item) => (
                  <span className="font-semibold text-slate-800">{item.stage}</span>
                )},
                { key: 'count', header: 'Count', width: 'w-16', render: (item) => (
                  <span className="font-mono font-bold text-slate-900">{item.count}</span>
                )},
              ]}
              maxRows={6}
              viewAllLink="/lab/encoding"
            />
          ) : (
            <HmsDataUnavailable
              sectionName="Pending Validation/Release"
              expectedApi="/api/v1/lab/pending-stages"
              expectedPhase="Stage-level breakdown"
            />
          )}

          {/* TAT Trend Chart */}
          <HmsTrendChart
            title="TAT Trend (14 days)"
            description="Turnaround time trend — data pending live integration"
            chart={
              <div className="flex items-center justify-center h-full text-[12px] text-slate-400 font-medium">
                Chart data pending API integration
              </div>
            }
            height={200}
            empty
          />
        </div>

        {/* Right Column — 4/12 cols desktop, 12 cols tablet/mobile */}
        <div className="col-span-12 xl:col-span-4 space-y-5">
          {/* TAT SLA Compliance */}
          {tatCards.length > 0 ? (
            <HmsSlaPanel title="TAT SLA Compliance" items={tatCards} />
          ) : (
            <HmsDataUnavailable
              sectionName="TAT SLA Compliance"
              expectedApi="/api/v1/lab/turnaround-metrics"
              expectedPhase="Requires TAT data"
            />
          )}

          {/* Critical Results */}
          {criticalItems.length > 0 ? (
            <HmsDrilldownTable
              title="Critical Results"
              data={criticalItems}
              keyExtractor={(item) => item.id}
              columns={[
                { key: 'patient', header: 'Patient', render: (item) => (
                  <span className="font-semibold text-slate-800">{item.patientName}</span>
                )},
                { key: 'test', header: 'Test', render: (item) => (
                  <span className="text-slate-600">{item.testName}</span>
                )},
                { key: 'reported', header: 'Reported', width: 'w-28', render: (item) => (
                  <span className="font-mono text-slate-400 text-[11px]">{item.reportedAt}</span>
                )},
                { key: 'action', header: '', width: 'w-16', render: (item) => (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate(`/lab/critical-results?resultId=${item.id}`); }}
                    className="text-[12px] font-semibold text-rose-600 hover:text-rose-700"
                  >
                    View →
                  </button>
                )},
              ]}
              maxRows={5}
              viewAllLink="/lab/critical-results"
            />
          ) : (
            <HmsDataUnavailable
              sectionName="Critical Results"
              expectedApi="/api/v1/lab/critical-results"
              expectedPhase="No open critical results"
            />
          )}

          {/* Quick Actions */}
          <HmsQuickActions actions={actions} title="Lab Actions" columns={1} />
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default LabDashboard;
