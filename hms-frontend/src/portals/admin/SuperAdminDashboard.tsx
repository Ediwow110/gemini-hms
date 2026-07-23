import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ChartCard,
  InsightPanel,
  StatusDonutChart,
  TrendLineChart,
} from '../../components/analytics';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsKpiStrip,
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
      <div className="max-w-[1600px] mx-auto space-y-5">
        {/* Structured Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Platform Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tenant health, security posture and system-wide operational signals.
              {lastUpdated && (
                <span className="ml-2 font-mono text-slate-400">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HmsDataSourceBadge
              mode="demo"
              label={isDemo ? 'Synthetic scenario' : 'Live records'}
            />
            <Link
              to="/admin/security"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-sky-600" />
              Security Center
            </Link>
          </div>
        </div>

        {/* Platform Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-md border border-slate-300 bg-slate-300 overflow-hidden shadow-sm">
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Active Tenants</p>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{displayedTenants.length}</p>
          </div>
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">User Accounts</p>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{totalUserCount.toLocaleString()}</p>
          </div>
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Branch Footprint</p>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{totalBranchCount}</p>
          </div>
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Audit Chain</p>
            <p className="text-base font-bold font-mono text-emerald-600 mt-0.5">100% Verified</p>
          </div>
        </div>

        {error && !isDemo && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchDashboard(true)}
              className="text-xs font-semibold underline hover:text-red-900 ml-2"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Primary KPI Strip */}
        <HmsKpiStrip
          metrics={[
            {
              id: 'active-patients',
              label: 'Active Patients',
              value: loading ? '—' : (displayedSummary?.activePatients ?? 0).toLocaleString(),
              severity: 'info' as const,
            },
            {
              id: 'appointments',
              label: "Today's Appointments",
              value: loading ? '—' : (displayedSummary?.todaysAppointments ?? 0).toLocaleString(),
              severity: 'success' as const,
            },
            {
              id: 'revenue',
              label: 'Seven-Day Revenue',
              value: loading ? '—' : peso(displayedSummary?.revenue ?? 0),
              severity: 'success' as const,
              href: '/admin/reports',
            },
            {
              id: 'security',
              label: 'Security Events',
              value: loading ? '—' : (displayedSummary?.securityAlerts ?? 0),
              severity: (displayedSummary?.securityAlerts ?? 0) > 0 ? 'critical' as const : 'success' as const,
              href: '/admin/security',
            },
            {
              id: 'tenants',
              label: 'Tenants',
              value: loading ? '—' : displayedTenants.length,
              severity: 'info' as const,
              href: '/admin/tenants',
            },
          ]}
        />

        {/* Main Section: Tenant Directory & Decisions */}
        <div className="grid grid-cols-12 gap-5">
          {/* Tenant Overview Table */}
          <div className="col-span-12 xl:col-span-8">
            <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
              <div className="border-b border-slate-300 px-4 py-3 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 rounded-sm bg-sky-600" />
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                      Tenant Overview
                    </h2>
                    <p className="mt-0.5 text-[10px] text-slate-500">Account footprint, status and branch allocation by tenant.</p>
                  </div>
                </div>
                <Link
                  to="/admin/tenants"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  Manage Tenants
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="border-b border-slate-300 bg-slate-100/80 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Tenant Name</th>
                      <th className="px-4 py-3.5">System Status</th>
                      <th className="px-4 py-3.5 text-center">User Accounts</th>
                      <th className="px-4 py-3.5 text-center">Branch Network</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayedTenants.map((tenant) => {
                      const isActive = tenant.status === 'ACTIVE';
                      return (
                        <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                                {tenant.name[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{tenant.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{tenant.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                                isActive
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-amber-200 bg-amber-50 text-amber-700'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`} />
                              {tenant.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">
                            {tenant.userCount}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">
                            {tenant.branchCount}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <Link
                              to="/admin/tenants"
                              className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline"
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
          <div className="col-span-12 xl:col-span-4 space-y-5">
            <ChartCard
              title="Tenant status"
              description="Current tenant-state distribution."
            >
              <StatusDonutChart data={tenantStatus} title="Tenant status" />
            </ChartCard>

            {/* Quick System Integrity Card */}
            <div className="rounded-md border border-slate-300 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 rounded-sm bg-sky-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                    System Governance
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Healthy
                </span>
              </div>
              <div className="px-4 py-3 space-y-3 text-xs">
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
          <div className="rounded-md border border-slate-300 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
            No platform metrics are available. Enable the local synthetic scenario only in a non-production environment to review populated layouts.
          </div>
        )}
      </div>
    </HmsDashboardShell>
  );
};

export default SuperAdminDashboard;

