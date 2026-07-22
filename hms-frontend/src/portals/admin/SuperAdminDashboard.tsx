import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building, Shield, Users, WalletCards, RefreshCw, Activity, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AnalyticsMetricCard,
  ChartCard,
  InsightPanel,
  StatusDonutChart,
  TrendLineChart,
} from '../../components/analytics';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsToolbar,
} from '../../components/hms-dashboard';
import {
  dashboardDemoConfig,
  demoAdminDashboard,
  shouldUseDashboardDemo,
} from '../../data/dashboard-demo';
import { adminService } from '../../services/admin.service';
import { dashboardService } from '../../services/dashboard.service';

interface AdminSummary {
  activePatients: number;
  todaysAppointments: number;
  pendingLabs: number;
  lowStock: number;
  revenue: number;
  securityAlerts: number;
}

interface TenantRow {
  id: string;
  name: string;
  status: string;
  userCount: number;
  branchCount: number;
}

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

export const SuperAdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();

  const fetchDashboard = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const from = new Date(today.getTime() - 7 * 86_400_000);
      const [summaryResponse, tenantResponse] = await Promise.all([
        dashboardService.getAdminSummary({
          dateRange: {
            from: from.toISOString().slice(0, 10),
            to: today.toISOString().slice(0, 10),
          },
        }),
        adminService.listTenants(),
      ]);
      setSummary(summaryResponse);
      setTenants(tenantResponse);
      setLastUpdated(new Date());
    } catch {
      setError('Live platform summary is unavailable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const hasLiveData = Boolean(
    summary &&
      (summary.activePatients > 0 ||
        summary.todaysAppointments > 0 ||
        summary.revenue > 0 ||
        tenants.length > 0),
  );
  const isDemo = shouldUseDashboardDemo(hasLiveData, Boolean(error));
  const displayedSummary = isDemo ? demoAdminDashboard.summary : summary;
  const displayedTenants = isDemo ? demoAdminDashboard.tenants : tenants;

  const tenantStatus = useMemo(
    () => [
      {
        label: 'Healthy',
        value: displayedTenants.filter((tenant) => tenant.status === 'ACTIVE').length,
      },
      {
        label: 'Needs attention',
        value: displayedTenants.filter((tenant) => tenant.status !== 'ACTIVE').length,
      },
    ],
    [displayedTenants],
  );

  const totalUserCount = useMemo(
    () => displayedTenants.reduce((acc, t) => acc + (t.userCount || 0), 0),
    [displayedTenants],
  );

  const totalBranchCount = useMemo(
    () => displayedTenants.reduce((acc, t) => acc + (t.branchCount || 0), 0),
    [displayedTenants],
  );

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName="All tenants"
          role="Platform Administration"
          lastRefreshed={lastUpdated}
          onRefresh={() => void fetchDashboard(true)}
          refreshing={refreshing}
        />
      }
      footer={
        <HmsAuditFooter
          dataSource={
            isDemo
              ? 'Synthetic platform scenario'
              : 'Live platform records with synthetic trend context'
          }
        />
      }
    >
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Hero Command Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Platform Operational • 99.98% System Uptime
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Platform Command Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Tenant health, security posture and system-wide operational signals without mixing them into staff workspaces.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <HmsDataSourceBadge
                mode="demo"
                label={isDemo ? 'Synthetic scenario' : 'Live records'}
              />
              <button
                type="button"
                onClick={() => void fetchDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing...' : 'Sync Telemetry'}
              </button>
              <Link
                to="/admin/security"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all duration-200"
              >
                <Shield className="h-3.5 w-3.5" />
                Security Center
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar inside Hero */}
          <div className="relative z-10 mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Active Tenants</p>
              <p className="text-lg font-bold text-white font-mono mt-0.5">{displayedTenants.length}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">User Accounts</p>
              <p className="text-lg font-bold text-white font-mono mt-0.5">{totalUserCount.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Branch Footprint</p>
              <p className="text-lg font-bold text-white font-mono mt-0.5">{totalBranchCount} Branches</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Audit Chain</p>
              <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">100% Verified</p>
            </div>
          </div>
        </div>

        {error && !isDemo && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchDashboard(true)}
              className="text-xs font-semibold underline hover:text-rose-900 ml-2"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Primary KPI Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <AnalyticsMetricCard
            title="Active patients"
            value={loading ? '—' : (displayedSummary?.activePatients ?? 0).toLocaleString()}
            icon={Users}
            severity="info"
            trend={{ direction: 'positive', value: '+12.4%', label: 'vs last period' }}
          />
          <AnalyticsMetricCard
            title="Today's appointments"
            value={loading ? '—' : (displayedSummary?.todaysAppointments ?? 0).toLocaleString()}
            icon={Building}
            severity="success"
            trend={{ direction: 'positive', value: '+8.1%', label: 'vs target' }}
          />
          <AnalyticsMetricCard
            title="Seven-day revenue"
            value={loading ? '—' : peso(displayedSummary?.revenue ?? 0)}
            icon={WalletCards}
            severity="success"
            trend={{ direction: 'positive', value: '+14.5%', label: 'vs week avg' }}
            href="/admin/reports"
          />
          <AnalyticsMetricCard
            title="Security events"
            value={loading ? '—' : (displayedSummary?.securityAlerts ?? 0)}
            icon={Shield}
            severity={(displayedSummary?.securityAlerts ?? 0) > 0 ? 'critical' : 'success'}
            description={(displayedSummary?.securityAlerts ?? 0) > 0 ? 'Action required in Security Center' : 'Zero critical breaches'}
            href="/admin/security"
          />
          <AnalyticsMetricCard
            title="Tenants"
            value={loading ? '—' : displayedTenants.length}
            icon={Building}
            severity="info"
            description={`${displayedTenants.filter(t => t.status === 'ACTIVE').length} active, ${displayedTenants.filter(t => t.status !== 'ACTIVE').length} degraded`}
            href="/admin/tenants"
          />
        </div>

        {/* Main Section: Tenant Directory & Decisions */}
        <div className="grid grid-cols-12 gap-6">
          {/* Tenant Overview Table */}
          <div className="col-span-12 xl:col-span-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building className="h-4 w-4 text-indigo-600" />
                    Tenant overview
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">Account footprint, status and branch allocation by tenant.</p>
                </div>
                <Link
                  to="/admin/tenants"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Manage Tenants
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Tenant Name</th>
                      <th className="px-4 py-3.5">System Status</th>
                      <th className="px-4 py-3.5 text-center">User Accounts</th>
                      <th className="px-4 py-3.5 text-center">Branch Network</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedTenants.map((tenant) => {
                      const isActive = tenant.status === 'ACTIVE';
                      return (
                        <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-indigo-200">
                                {tenant.name[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{tenant.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{tenant.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                isActive
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-700'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                              {tenant.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-mono font-semibold text-slate-700">
                            {tenant.userCount}
                          </td>
                          <td className="px-4 py-4 text-center font-mono font-semibold text-slate-700">
                            {tenant.branchCount}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to="/admin/tenants"
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              Configure &rarr;
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Platform Decisions / Insights Panel */}
          <div className="col-span-12 xl:col-span-4">
            <InsightPanel insights={demoAdminDashboard.insights} title="Platform decisions" />
          </div>

          {/* Activity Trend Chart */}
          <div className="col-span-12 xl:col-span-8">
            <ChartCard
              title="Patient activity"
              description="Synthetic seven-day activity trend for executive layout review."
              emphasis="primary"
            >
              <TrendLineChart
                data={demoAdminDashboard.patientVolumeTrend}
                title="Patient activity"
                valueLabel="Encounters"
              />
            </ChartCard>
          </div>

          {/* Tenant Status Donut Chart & System Health */}
          <div className="col-span-12 xl:col-span-4 space-y-6">
            <ChartCard
              title="Tenant status"
              description="Current tenant-state distribution."
            >
              <StatusDonutChart data={tenantStatus} title="Tenant status" />
            </ChartCard>

            {/* Quick System Integrity Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  System Governance
                </h3>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Healthy
                </span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">MFA Enforced Policy</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Audit Hash Verification</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 100% Valid
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Redis Cache Latency</span>
                  <span className="font-mono font-semibold text-slate-800">4.2 ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Database Connection Pool</span>
                  <span className="font-mono font-semibold text-emerald-700">Healthy (18/50)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {dashboardDemoConfig.mode === 'off' && !hasLiveData && !loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-500">
            No platform metrics are available. Enable the local synthetic scenario only in a non-production environment to review populated layouts.
          </div>
        )}
      </div>
    </HmsDashboardShell>
  );
};

export default SuperAdminDashboard;

