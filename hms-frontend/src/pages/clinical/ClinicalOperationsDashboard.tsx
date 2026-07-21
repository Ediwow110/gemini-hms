import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertCircle, Clock, Stethoscope, Users } from 'lucide-react';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  StatusDonutChart,
} from '../../components/analytics';
import { DashboardAlertCard, DashboardDataTable } from '../../components/dashboard';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsEmptyState,
  HmsToolbar,
} from '../../components/hms-dashboard';
import { clinicalOpsDashboardService } from '../../services/clinical-ops-dashboard.service';
import type { ClinicalWorkQueueDto } from '../../services/clinicalWorkflow.service';
import type { ClinicalOpsDashboardData } from '../../types/clinical-ops-dashboard';

export const ClinicalOperationsDashboard: React.FC = () => {
  const [data, setData] = useState<ClinicalOpsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();

  const fetchDashboardData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await clinicalOpsDashboardService.getDashboardData();
      setData(result);
      setLastUpdated(new Date());
    } catch {
      setData(null);
      setError('Unable to load clinical operations data. Please retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  if (error) {
    return (
      <HmsDashboardShell>
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <h2 className="text-lg font-semibold text-slate-900">{error}</h2>
          <button
            type="button"
            onClick={() => void fetchDashboardData(true)}
            className="min-h-10 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </HmsDashboardShell>
    );
  }

  const kpiIcons = [Users, Stethoscope, Clock, Activity];

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName="Current clinical branch"
          role="Clinical Operations"
          lastRefreshed={lastUpdated}
          onRefresh={() => void fetchDashboardData(true)}
          refreshing={refreshing}
        />
      }
      footer={<HmsAuditFooter dataSource="Clinical workflow and nursing APIs" />}
    >
      <HmsPageHeader
        eyebrow="Clinical operations"
        title="Clinical Operations"
        description="Patient flow, queue pressure and urgent clinical workload in a single live operational view."
        actions={<HmsDataSourceBadge mode="live" />}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {(data?.kpis ?? []).map((kpi, index) => {
          const Icon = kpiIcons[index % kpiIcons.length];
          return (
            <AnalyticsMetricCard
              key={kpi.title}
              title={kpi.title}
              value={loading ? '—' : kpi.value}
              description={kpi.description}
              severity={kpi.severity}
              icon={Icon}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 space-y-4 xl:col-span-4" aria-labelledby="urgent-clinical-actions">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="urgent-clinical-actions" className="text-sm font-semibold text-slate-900">Urgent actions</h2>
              <p className="mt-1 text-xs text-slate-500">Items requiring immediate clinical attention.</p>
            </div>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
              {data?.alerts.length ?? 0} urgent
            </span>
          </div>
          {data?.alerts.length ? (
            data.alerts.map((alert) => (
              <DashboardAlertCard
                key={alert.id}
                title={alert.title}
                message={alert.message}
                severity={alert.severity}
              />
            ))
          ) : (
            <HmsEmptyState title="No urgent actions" description="No urgent clinical alerts are currently open." />
          )}
        </section>

        <section className="col-span-12 xl:col-span-8" aria-labelledby="active-patient-queue">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 id="active-patient-queue" className="text-sm font-semibold text-slate-900">Pending Clinical Queue</h2>
            <p className="mt-1 text-xs text-slate-500">Patients waiting for the next clinical step.</p>
            <div className="mt-4">
              <DashboardDataTable
                title="Active Patient Queue"
                columns={[
                  { header: 'Queue #', accessor: 'queueNumber' },
                  { header: 'Patient', accessor: 'patientName' },
                  { header: 'Category', accessor: 'category' },
                  { header: 'Service', accessor: 'serviceType' },
                  { header: 'Wait Time', accessor: (item: ClinicalWorkQueueDto) => `${item.waitTimeMinutes}m` },
                  { header: 'Status', accessor: 'status' },
                ]}
                data={data?.pendingQueue ?? []}
                emptyMessage="No patients currently in queue."
              />
            </div>
          </div>
        </section>

        <div className="col-span-12 xl:col-span-7">
          <ChartCard
            title="Patient Flow Distribution"
            description="Current live distribution of patients across clinical workflow states."
            emphasis="primary"
            loading={loading}
          >
            <StatusDonutChart
              data={(data?.flowDistribution ?? []).map((item) => ({
                label: item.label,
                value: item.value,
              }))}
              title="Patient Flow Distribution"
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-5">
          <ChartCard
            title="Workload by Specialty"
            description="Live workload percentage when the backend aggregation is available."
            loading={loading}
            empty={(data?.workloadDistribution.length ?? 0) === 0}
          >
            <ComparisonBarChart
              data={(data?.workloadDistribution ?? []).map((item) => ({
                label: item.label,
                value: item.value,
              }))}
              title="Workload by Specialty"
              valueLabel="Workload"
              valueFormatter={(value) => `${value}%`}
              yDomain={[0, 100]}
              horizontal
            />
          </ChartCard>
        </div>

        <div className="col-span-12">
          <ChartCard
            title="Department pressure"
            description="Current department workload ranking from the live clinical operations endpoint."
            emphasis="compact"
            empty={(data?.topDepartments.length ?? 0) === 0}
          >
            <ComparisonBarChart
              data={(data?.topDepartments ?? []).map((department) => ({
                label: department.label,
                value: Number(department.value) || 0,
              }))}
              title="Department pressure"
              valueLabel="Pressure"
              horizontal
            />
          </ChartCard>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default ClinicalOperationsDashboard;
