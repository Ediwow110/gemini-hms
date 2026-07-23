import React from 'react';
import {
  AlertOctagon,
  Cpu,
  Database,
  Link2,
  Terminal,
  Users,
} from 'lucide-react';
import {
  AnalyticsMetricCard,
  ChartCard,
  InsightPanel,
  StatusDonutChart,
  TrendLineChart,
} from '../../components/analytics';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsQuickActions,
  HmsToolbar,
} from '../../components/hms-dashboard';
import ITScopeFilter from './components/ITScopeFilter';
import UserSupportQueue, { type SupportTicket } from './components/UserSupportQueue';
import BackgroundJobTable from './components/BackgroundJobTable';
import { useAnalytics } from '../../hooks/use-analytics';
import { useSupportTickets, useTicketStats } from '../../hooks/use-it-support';
import { usePermissions } from '../../hooks/use-user';
import {
  dashboardDemoConfig,
  demoItDashboard,
} from '../../data/dashboard-demo';

export const ITSupportDashboard: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManageSupport = hasPermission('it.support.manage');
  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useSupportTickets(canManageSupport);
  const {
    stats,
    loading: statsLoading,
    statsError,
  } = useTicketStats(canManageSupport);
  const {
    it: itMetrics,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
    demoByScope,
    refetchAll: refetchAnalytics,
  } = useAnalytics('it');

  const allowSynthetic = dashboardDemoConfig.mode !== 'off';
  const useDemoTickets = allowSynthetic && !ticketsLoading && tickets.length === 0;
  const displayedTickets: SupportTicket[] = useDemoTickets
    ? demoItDashboard.tickets
    : tickets.map((ticket) => ({
        id: ticket.id,
        userName: ticket.reportedBy?.email || 'Unknown user',
        userEmail: ticket.reportedBy?.email || '',
        userRole: '',
        tenantName: '',
        branchName: ticket.branch?.name || '',
        issueType: ticket.issueType,
        summary: ticket.summary,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: new Date(ticket.createdAt).toLocaleString(),
      }));

  const hasSyntheticContent =
    demoByScope.it || allowSynthetic || useDemoTickets;

  const refresh = async () => {
    await Promise.all([refetchAnalytics(), refetchTickets()]);
  };

  const isLoading = analyticsLoading || statsLoading;

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName="Tenant infrastructure"
          role="IT Operations"
          onRefresh={() => void refresh()}
          refreshing={analyticsFetching || ticketsLoading}
        />
      }
      footer={
        <HmsAuditFooter
          dataSource={
            hasSyntheticContent
              ? 'Live support records with synthetic telemetry'
              : 'IT operations APIs'
          }
        />
      }
    >
      <HmsPageHeader
        eyebrow="Technology operations"
        title="IT Reliability Workspace"
        description="Support demand, session health, integrations, background work and incident signals without competing card walls."
        actions={
          <HmsDataSourceBadge
            mode={hasSyntheticContent ? 'demo' : 'live'}
            label={hasSyntheticContent ? 'Live + synthetic telemetry' : undefined}
          />
        }
      />

      <ITScopeFilter displayOnly />

      {(statsError || ticketsError) && !hasSyntheticContent && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          {statsError || ticketsError}
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <AnalyticsMetricCard
          title="Open support tickets"
          value={canManageSupport ? (statsLoading ? '—' : stats.open) : 'Restricted'}
          icon={AlertOctagon}
          description={canManageSupport ? 'Support cases requiring attention' : 'Requires IT support management permission'}
          severity={canManageSupport && stats.open > 0 ? 'warning' : 'info'}
          href={canManageSupport ? '/it/user-support' : undefined}
        />
        <AnalyticsMetricCard
          title="Active sessions"
          value={isLoading ? '—' : itMetrics.activeSessions}
          icon={Users}
          severity="info"
          href="/it/sessions"
        />
        <AnalyticsMetricCard
          title="Healthy integrations"
          value={isLoading ? '—' : itMetrics.healthyIntegrations}
          icon={Link2}
          severity="success"
          href="/it/integrations"
        />
        <AnalyticsMetricCard
          title="Backup failures"
          value={isLoading ? '—' : itMetrics.backupFailures}
          icon={Database}
          severity={itMetrics.backupFailures > 0 ? 'critical' : 'success'}
          href="/it/backup-restore"
        />
        <AnalyticsMetricCard
          title="API latency"
          value={isLoading ? '—' : `${itMetrics.systemLatencyMs} ms`}
          icon={Cpu}
          severity={itMetrics.systemLatencyMs > 120 ? 'warning' : 'success'}
          href="/it/system-health"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <ChartCard
            title="Latency trend"
            description="Synthetic latency pattern for layout review; availability is shown separately to avoid mixed-axis distortion."
            emphasis="primary"
          >
            <TrendLineChart
              data={demoItDashboard.latencyTrend.map(({ label, value }) => ({ label, value }))}
              title="API latency trend"
              valueLabel="Latency"
              valueFormatter={(value) => `${value} ms`}
            />
          </ChartCard>
        </div>
        <div className="col-span-12 xl:col-span-4">
          <InsightPanel insights={demoItDashboard.insights} title="Reliability decisions" />
        </div>

        <div className="col-span-12 xl:col-span-7">
          {canManageSupport ? (
            <UserSupportQueue tickets={displayedTickets} isDemo={useDemoTickets} />
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-slate-300 bg-white p-8 text-center shadow-sm">
              <AlertOctagon className="h-8 w-8 text-slate-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Support queue restricted</p>
              <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                Your role can review infrastructure health but cannot open user-support cases.
              </p>
            </div>
          )}
        </div>
        <div className="col-span-12 xl:col-span-5">
          <HmsQuickActions
            title="Operational tools"
            actions={[
              { id: 'health', label: 'System health', icon: <Cpu className="h-4 w-4" />, href: '/it/system-health' },
              { id: 'sessions', label: 'Active sessions', icon: <Users className="h-4 w-4" />, href: '/it/sessions' },
              { id: 'integrations', label: 'Integrations', icon: <Link2 className="h-4 w-4" />, href: '/it/integrations' },
              { id: 'logs', label: 'System logs', icon: <Terminal className="h-4 w-4" />, href: '/it/logs' },
              { id: 'backups', label: 'Backup and recovery', icon: <Database className="h-4 w-4" />, href: '/it/backup-restore' },
            ]}
          />
        </div>

        <div className="col-span-12 xl:col-span-8">
          <BackgroundJobTable
            jobs={allowSynthetic ? demoItDashboard.jobs : []}
            isDemo={allowSynthetic}
          />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <ChartCard
            title="Worker status"
            description="Current synthetic distribution of background work."
          >
            <StatusDonutChart
              data={allowSynthetic ? demoItDashboard.jobStatus : []}
              title="Background job status"
            />
          </ChartCard>
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default ITSupportDashboard;
