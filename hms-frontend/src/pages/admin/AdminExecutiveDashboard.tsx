import React, { useState, useEffect } from 'react';
import { Users, Building, History, Settings, AlertCircle } from 'lucide-react';
import {
  HmsDashboardShell,
  HmsToolbar,
  HmsAuditFooter,
  HmsKpiStrip,
  HmsAlertRail,
  HmsDrilldownTable,
  HmsSlaPanel,
  HmsQuickActions,
  HmsDataUnavailable,
  HmsLoadingSkeleton,
} from '../../components/hms-dashboard';
import { dashboardService } from '../../services/dashboard.service';
import type { DateRange, AdminDashboardSummary, AdminDashboardAlertsResponse, AdminDashboardTopListsResponse } from '../../types/analytics';

const INITIAL_DATE_RANGE: DateRange = {
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  to: new Date().toISOString().split('T')[0]
};

export const AdminExecutiveDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(INITIAL_DATE_RANGE);
  const [selectedBranch, setSelectedBranch] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isUnavailable, setIsUnavailable] = useState(false);

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<AdminDashboardAlertsResponse | null>(null);
  const [topLists, setTopLists] = useState<AdminDashboardTopListsResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = { dateRange, branch: selectedBranch };

      const [summaryRes, alertsRes, topListsRes] = await Promise.all([
        dashboardService.getAdminSummary(filters),
        dashboardService.getAdminAlerts(),
        dashboardService.getAdminTopLists(),
      ]);

      setSummary(summaryRes);
      setAlerts(alertsRes);
      setTopLists(topListsRes);
      setIsUnavailable(false);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Failed to fetch dashboard data from backend, falling back to empty states:', err);
      setSummary(null);
      setAlerts(null);
      setTopLists(null);
      setIsUnavailable(true);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchData();
  }, [dateRange, selectedBranch]);
  /* eslint-enable react-hooks/exhaustive-deps */

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6 bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-center max-w-md p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
          <AlertCircle className="h-12 w-12 text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900">{error}</h2>
          <button
            onClick={() => fetchData()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Map alerts to AlertRail format
  const railAlerts = [
    ...(alerts?.lowStock.map((a, idx) => ({
      id: `lowstock-${idx}`,
      severity: (a.severity === 'critical' || a.severity === 'warning' || a.severity === 'success') ? a.severity : 'warning' as const,
      title: a.title,
      message: a.message,
      timestamp: 'Real-time',
    })) || []),
    ...(alerts?.criticalLabs.map((a, idx) => ({
      id: `critlab-${idx}`,
      severity: (a.severity === 'critical' || a.severity === 'warning' || a.severity === 'success') ? a.severity : 'critical' as const,
      title: a.title,
      message: a.message,
      timestamp: 'Real-time',
    })) || []),
  ];

  // Map KPIs to KpiStrip format
  const kpis = summary ? [
    { id: 'kpi-patients', label: 'Active Patients', value: summary.activePatients.toLocaleString(), severity: 'info' as const },
    { id: 'kpi-volume', label: "Today's Volume", value: summary.todaysAppointments.toLocaleString(), severity: 'success' as const },
    { id: 'kpi-labs', label: 'Pending Labs', value: summary.pendingLabs.toLocaleString(), severity: 'warning' as const },
    { id: 'kpi-revenue', label: 'Daily Revenue', value: `₱${summary.revenue.toLocaleString()}`, severity: 'success' as const },
    { id: 'kpi-security', label: 'Security Events', value: summary.securityAlerts.toLocaleString(), severity: summary.securityAlerts > 0 ? 'critical' as const : 'success' as const },
  ] : [];

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar
          branchName={selectedBranch === 'all' ? 'All Branches' : selectedBranch}
          role="Executive Dashboard"
          lastRefreshed={lastUpdated}
          onRefresh={fetchData}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <label htmlFor="date-from" className="text-[11px] font-medium text-slate-400">From:</label>
              <input
                id="date-from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <label htmlFor="date-to" className="text-[11px] font-medium text-slate-400">To:</label>
              <input
                id="date-to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <label htmlFor="branch-select" className="text-[11px] font-medium text-slate-400">Branch:</label>
              <select
                id="branch-select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Branches</option>
                <option value="main-branch">Main Branch</option>
                <option value="north-clinic">North Branch</option>
              </select>
            </div>
          </div>
        </HmsToolbar>
      }
      footer={
        <HmsAuditFooter
          lastRefreshed={lastUpdated}
          dataSource={isUnavailable ? 'Live source unavailable' : 'System Operations API'}
        />
      }
    >
      {isUnavailable && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span className="text-[12px] font-semibold text-rose-700">Live dashboard data could not be loaded — showing unavailable state for unsupported sections</span>
          </div>
          <span className="text-[10px] font-bold text-rose-600 font-mono">OFFLINE</span>
        </div>
      )}

      {/* Top Alert Rail for system-wide alerts */}
      <HmsAlertRail alerts={railAlerts} loading={loading} />

      {/* KPI Strip */}
      {isUnavailable ? (
        <HmsDataUnavailable
          sectionName="Executive Key Metrics"
          expectedApi="/v1/dashboard/admin/summary"
        />
      ) : (
        <HmsKpiStrip metrics={kpis} loading={loading} />
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 space-y-3">
            <HmsLoadingSkeleton variant="table" />
            <HmsLoadingSkeleton variant="table" />
          </div>
          <div className="space-y-3">
            <HmsLoadingSkeleton variant="panel" />
            <HmsLoadingSkeleton variant="panel" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-3">
            {/* Branch Comparison Table */}
            {isUnavailable ? (
              <HmsDataUnavailable
                sectionName="Branch Volume Comparison"
                expectedApi="/v1/dashboard/admin/top-lists"
              />
            ) : (
              <HmsDrilldownTable
                title="Branch Volume Comparison"
                description="Active patient encounters across system branches"
                data={topLists?.busiestDepts || []}
                keyExtractor={(item) => item.label}
                columns={[
                  {
                    key: 'branch',
                    header: 'Branch ID',
                    render: (item) => <span className="font-semibold text-slate-800">{item.label}</span>
                  },
                  {
                    key: 'volume',
                    header: 'Daily Encounters',
                    render: (item) => <span className="font-mono font-bold text-slate-900">{item.value}</span>
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: () => (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">
                        ACTIVE
                      </span>
                    )
                  }
                ]}
                emptyMessage="No branch volume data available"
                maxRows={5}
              />
            )}

            {/* Top Unpaid Invoices */}
            {isUnavailable ? (
              <HmsDataUnavailable
                sectionName="Top Outstanding Invoices"
                expectedApi="/v1/dashboard/admin/top-lists"
              />
            ) : (
              <HmsDrilldownTable
                title="Top Outstanding Invoices"
                description="Receivables requiring administrative oversight"
                data={topLists?.unpaidBills || []}
                keyExtractor={(item) => item.id || item.label}
                columns={[
                  {
                    key: 'invoice',
                    header: 'Invoice #',
                    render: (item) => <span className="font-semibold text-slate-800">{item.label}</span>
                  },
                  {
                    key: 'amount',
                    header: 'Total Amount',
                    render: (item) => (
                      <span className="font-mono font-bold text-rose-600">
                        {String(item.value).startsWith('$') || String(item.value).startsWith('₱') 
                          ? item.value 
                          : `₱${Number(item.value).toLocaleString()}`}
                      </span>
                    )
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: () => (
                      <span className="inline-flex items-center rounded-md bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold">
                        UNPAID
                      </span>
                    )
                  }
                ]}
                emptyMessage="No unpaid bills found"
                maxRows={5}
              />
            )}

            {/* Staffing & Operations Bottlenecks — Unavailable */}
            <HmsDataUnavailable
              sectionName="Staffing & Operations Bottlenecks"
              expectedApi="/api/v1/admin/operations/bottlenecks"
              expectedPhase="Phase 2"
            />

            {/* Patient Volume Trend — Unavailable */}
            <HmsDataUnavailable
              sectionName="Patient Volume Trend"
              expectedApi="/api/v1/dashboard/admin/trends"
              expectedPhase="Phase 2"
            />

            {/* Revenue Trend — Unavailable */}
            <HmsDataUnavailable
              sectionName="Revenue Trend"
              expectedApi="/api/v1/dashboard/admin/trends"
              expectedPhase="Phase 2"
            />
          </div>

          {/* Sidebar compliance panel & Quick actions (1/3) */}
          <div className="space-y-3">
            {/* SLA Panel */}
            {isUnavailable ? (
              <HmsDataUnavailable
                sectionName="System Compliance & Risk"
                expectedApi="/v1/dashboard/admin/summary"
              />
            ) : (
              <HmsSlaPanel
                title="System Compliance & Risk"
                items={[
                  {
                    id: 'sla-security',
                    label: 'Security Events',
                    value: summary?.securityAlerts || 0,
                    status: (summary?.securityAlerts ?? 0) > 0 ? 'breached' : 'on_track',
                    drilldownHref: '/admin/audit-logs',
                  },
                  {
                    id: 'sla-labs',
                    label: 'Pending Lab Load',
                    value: summary?.pendingLabs || 0,
                    status: (summary?.pendingLabs ?? 0) > 15 ? 'at_risk' : 'on_track',
                    drilldownHref: '/admin/reports',
                  }
                ]}
              />
            )}

            {/* Top Branch Risks — Unavailable */}
            <HmsDataUnavailable
              sectionName="Top Branch Operational Risks"
              expectedApi="/api/v1/admin/branches/risks"
              expectedPhase="Phase 2"
            />

            {/* Quick Actions */}
            <HmsQuickActions
              title="Quick Actions"
              actions={[
                { id: 'user-ctrl', label: 'User & Accounts Control', icon: <Users className="h-4 w-4 text-blue-500" />, href: '/admin/users' },
                { id: 'audit-logs', label: 'System Audit Logs', icon: <History className="h-4 w-4 text-amber-500" />, href: '/admin/audit-logs' },
                { id: 'branch-mgr', label: 'Branches Manager', icon: <Building className="h-4 w-4 text-emerald-500" />, href: '/admin/branches' },
                { id: 'sys-settings', label: 'System Settings', icon: <Settings className="h-4 w-4 text-slate-500" />, href: '/admin/settings' },
              ]}
            />
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default AdminExecutiveDashboard;
