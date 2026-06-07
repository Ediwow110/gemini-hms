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
import { billingDashboardService, type BillingDashboardData } from '../../services/billing-dashboard.service';
import { DollarSign, AlertTriangle, Activity, Loader2, AlertCircle } from 'lucide-react';
import type { DateRange, AnalyticsSeverity } from '../../types/analytics';

const INITIAL_DATE_RANGE: DateRange = {
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  to: new Date().toISOString().split('T')[0]
};

export const BillingDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(INITIAL_DATE_RANGE);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BillingDashboardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const branchId = selectedBranch === 'all' ? 'main-branch' : selectedBranch;
        const result = await billingDashboardService.getDashboardData(branchId);
        setData(result);
        setLastUpdated(new Date());
      } catch {
        setError('Failed to load billing dashboard data.');
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Billing & Finance Dashboard</h1>
            {data?.isDemoData && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 animate-pulse">
                Demo Preview Mode
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500">Revenue monitoring, invoice tracking, and collection risk visibility.</p>
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
          <DashboardSection title="Financial Overview" subtitle="Real-time collection and receivables status">
            {data?.kpis.map((kpi, idx) => (
              <DashboardKpiCard
                key={idx}
                title={kpi.title}
                value={kpi.value}
                description={kpi.description}
                severity={kpi.severity as AnalyticsSeverity}
                icon={kpi.title.includes('Session') ? Activity : kpi.title.includes('Unpaid') ? AlertTriangle : kpi.title.includes('Overdue') ? AlertTriangle : DollarSign}
              />
            ))}
          </DashboardSection>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Risk Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Collection Risks</h2>
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
                  <div className="text-center py-8 text-slate-400 text-sm font-medium">No high-risk overdue invoices</div>
                )}
              </div>
            </div>

            {/* Analytics */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Invoice Status Distribution</h3>
                  <div className="h-[calc(100%-3rem)]">
                    <StatusDonutChart
                      data={data?.invoiceStatusDistribution || []}
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                  <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Payment Method Distribution</h3>
                  <div className="h-[calc(100%-3rem)]">
                    <ComparisonBarChart
                      data={data?.paymentMethodDistribution || []}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
                <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900 flex justify-between items-center">
                  <span>Revenue Collection Trend (7d)</span>
                  {data?.isDemoData && (
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      DEMO PREVIEW
                    </span>
                  )}
                </h3>
                <div className="h-[calc(100%-3rem)]">
                  <VolumeAreaChart
                    data={data?.revenueTrend || []}
                    title="Revenue Trend"
                    valueLabel="Revenue (₱)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Tables */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <DashboardDataTable
              title="Highest Outstanding"
              columns={[
                { header: 'Client', accessor: 'label' },
                { header: 'Balance', accessor: 'value', className: 'font-bold text-slate-900' },
                { header: 'Status', accessor: 'trend', className: 'text-rose-500' },
              ]}
              data={data?.highestOutstanding || []}
            />
            <DashboardDataTable
              title="Recent Payments"
              columns={[
                { header: 'Invoice #', accessor: 'label' },
                { header: 'Amount', accessor: 'value', className: 'font-bold text-slate-900' },
                { header: 'Status', accessor: 'trend', className: 'text-emerald-500' },
              ]}
              data={data?.recentPayments || []}
            />
          </div>
        </>
      )}

      {/* Data Label */}
      <div className="flex justify-center">
        <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
          {data?.isDemoData ? 'Demo analytics preview — sample data for client walkthrough' : 'Mixed Mode: Real Financials / Demo Analytics'}
        </span>
      </div>
    </div>
  );
};
