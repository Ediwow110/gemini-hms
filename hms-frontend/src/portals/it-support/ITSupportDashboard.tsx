import React from 'react';
import {
  Cpu,
  Users,
  Play,
  AlertOctagon,
  Link2,
  Database,
  Terminal,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ITScopeFilter from './components/ITScopeFilter';
import SystemHealthCard from './components/SystemHealthCard';
import { AnalyticsMetricCard, ChartCard, InsightPanel, StatusDonutChart, TrendLineChart } from '../../components/analytics';
import { itInsights, itLatencyTrend, itMetrics, jobBreakdown } from '../../data/analytics/operationsAnalytics.mock';
import UserSupportQueue from './components/UserSupportQueue';
import BackgroundJobTable from './components/BackgroundJobTable';
import { useSupportTickets, useTicketStats } from '../../hooks/use-it-support';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';

export const ITSupportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tickets, loading: ticketsLoading, error: ticketsError, refetch } = useSupportTickets({ pageSize: 3 });
  const { stats, loading: statsLoading, statsError } = useTicketStats();
  const [renderCharts, setRenderCharts] = React.useState(false);

  React.useEffect(() => {
    // Defer chart rendering to second paint / post-mount
    const timer = setTimeout(() => {
      setRenderCharts(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="IT & Infrastructure Support Workspace"
          description="System health, sessions, jobs, integrations, and incident management"
        />

        {/* WIP Banner */}
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold uppercase text-[10px] tracking-wider">IT Operations (Partial)</h5>
            <p className="font-medium mt-0.5">System health, jobs, logs, and backup data are simulated for demonstration. User support ticketing and session management are real.</p>
          </div>
        </div>
        <ITScopeFilter displayOnly />

      {statsError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          <span className="font-semibold">Note:</span> {statsError} — numeric cards show zero values.
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Health Metrics Row: 4 S-size Cards */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <SystemHealthCard
            title="Open Tickets"
            value={statsLoading ? '...' : String(stats.open)}
            icon={AlertOctagon}
            status={stats.open > 0 ? 'CRITICAL' : 'HEALTHY'}
            description={stats.urgent > 0 ? `${stats.urgent} urgent` : 'No urgent tickets'}
            metricLabel="View Tickets"
            onActionClick={() => navigate('/it/user-support')}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <SystemHealthCard
            title="In Progress"
            value={statsLoading ? '...' : String(stats.inProgress)}
            icon={Play}
            status={stats.inProgress > 0 ? 'DEGRADED' : 'HEALTHY'}
            description="Tickets being worked on"
            metricLabel="View Active"
            onActionClick={() => navigate('/it/user-support')}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <SystemHealthCard
            title="Total Tickets"
            value={statsLoading ? '...' : String(stats.total)}
            icon={Users}
            status="HEALTHY"
            description="All-time ticket volume"
            metricLabel="View All"
            onActionClick={() => navigate('/it/user-support')}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <SystemHealthCard
            title="System Health"
            value="Online"
            icon={Cpu}
            status="HEALTHY"
            description="API Gateway: 45ms avg"
            metricLabel="View Health"
            onActionClick={() => navigate('/it/system-health')}
          />
        </div>

        {/* 6 XS-size telemetry metrics (2 cols each on desktop) */}
        {itMetrics.map((metric) => (
          <div key={metric.title} className="col-span-12 sm:col-span-4 xl:col-span-2">
            <AnalyticsMetricCard {...metric} value={metric.title === 'Open Tickets' ? (statsLoading ? '...' : stats.open) : metric.title === 'Urgent Incidents' ? (statsLoading ? '...' : stats.urgent) : metric.value} />
          </div>
        ))}

        {/* Primary Work Row: System Health Metrics (L Card) + User Support Queue (L Card) */}
        <div className="col-span-12 xl:col-span-6">
          <ChartCard title="API latency and availability" description="Sandbox infrastructure trend for operational review." height={280}>
            {renderCharts ? (
              <TrendLineChart data={itLatencyTrend} title="API latency and availability" valueLabel="Latency ms" secondaryLabel="Availability %" />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 font-semibold animate-pulse">Loading telemetry charts...</div>
            )}
          </ChartCard>
        </div>

        <div className="col-span-12 xl:col-span-6">
          {ticketsLoading ? (
            <HmsLoadingSkeleton />
          ) : ticketsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              <p className="font-semibold">Error loading support tickets</p>
              <p className="mt-1">{ticketsError}</p>
              <button onClick={refetch} className="mt-2 font-semibold text-indigo-600 cursor-pointer hover:underline">Retry</button>
            </div>
          ) : tickets.length === 0 ? (
            <HmsEmptyState title="No recent tickets" description="Support tickets will appear here when reported." />
          ) : (
            <UserSupportQueue tickets={tickets.map(t => ({
              id: t.id,
              userName: t.reportedBy?.email || 'Unknown',
              userEmail: t.reportedBy?.email || '',
              userRole: '',
              tenantName: '',
              branchName: t.branch?.name || '',
              issueType: t.issueType,
              summary: t.summary,
              status: t.status,
              priority: t.priority,
              createdAt: new Date(t.createdAt).toLocaleString(),
            }))} />
          )}
        </div>

        {/* Secondary Insight Row: Active Background Jobs Table (XL Card) + Quick Actions (L Card) */}
        <div className="col-span-12 xl:col-span-8">
          <BackgroundJobTable jobs={[]} />
        </div>

        <div className="col-span-12 xl:col-span-4">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">IT Quick Actions</h4>
            <div className="space-y-2">
              {[
                { label: 'System Health Monitor', icon: Cpu, path: '/it/system-health' },
                { label: 'Active Sessions', icon: Users, path: '/it/sessions' },
                { label: 'System Integrations', icon: Link2, path: '/it/integrations' },
                { label: 'System Logs', icon: Terminal, path: '/it/logs' },
                { label: 'Backup & Recovery', icon: Database, path: '/it/backup-restore' },
                { label: 'Ticket Queue', icon: AlertOctagon, path: '/it/user-support' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all text-xs font-bold text-slate-700 flex justify-between items-center cursor-pointer"
                >
                  <span>{item.label}</span>
                  <item.icon className="h-4 w-4 text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Supporting Row: Job Status (L Card) + IT Insights (L Card) */}
        <div className="col-span-12 md:col-span-6 xl:col-span-6">
          <ChartCard title="Background job status" description="Job queue status drives retry and incident decisions." height={280}>
            {renderCharts ? (
              <StatusDonutChart data={jobBreakdown} title="Background job status" />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 font-semibold animate-pulse">Loading status breakdown...</div>
            )}
          </ChartCard>
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-6">
          <InsightPanel insights={itInsights} title="IT operations insights" />
        </div>
      </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default ITSupportDashboard;

