import React from 'react';
import { CheckCircle2, Clock, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AnalyticsMetricCard,
  ChartCard,
  ComparisonBarChart,
  StatusDonutChart,
  TrendLineChart,
} from '../../components/analytics';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsEmptyState,
  HmsLoadingSkeleton,
  HmsToolbar,
} from '../../components/hms-dashboard';
import { demoFieldServiceDashboard } from '../../data/dashboard-demo';
import { useFieldServiceAdminJobs, useFieldServiceJobs } from '../../hooks/use-field-service';
import { useUser } from '../../hooks/use-user';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import FieldServiceScopeFilter from './components/FieldServiceScopeFilter';
import OfflineSyncStatusCard from './components/OfflineSyncStatusCard';
import RouteSummaryPanel from './components/RouteSummaryPanel';
import TechnicianJobCard from './components/TechnicianJobCard';

export const FieldServiceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useUser();
  const isAdmin = Boolean(user?.permissions.includes('fulfillment.view'));
  const technicianQuery = useFieldServiceJobs(!isAdmin);
  const adminQuery = useFieldServiceAdminJobs(isAdmin);
  const activeQuery = isAdmin ? adminQuery : technicianQuery;

  const deliveries = activeQuery.data?.deliveries ?? [];
  const installations = activeQuery.data?.installations ?? [];
  const allJobs = [...deliveries, ...installations];
  const inProgress = allJobs.filter((job) => job.status === 'IN_PROGRESS').length;
  const completed = allJobs.filter((job) => job.status === 'COMPLETED').length;
  const assigned = allJobs.filter((job) => job.status === 'ASSIGNED').length;

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName={isAdmin ? 'Selected branch' : 'Assigned route'}
          role={isAdmin ? 'Field Service Oversight' : 'Technician Workspace'}
          onRefresh={() => void activeQuery.refetch()}
          refreshing={activeQuery.isFetching}
        >
          <FieldServiceScopeFilter />
        </HmsToolbar>
      }
      footer={<HmsAuditFooter dataSource="Live field jobs with synthetic trend context" />}
    >
      <HmsPageHeader
        eyebrow="Field operations"
        title={isAdmin ? 'Field Service Control Center' : 'My Field Work'}
        description={
          isAdmin
            ? 'Branch delivery and installation work, route pressure and SLA risk in one operational view.'
            : 'Your assigned jobs, route readiness and handover status, optimized for field use.'
        }
        actions={
          <>
            <HmsDataSourceBadge mode="demo" label="Live jobs + synthetic trends" />
            {!isAdmin && (
              <button
                type="button"
                onClick={() => navigate('/field-service/schedule')}
                className="min-h-10 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                My schedule
              </button>
            )}
          </>
        }
      />

      <FieldServiceShellNotice />

      {activeQuery.isLoading ? (
        <HmsLoadingSkeleton variant="kpi" />
      ) : activeQuery.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
          Field service jobs could not be loaded. Use Refresh after checking the branch and network context.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
          <AnalyticsMetricCard
            title={isAdmin ? 'Branch jobs' : 'My jobs'}
            value={allJobs.length}
            icon={Truck}
            description={isAdmin ? 'Live jobs in branch scope' : 'Live assignments for this technician'}
            severity="info"
            href="/field-service/schedule"
          />
          <AnalyticsMetricCard
            title="Assigned"
            value={assigned}
            icon={Clock}
            description="Ready to start"
            severity={assigned > 0 ? 'warning' : 'success'}
            href="/field-service/deliveries"
          />
          <AnalyticsMetricCard
            title="In progress"
            value={inProgress}
            icon={Clock}
            description="Currently underway"
            severity={inProgress > 0 ? 'warning' : 'info'}
            href="/field-service/deliveries"
          />
          <AnalyticsMetricCard
            title="Completed"
            value={completed}
            icon={CheckCircle2}
            description="Completed field work"
            severity="success"
            href="/field-service/proof-of-delivery"
          />
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 space-y-4 xl:col-span-8" aria-labelledby="field-job-queue-title">
          <div>
            <h2 id="field-job-queue-title" className="text-sm font-semibold text-slate-900">
              {isAdmin ? 'Selected branch job queue' : 'Upcoming job queue'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Operational work remains more prominent than analytics on this dashboard.
            </p>
          </div>

          {activeQuery.isLoading ? (
            <HmsLoadingSkeleton variant="table" />
          ) : activeQuery.error ? (
            <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center text-sm text-rose-600">
              Job queue unavailable.
            </div>
          ) : allJobs.length === 0 ? (
            <HmsEmptyState
              title="No active jobs"
              description={
                isAdmin
                  ? 'No delivery or installation jobs exist for the selected branch.'
                  : 'No active jobs are assigned to you.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {deliveries.map((job) => (
                <TechnicianJobCard
                  key={job.id}
                  id={`DEL-${job.id}`}
                  type="DELIVERY"
                  customer={job.customer}
                  address={job.address}
                  time="Delivery SLA"
                  status={job.status}
                  onAction={() => navigate('/field-service/deliveries')}
                />
              ))}
              {installations.map((job) => (
                <TechnicianJobCard
                  key={job.id}
                  id={`INS-${job.id}`}
                  type="INSTALLATION"
                  customer={job.customer}
                  address={job.address}
                  time="Installation SLA"
                  status={job.status}
                  onAction={() => navigate('/field-service/installations')}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="col-span-12 space-y-6 xl:col-span-4">
          <RouteSummaryPanel />
          <OfflineSyncStatusCard />
        </aside>

        <div className="col-span-12 xl:col-span-7">
          <ChartCard
            title="Completed jobs"
            description="Synthetic weekly completion pattern for workload planning."
            emphasis="primary"
          >
            <TrendLineChart
              data={demoFieldServiceDashboard.completionTrend}
              title="Completed jobs"
              valueLabel="Completed"
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-5">
          <ChartCard
            title="Current job mix"
            description="Synthetic assignment-state distribution."
          >
            <StatusDonutChart
              data={demoFieldServiceDashboard.statusBreakdown}
              title="Current job mix"
            />
          </ChartCard>
        </div>

        <div className="col-span-12">
          <ChartCard
            title="SLA performance by work type"
            description="Synthetic on-time completion percentage for delivery, installation and maintenance."
            emphasis="compact"
          >
            <ComparisonBarChart
              data={demoFieldServiceDashboard.slaByType}
              title="SLA performance"
              valueLabel="On time"
              valueFormatter={(value) => `${value}%`}
              yDomain={[0, 100]}
            />
          </ChartCard>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default FieldServiceDashboard;
