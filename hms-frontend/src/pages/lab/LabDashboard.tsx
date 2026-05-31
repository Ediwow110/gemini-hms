import React, { useState, useEffect } from 'react';
import { 
  DashboardSection, 
  DashboardKpiCard, 
  DashboardAlertCard, 
  DashboardDataTable, 
  DashboardFilterBar 
} from '../../components/dashboard';
import { 
  VolumeAreaChart, 
  StatusDonutChart, 
  ComparisonBarChart 
} from '../../components/analytics/charts';

import { labDashboardService, type LabDashboardData } from '../../services/lab-dashboard.service';
import { AlertTriangle, Activity, ClipboardList, Loader2, AlertCircle, Clock } from 'lucide-react';
import type { DateRange, AnalyticsSeverity } from '../../types/analytics';

const INITIAL_DATE_RANGE: DateRange = { 
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
  to: new Date().toISOString().split('T')[0] 
};

export const LabDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(INITIAL_DATE_RANGE);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LabDashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const branchId = selectedBranch === 'all' ? 'main-branch' : selectedBranch;
        const result = await labDashboardService.getDashboardData(branchId);
        setData(result);
        setLastUpdated(new Date());
      } catch {
        setError('Failed to load lab dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBranch]);

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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Lab Diagnostic Dashboard</h1>
          <p className="text-sm font-medium text-slate-500">Workload monitoring, TAT tracking and critical result visibility.</p>
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
          <DashboardSection title="Diagnostic Overview" subtitle="Real-time lab throughput and risk metrics">
            {data?.kpis.map((kpi, idx) => (
              <DashboardKpiCard 
                key={idx}
                title={kpi.title}
                value={kpi.value}
                description={kpi.description}
                severity={kpi.severity as AnalyticsSeverity}
                icon={kpi.title.includes('Pending') ? ClipboardList : kpi.title.includes('Completed') ? Activity : kpi.title.includes('Critical') ? AlertTriangle : Clock}
              />
            ))}
          </DashboardSection>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Action Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Priority Actions</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black">
                  {data?.alerts.length || 0} URGENT
                </span>
              </div>
              <div className="space-y-3">
                {data?.alerts.length ? data.alerts.map((alert, idx) => (
                  <DashboardAlertCard 
                    key={alert.id || idx}
                    title={alert.title}
                    message={alert.message}
                    severity={alert.severity as AnalyticsSeverity}
                    timestamp="Real-time"
                  />
                )) : (
                  <div className="text-center py-8 text-slate-400 text-sm font-medium">No critical actions pending</div>
                )}
              </div>
            </div>

            {/* Analytics */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Result Status Breakdown</h3>
                  <StatusDonutChart 
                    data={data?.statusDistribution || []} 
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Workload by Category</h3>
                  <ComparisonBarChart 
                    data={data?.workloadDistribution || []} 
                  />
                </div>
              </div>
              
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Turnaround Time Trend (7d)</h3>
                <VolumeAreaChart 
                  data={[]} // Data gap: requires historical TAT aggregation
                />
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-xs text-slate-500 font-medium">TAT trend data currently unavailable. Summary metrics are active.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Tables */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <DashboardDataTable 
              title="Most Requested Tests"
              columns={[
                { header: 'Test Name', accessor: 'label' },
                { header: 'Volume', accessor: 'value', className: 'font-bold text-slate-900' },
                { header: 'Trend', accessor: 'trend', className: 'text-emerald-500' },
              ]}
              data={data?.topRequestedTests || []}
            />
            <DashboardDataTable 
              title="Longest Pending"
              columns={[
                { header: 'Order #', accessor: 'label' },
                { header: 'Delay Status', accessor: 'value', className: 'font-bold text-slate-900' },
                { header: 'Priority', accessor: 'trend', className: 'text-rose-500' },
              ]}
              data={data?.longestPending || []}
            />
          </div>
        </>
      )}

      {/* Data Label */}
      <div className="flex justify-center">
        <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Mixed Mode: Real Workload / Demo Analytics
        </span>
      </div>
    </div>
  );
};
