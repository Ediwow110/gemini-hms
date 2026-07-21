import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building, Shield, Users, WalletCards } from 'lucide-react';
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
      <HmsPageHeader
        eyebrow="Platform governance"
        title="Platform Command Center"
        description="Tenant health, security posture and system-wide operational signals without mixing them into staff workspaces."
        actions={
          <HmsDataSourceBadge
            mode="demo"
            label={isDemo ? 'Synthetic platform scenario' : 'Live records + synthetic trends'}
          />
        }
      />

      {error && !isDemo && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <AnalyticsMetricCard
          title="Active patients"
          value={loading ? '—' : (displayedSummary?.activePatients ?? 0).toLocaleString()}
          icon={Users}
          severity="info"
        />
        <AnalyticsMetricCard
          title="Today's appointments"
          value={loading ? '—' : (displayedSummary?.todaysAppointments ?? 0).toLocaleString()}
          icon={Building}
          severity="success"
        />
        <AnalyticsMetricCard
          title="Seven-day revenue"
          value={loading ? '—' : peso(displayedSummary?.revenue ?? 0)}
          icon={WalletCards}
          severity="success"
          href="/admin/reports"
        />
        <AnalyticsMetricCard
          title="Security events"
          value={loading ? '—' : (displayedSummary?.securityAlerts ?? 0)}
          icon={Shield}
          severity={(displayedSummary?.securityAlerts ?? 0) > 0 ? 'critical' : 'success'}
          href="/admin/security"
        />
        <AnalyticsMetricCard
          title="Tenants"
          value={loading ? '—' : displayedTenants.length}
          icon={Building}
          severity="info"
          href="/admin/tenants"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Tenant overview</h2>
              <p className="mt-1 text-xs text-slate-500">Account and branch footprint by tenant.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Tenant</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Users</th>
                    <th className="px-5 py-3 text-right">Branches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{tenant.name}</td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${tenant.status === 'ACTIVE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-700">{tenant.userCount}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-700">{tenant.branchCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-4">
          <InsightPanel insights={demoAdminDashboard.insights} title="Platform decisions" />
        </div>

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
        <div className="col-span-12 xl:col-span-4">
          <ChartCard
            title="Tenant status"
            description="Current tenant-state distribution."
          >
            <StatusDonutChart data={tenantStatus} title="Tenant status" />
          </ChartCard>
        </div>
      </div>

      {dashboardDemoConfig.mode === 'off' && !hasLiveData && !loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-500">
          No platform metrics are available. Enable the local synthetic scenario only in a non-production environment to review populated layouts.
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default SuperAdminDashboard;
