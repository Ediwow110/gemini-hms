import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChartCard,
  ComparisonBarChart,
  DashboardFilterBar,
  InsightPanel,
  StatusDonutChart,
  TrendLineChart,
} from '../../components/analytics';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsAlertRail,
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsDrilldownTable,
  HmsKpiStrip,
  HmsToolbar,
} from '../../components/hms-dashboard';
import {
  demoAdminDashboard,
  shouldUseDashboardDemo,
} from '../../data/dashboard-demo';
import { dashboardService } from '../../services/dashboard.service';
import type {
  AdminDashboardAlertsResponse,
  AdminDashboardSummary,
  AdminDashboardTopListsResponse,
  DateRange,
  TrendPoint,
} from '../../types/analytics';

const today = new Date();
const sevenDaysAgo = new Date(today.getTime() - 7 * 86_400_000);
const INITIAL_DATE_RANGE: DateRange = {
  from: sevenDaysAgo.toISOString().slice(0, 10),
  to: today.toISOString().slice(0, 10),
};

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

export const AdminExecutiveDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(INITIAL_DATE_RANGE);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<AdminDashboardAlertsResponse | null>(null);
  const [topLists, setTopLists] = useState<AdminDashboardTopListsResponse | null>(null);
  const [patientTrend, setPatientTrend] = useState<TrendPoint[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const filters = { dateRange };
      const [summaryResponse, alertsResponse, listsResponse, patientResponse, revenueResponse] = await Promise.all([
        dashboardService.getAdminSummary(filters),
        dashboardService.getAdminAlerts(),
        dashboardService.getAdminTopLists(),
        dashboardService.getAdminTrends(filters),
        dashboardService.getAdminTrends({ ...filters, dimension: 'revenue' }),
      ]);
      setSummary(summaryResponse);
      setAlerts(alertsResponse);
      setTopLists(listsResponse);
      setPatientTrend(patientResponse);
      setRevenueTrend(revenueResponse);
      setLastUpdated(new Date());
    } catch {
      setError('Executive analytics could not be loaded from the live APIs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const hasLiveData = Boolean(
    summary &&
      (summary.activePatients > 0 ||
        summary.todaysAppointments > 0 ||
        summary.revenue > 0 ||
        patientTrend.length > 0 ||
        revenueTrend.length > 0),
  );
  const isDemo = shouldUseDashboardDemo(hasLiveData, Boolean(error));
  const displayedSummary = isDemo ? demoAdminDashboard.summary : summary;
  const displayedPatientTrend = isDemo
    ? demoAdminDashboard.patientVolumeTrend
    : patientTrend;
  const displayedRevenueTrend = isDemo
    ? demoAdminDashboard.revenueTrend
    : revenueTrend;
  const displayedBranchVolume = isDemo
    ? demoAdminDashboard.branchVolume
    : (topLists?.busiestDepts ?? []).map((item) => ({
        label: item.label,
        value: Number(item.value) || 0,
      }));
  const displayedBills = isDemo
    ? demoAdminDashboard.unpaidBills
    : topLists?.unpaidBills ?? [];

  const alertRail = useMemo(() => {
    if (isDemo) return demoAdminDashboard.alerts;
    return [
      ...(alerts?.lowStock ?? []).map((alert, index) => ({
        id: `low-stock-${index}`,
        severity: alert.severity === 'critical' ? 'critical' as const : 'warning' as const,
        title: alert.title,
        message: alert.message,
        timestamp: 'Live',
      })),
      ...(alerts?.criticalLabs ?? []).map((alert, index) => ({
        id: `critical-lab-${index}`,
        severity: 'critical' as const,
        title: alert.title,
        message: alert.message,
        timestamp: 'Live',
      })),
    ];
  }, [alerts, isDemo]);

  const kpis = displayedSummary
    ? [
        { id: 'patients', label: 'Active patients', value: displayedSummary.activePatients.toLocaleString(), severity: 'info' as const },
        { id: 'volume', label: "Today's volume", value: displayedSummary.todaysAppointments.toLocaleString(), severity: 'success' as const },
        { id: 'labs', label: 'Pending labs', value: displayedSummary.pendingLabs.toLocaleString(), severity: displayedSummary.pendingLabs > 20 ? 'warning' as const : 'info' as const },
        { id: 'revenue', label: 'Revenue', value: peso(displayedSummary.revenue), severity: 'success' as const },
        { id: 'security', label: 'Security events', value: displayedSummary.securityAlerts.toLocaleString(), severity: displayedSummary.securityAlerts > 0 ? 'critical' as const : 'success' as const },
      ]
    : [];

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName="All authorized branches"
          role="Executive Analytics"
          lastRefreshed={lastUpdated}
          onRefresh={() => void fetchData(true)}
          refreshing={refreshing}
        />
      }
      footer={
        <HmsAuditFooter
          dataSource={
            isDemo
              ? 'Synthetic executive scenario'
              : 'Live executive metrics with synthetic risk context'
          }
        />
      }
    >
      <HmsPageHeader
        eyebrow="Executive analytics"
        title="Health System Overview"
        description="A focused view of demand, revenue, risk and branch pressure. Operational queues remain in their role-specific workspaces."
        actions={
          <HmsDataSourceBadge
            mode="demo"
            label={isDemo ? 'Synthetic executive scenario' : 'Live metrics + synthetic risk context'}
          />
        }
      />

      <DashboardFilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {error && !isDemo && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <HmsAlertRail alerts={alertRail} loading={loading} />
      <HmsKpiStrip metrics={kpis} loading={loading} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <ChartCard
            title="Patient demand"
            description="Encounter volume across the selected period."
            emphasis="primary"
            loading={loading}
          >
            <TrendLineChart
              data={displayedPatientTrend}
              title="Patient demand"
              valueLabel="Encounters"
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-4">
          <InsightPanel insights={demoAdminDashboard.insights} title="Executive decisions" />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <ChartCard
            title="Revenue trend"
            description="Collections generated during the selected period."
            loading={loading}
          >
            <TrendLineChart
              data={displayedRevenueTrend}
              title="Revenue trend"
              valueLabel="Revenue"
              valueFormatter={peso}
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-5">
          <ChartCard
            title="Security event mix"
            description="Synthetic severity distribution for executive risk review."
          >
            <StatusDonutChart
              data={demoAdminDashboard.securityBreakdown}
              title="Security event mix"
            />
          </ChartCard>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <ChartCard
            title="Branch activity ranking"
            description="Encounter volume by branch or service area."
          >
            <ComparisonBarChart
              data={displayedBranchVolume}
              title="Branch activity ranking"
              valueLabel="Encounters"
              horizontal
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-6">
          <HmsDrilldownTable
            title="Outstanding invoices"
            description="Highest-value unpaid invoices requiring financial follow-up."
            data={displayedBills}
            keyExtractor={(item) => item.id || item.label}
            columns={[
              {
                key: 'invoice',
                header: 'Invoice',
                render: (item) => <span className="font-semibold text-slate-900">{item.label}</span>,
              },
              {
                key: 'amount',
                header: 'Outstanding',
                render: (item) => <span className="font-mono font-semibold text-rose-700">{peso(Number(item.value) || 0)}</span>,
              },
            ]}
            maxRows={6}
            emptyMessage="No outstanding invoices"
          />
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default AdminExecutiveDashboard;
