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
import { Users, Calendar, FlaskConical, Package, DollarSign, ShieldAlert, AlertCircle, Loader2, type LucideIcon } from 'lucide-react';
import type { DateRange, AnalyticsSeverity, TrendPoint, StatusBreakdown } from '../../types/analytics';
import type { AdminDashboardSummary, AdminDashboardAlertsResponse, AdminDashboardTopListsResponse, AdminDashboardTopListEntry } from '../../types/analytics';

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
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [alerts, setAlerts] = useState<AdminDashboardAlertsResponse | null>(null);
  const [topLists, setTopLists] = useState<AdminDashboardTopListsResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
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
        setAlerts(alertsRes);
        setTopLists(topListsRes);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Please try again later.');
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
        title={cfg.title}
        value={cfg.key === 'revenue' ? `$${summary[cfg.key]?.toLocaleString()}` : summary[cfg.key]?.toString()}
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

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-12 w-12 text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900">{error}</h2>
          <button 
            onClick={() => window.location.reload()} 
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Executive Dashboard</h1>
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
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Patient Volume Trend</h3>
                  <div className="h-[calc(100%-3rem)]">
                    <VolumeAreaChart 
                      data={trends} 
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Revenue Trend</h3>
                  <div className="h-[calc(100%-3rem)]">
                    <TrendLineChart 
                      data={trends} 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Dept Workload</h3>
                  <div className="h-[calc(100%-3rem)]">
                    <StatusDonutChart 
                      data={(topLists?.busiestDepts || []).map(d => ({ label: d.label, value: Number(d.value) })) as StatusBreakdown[]} 
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Branch Comparison</h3>
                  <div className="h-[calc(100%-3rem)]">
                    <ComparisonBarChart 
                      data={(topLists?.busiestDepts || []).map(d => ({ label: d.label, value: Number(d.value) })) as TrendPoint[]} 
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
        </>
      )}
    </div>
  );
};
