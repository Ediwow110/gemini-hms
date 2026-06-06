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
import { pharmacyDashboardService, type PharmacyDashboardData, type PharmacyDashboardTopListEntry } from '../../services/pharmacy-dashboard.service';
import { Package, AlertTriangle, Activity, ClipboardList, Loader2, AlertCircle } from 'lucide-react';
import type { DateRange, AnalyticsSeverity } from '../../types/analytics';

const INITIAL_DATE_RANGE: DateRange = { 
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
  to: new Date().toISOString().split('T')[0] 
};

export const PharmacyDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(INITIAL_DATE_RANGE);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PharmacyDashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const branchId = selectedBranch === 'all' ? 'main-branch' : selectedBranch;
        const result = await pharmacyDashboardService.getDashboardData(branchId);
        setData(result);
        setLastUpdated(new Date());
      } catch {
        setError('Failed to load pharmacy dashboard data.');
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Pharmacy Dashboard</h1>
          <p className="text-sm font-medium text-slate-500">Inventory risk visibility and dispensing operations.</p>
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
          <DashboardSection title="Inventory Summary" subtitle="Real-time stock levels and queue status">
            {data?.kpis.map((kpi, idx) => (
              <DashboardKpiCard 
                key={idx}
                title={kpi.title}
                value={kpi.value}
                description={kpi.description}
                severity={kpi.severity as AnalyticsSeverity}
                icon={kpi.title.includes('Inventory') ? Package : kpi.title.includes('Stock') ? AlertTriangle : kpi.title.includes('Queue') ? ClipboardList : Activity}
              />
            ))}
          </DashboardSection>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Risk Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Inventory Risks</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black">
                  {data?.alerts.length || 0} ALERTS
                </span>
              </div>
              <div className="space-y-3">
                {data?.alerts.length ? data.alerts.map((alert, idx) => (
                  <DashboardAlertCard 
                    key={alert.id || idx}
                    title={alert.title}
                    message={alert.message}
                    severity={alert.severity as AnalyticsSeverity}
                    timestamp="Now"
                  />
                )) : (
                  <div className="text-center py-8 text-slate-400 text-sm font-medium">No critical stock risks</div>
                )}
              </div>
            </div>

            {/* Analytics */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Stock Status Distribution</h3>
                  <div className="h-[calc(100%-3rem)]">
                    <StatusDonutChart 
                      data={data?.stockDistribution || []} 
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Category Distribution</h3>
                  <div className="h-[calc(100%-3rem)]">
                    <ComparisonBarChart 
                      data={data?.categoryDistribution || []} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Dispensing Throughput (7d)</h3>
                <div className="h-[calc(100%-3rem)]">
                  <VolumeAreaChart 
                    data={[]} // Data gap: requires historical dispense logs aggregation
                  />
                </div>
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-xs text-slate-500 font-medium">Dispense trend data currently unavailable. Real-time queue active.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Tables */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <DashboardDataTable<PharmacyDashboardTopListEntry>
              title="Top Dispensed Medications"
              columns={[
                { header: 'Medication', accessor: 'label' },
                { header: 'Quantity', accessor: 'value', className: 'font-bold text-slate-900' },
                { header: 'Trend', accessor: (item) => item.trend || 'Stable', className: 'text-emerald-500' },
              ]}
              data={data?.topDispensed || []}
            />
            <DashboardDataTable<PharmacyDashboardTopListEntry>
              title="Lowest Stock Items"
              columns={[
                { header: 'Medication', accessor: 'label' },
                { header: 'Current Stock', accessor: 'value', className: 'font-bold text-slate-900' },
                { header: 'Status', accessor: (item) => item.trend || 'LOW', className: 'text-rose-500' },
              ]}
              data={data?.lowestStock || []}
            />
          </div>
        </>
      )}

      {/* Data Label */}
      <div className="flex justify-center">
        <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Mixed Mode: Real Stock Levels / Demo Analytics
        </span>
      </div>
    </div>
  );
};
