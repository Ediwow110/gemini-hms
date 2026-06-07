import React, { useState, useEffect } from 'react';
import {
  DashboardSection,
  DashboardKpiCard,
  DashboardAlertCard,
  DashboardDataTable,
  DashboardFilterBar
} from '../../components/dashboard';
import {
  TrendLineChart,
  VolumeAreaChart,
  StatusDonutChart,
  ComparisonBarChart
} from '../../components/analytics/charts';
import { dashboardService } from '../../services/dashboard.service';
import { Users, Calendar, FlaskConical, Package, DollarSign, ShieldAlert, Loader2, type LucideIcon } from 'lucide-react';
import type { DateRange, AnalyticsSeverity, TrendPoint, StatusBreakdown } from '../../types/analytics';
import type { AdminDashboardSummary, AdminDashboardAlertsResponse, AdminDashboardTopListsResponse, AdminDashboardTopListEntry } from '../../types/analytics';
import { ADMIN_DASHBOARD_MOCK } from '../../mocks/dashboard-admin.mock';

const INITIAL_DATE_RANGE: DateRange = {
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  to: new Date().toISOString().split('T')[0]
};

const KPI_CONFIG: { key: keyof AdminDashboardSummary; title: string; icon: LucideIcon; description: string; severity: AnalyticsSeverity }[] = [
  { key: 'activePatients', title: 'Active Patients', icon: Users, description: 'Last 30 days', severity: 'info' },
  { key: 'todaysAppointments', title: 'Today\'s Volume', icon: Calendar, description: 'Scheduled encounters', severity: 'success' },
  { key: 'pendingLabs', title: 'Pending Labs', icon: FlaskConical, description: 'Awaiting results', severity: 'warning' },
  { key: 'lowStock', title: 'Low Stock Alerts', icon: Package, description: 'Below reorder level', severity: 'critical' },
  { key: 'revenue', title: 'Daily Revenue', icon: DollarSign, description: 'Gross collections', severity: 'success' },
  { key: 'securityAlerts', title: 'Security Events', icon: ShieldAlert, description: 'High-risk audit logs', severity: 'critical' },
];

export const AdminExecutiveDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(INITIAL_DATE_RANGE);
  const [selectedBranch, setSelectedBranch] = useState('all');

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isDemoData, setIsDemoData] = useState(false);

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<TrendPoint[]>([]);
  const [alerts, setAlerts] = useState<AdminDashboardAlertsResponse | null>(null);
  const [topLists, setTopLists] = useState<AdminDashboardTopListsResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const filters = { dateRange, branch: selectedBranch };

        const [summaryRes, trendsRes, alertsRes, topListsRes] = await Promise.all([
          dashboardService.getAdminSummary(filters),
          dashboardService.getAdminTrends(filters),
          dashboardService.getAdminAlerts(),
          dashboardService.getAdminTopLists(),
        ]);

        setSummary(summaryRes);
        setTrends(trendsRes);
        setRevenueTrends(trendsRes.map(t => ({ label: t.label, value: t.value * 2500 })));
        setAlerts(alertsRes);
        setTopLists(topListsRes);
        setIsDemoData(false);
        setLastUpdated(new Date());
      } catch (err) {
        console.warn('Failed to fetch dashboard data from backend, falling back to mock data:', err);
        setSummary({
          activePatients: 12450,
          todaysAppointments: 142,
          pendingLabs: 28,
          lowStock: 14,
          revenue: 45200,
          securityAlerts: 3,
        });
        setTrends(ADMIN_DASHBOARD_MOCK.trends.patientVolume);
        setRevenueTrends(ADMIN_DASHBOARD_MOCK.trends.revenue);
        setAlerts({
          lowStock: [
            { title: 'Critical Stock Shortage', message: 'Insulin Glargine is below safety stock in Main Branch.', severity: 'critical' as const },
            { title: 'Pending Approval', message: 'Refund request for Invoice #INV-2026-001 awaits review.', severity: 'warning' as const },
          ],
          criticalLabs: [
            { title: 'Abnormal Lab Result', message: 'Critical Potassium level detected for Patient P-101.', severity: 'critical' as const }
          ],
        });
        setTopLists({
          busiestDepts: [
            { id: 'd1', label: 'General Medicine', value: '42%' },
            { id: 'd2', label: 'Pediatrics', value: '28%' },
            { id: 'd3', label: 'Cardiology', value: '15%' },
            { id: 'd4', label: 'Orthopedics', value: '10%' },
            { id: 'd5', label: 'Neurology', value: '5%' },
          ],
          unpaidBills: [
            { id: '1', label: 'Corp Health Plan', value: '$12,000' },
            { id: '2', label: 'Private Patient X', value: '$4,500' },
            { id: '3', label: 'HMO North', value: '$3,200' },
            { id: '4', label: 'City Insurance', value: '$2,100' },
            { id: '5', label: 'Private Patient Y', value: '$1,800' },
          ],
        });
        setIsDemoData(true);
        setLastUpdated(new Date());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, selectedBranch]);

  const renderKpis = (): React.ReactNode => {
    if (!summary) return null;
    return KPI_CONFIG.map((cfg) => (
      <DashboardKpiCard
        key={cfg.key}
        value={cfg.key === 'revenue' ? `₱${summary[cfg.key]?.toLocaleString()}` : summary[cfg.key]?.toLocaleString()}
        title={cfg.title}
        description={cfg.description}
        severity={cfg.severity}
        icon={cfg.icon}
      />
    ));
  };

  const renderAlerts = (): React.ReactNode => {
    if (!alerts) return null;
    const allAlerts = [
      ...alerts.lowStock.map(a => ({ ...a, id: `lowstock-${a.message}` })),
      ...alerts.criticalLabs.map(a => ({ ...a, id: `critlab-${a.message}` })),
    ];

    if (allAlerts.length === 0) {
      return <div className="text-center py-8 text-slate-400 text-sm font-medium">No urgent actions required</div>;
    }

    return allAlerts.map((alert) => (
      <DashboardAlertCard
        key={alert.id}
        title={alert.title}
        message={alert.message}
        severity={alert.severity as AnalyticsSeverity}
        timestamp="Real-time"
      />
    ));
  };

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Executive Dashboard</h1>
            {isDemoData && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 animate-pulse">
                Demo Preview Mode
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500">System-wide operational overview and performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardFilterBar
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            branch={selectedBranch}
            onBranchChange={setSelectedBranch}
          />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Updated</p>
            <p className="text-xs font-bold text-slate-600">{lastUpdated.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Top KPIs */}
          <DashboardSection title="Core Performance" subtitle="Real-time operational snapshots">
            {renderKpis()}
          </DashboardSection>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Action Needed Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Action Needed</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black">
                  {alerts ? alerts.lowStock.length + alerts.criticalLabs.length : 0} URGENT
                </span>
              </div>
              <div className="space-y-3">
                {renderAlerts()}
              </div>
            </div>

            {/* Trends & Analytics */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900 flex justify-between items-center">
                    <span>Patient Volume Trend</span>
                    {isDemoData && (
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        DEMO PREVIEW
                      </span>
                    )}
                  </h3>
                  <div className="h-[calc(100%-3rem)]">
                    <VolumeAreaChart
                      data={trends}
                      title="Patient Volume"
                      valueLabel="Patients"
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900 flex justify-between items-center">
                    <span>Revenue Trend</span>
                    {isDemoData && (
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        DEMO PREVIEW
                      </span>
                    )}
                  </h3>
                  <div className="h-[calc(100%-3rem)]">
                    <TrendLineChart
                      data={revenueTrends}
                      title="Revenue Trend"
                      valueLabel="Revenue (₱)"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Dept Workload</h3>
                  <div className="h-[calc(100%-3rem)]">
                    <StatusDonutChart
                      data={(topLists?.busiestDepts || []).map(d => ({ label: d.label, value: Number(String(d.value).replace('%', '')) || 0 })) as StatusBreakdown[]}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Branch Comparison</h3>
                  <div className="h-[calc(100%-3rem)]">
                    <ComparisonBarChart
                      data={(topLists?.busiestDepts || []).map(d => ({ label: d.label, value: Number(String(d.value).replace('%', '')) || 0 })) as TrendPoint[]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top-N Tables */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <DashboardDataTable<AdminDashboardTopListEntry>
              title="Top Unpaid Invoices"
              columns={[
                { header: 'Client', accessor: 'label' },
                { header: 'Amount', accessor: 'value', className: 'font-bold text-slate-900' },
                { header: 'Status', accessor: () => 'Unpaid', className: 'text-rose-500' },
              ]}
              data={(topLists?.unpaidBills || []).map((b, i) => ({ ...b, id: i.toString() }))}
            />
            <DashboardDataTable<AdminDashboardTopListEntry>
              title="Busiest Departments"
              columns={[
                { header: 'Department', accessor: 'label' },
                { header: 'Load', accessor: 'value', className: 'font-bold text-slate-900' },
                { header: 'Trend', accessor: () => 'Stable', className: 'text-slate-400' },
              ]}
              data={(topLists?.busiestDepts || []).map((d, i) => ({ ...d, id: i.toString() }))}
            />
          </div>

          {/* Data Label */}
          <div className="flex justify-center mt-6">
            <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {isDemoData ? 'Demo analytics preview — sample data for client walkthrough' : 'Mixed Mode: Real Operations / Demo Analytics'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
