import React, { useState } from 'react';
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
import { ADMIN_DASHBOARD_MOCK } from '../../mocks/dashboard-admin.mock';
import { Users, Calendar, FlaskConical, Package, DollarSign, ShieldAlert } from 'lucide-react';
import type { DateRange, AnalyticsSeverity } from '../../types/analytics';

const INITIAL_DATE_RANGE: DateRange = { 
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
  to: new Date().toISOString().split('T')[0] 
};

export const AdminExecutiveDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(INITIAL_DATE_RANGE);
  const [selectedBranch, setSelectedBranch] = useState('all');

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
            <p className="text-xs font-bold text-slate-600">Just now</p>
          </div>
        </div>
      </div>

      {/* Top KPIs */}
      <DashboardSection title="Core Performance" subtitle="Real-time operational snapshots">
        {ADMIN_DASHBOARD_MOCK.kpis.map((kpi, idx) => (
          <DashboardKpiCard 
            key={idx}
            title={kpi.title}
            value={kpi.value}
            description={kpi.description}
            trend={kpi.trend}
            severity={kpi.severity as AnalyticsSeverity}
            icon={kpi.icon === 'Users' ? Users : kpi.icon === 'Calendar' ? Calendar : kpi.icon === 'FlaskConical' ? FlaskConical : kpi.icon === 'Package' ? Package : kpi.icon === 'DollarSign' ? DollarSign : ShieldAlert}
            href={kpi.href}
          />
        ))}
      </DashboardSection>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Action Needed Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Action Needed</h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black">
              {ADMIN_DASHBOARD_MOCK.alerts.length} URGENT
            </span>
          </div>
          <div className="space-y-3">
            {ADMIN_DASHBOARD_MOCK.alerts.map((alert) => (
              <DashboardAlertCard 
                key={alert.id}
                title={alert.title}
                message={alert.message}
                severity={alert.severity as AnalyticsSeverity}
                actionLabel={alert.actionLabel}
                actionHref={alert.actionHref}
                timestamp={alert.timestamp}
              />
            ))}
          </div>
        </div>

        {/* Trends & Analytics */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Patient Volume Trend</h3>
              <VolumeAreaChart 
                data={ADMIN_DASHBOARD_MOCK.trends.patientVolume} 
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Revenue Trend</h3>
              <TrendLineChart 
                data={ADMIN_DASHBOARD_MOCK.trends.revenue} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Dept Workload</h3>
              <StatusDonutChart 
                data={ADMIN_DASHBOARD_MOCK.distributions.deptWorkload} 
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-black tracking-tight text-slate-900">Branch Comparison</h3>
              <ComparisonBarChart 
                data={ADMIN_DASHBOARD_MOCK.distributions.branchComparison} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top-N Tables */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <DashboardDataTable 
          title="Top Unpaid Invoices"
          columns={[
            { header: 'Client', accessor: 'label' },
            { header: 'Amount', accessor: 'value', className: 'font-bold text-slate-900' },
            { header: 'Status', accessor: 'trend', className: 'text-rose-500' },
          ]}
          data={ADMIN_DASHBOARD_MOCK.topLists.unpaidBills}
          href={(item) => item.drillDownUrl}
        />
        <DashboardDataTable 
          title="Busiest Departments"
          columns={[
            { header: 'Department', accessor: 'label' },
            { header: 'Load', accessor: 'value', className: 'font-bold text-slate-900' },
            { header: 'Trend', accessor: 'trend' },
          ]}
          data={ADMIN_DASHBOARD_MOCK.topLists.busiestDepts}
          href={(item) => item.drillDownUrl}
        />
      </div>

      {/* Mock Label */}
      <div className="flex justify-center">
        <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Demo Mode: Using Synthetic Data
        </span>
      </div>
    </div>
  );
};

// Removed default export
