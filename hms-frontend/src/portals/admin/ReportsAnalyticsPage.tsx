import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, BedDouble, FileText, AlertTriangle } from 'lucide-react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsKpiStrip, HmsLoadingSkeleton, HmsDrilldownTable } from '../../components/hms-dashboard';
import { analyticsService } from '../../services/analytics.service';

interface ApiStatus {
  diagnoses: 'loading' | 'success' | 'error';
  occupancy: 'loading' | 'success' | 'error';
  waitTimes: 'loading' | 'success' | 'error';
  revenue: 'loading' | 'success' | 'error';
}

export const ReportsAnalyticsPage: React.FC = () => {
  const [diagnoses, setDiagnoses] = useState<{ diagnosis: string; count: number }[]>([]);
  const [occupancy, setOccupancy] = useState<{ branch: string; occupancyRate: number }[]>([]);
  const [waitTimes, setWaitTimes] = useState<{ department: string; avgWaitMinutes: number }[]>([]);
  const [revenue, setRevenue] = useState<{ totalRevenue: number; period: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    diagnoses: 'loading',
    occupancy: 'loading',
    waitTimes: 'loading',
    revenue: 'loading',
  });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setGlobalError(null);

      const status: ApiStatus = {
        diagnoses: 'loading',
        occupancy: 'loading',
        waitTimes: 'loading',
        revenue: 'loading',
      };

      try {
        const d = await analyticsService.getTopDiagnoses();
        setDiagnoses(d);
        status.diagnoses = 'success';
      } catch {
        setDiagnoses([]);
        status.diagnoses = 'error';
      }

      try {
        const o = await analyticsService.getBedOccupancy();
        setOccupancy(o);
        status.occupancy = 'success';
      } catch {
        setOccupancy([]);
        status.occupancy = 'error';
      }

      try {
        const w = await analyticsService.getWaitTime();
        setWaitTimes(w);
        status.waitTimes = 'success';
      } catch {
        setWaitTimes([]);
        status.waitTimes = 'error';
      }

      try {
        const r = await analyticsService.getRevenue();
        setRevenue(r);
        status.revenue = 'success' as const;
      } catch {
        setRevenue(null);
        status.revenue = 'error';
      }

      setApiStatus(status);
      const allFailed = Object.values(status).every((s) => s === 'error');
      if (allFailed) {
        setGlobalError('Unable to load any analytics data. All analytics endpoints are unavailable.');
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const errorCount = Object.values(apiStatus).filter((s) => s === 'error').length;
  const hasData = diagnoses.length > 0 || occupancy.length > 0 || waitTimes.length > 0 || revenue !== null;

  const kpis = revenue ? [
    { id: 'kpi-revenue', label: 'Revenue', value: `₱${revenue.totalRevenue.toLocaleString()}`, severity: 'success' as const },
    { id: 'kpi-diagnoses', label: 'Top Diagnoses', value: diagnoses.length.toLocaleString(), severity: diagnoses.length > 0 ? 'info' as const : 'warning' as const },
    { id: 'kpi-wait', label: 'Avg Wait Time', value: waitTimes.length > 0 ? `${Math.round(waitTimes.reduce((a, b) => a + b.avgWaitMinutes, 0) / waitTimes.length)}m` : 'N/A', severity: waitTimes.length > 0 ? 'info' as const : 'warning' as const },
  ] : [];

  return (
    <HmsDashboardShell widthTier="full" footer={<HmsAuditFooter dataSource="Analytics API" />}>
      <HmsPageHeader title="System Reports & Performance Analytics" description="Operational reporting workspace for transactions, APIs, and analytics." badge={loading ? 'Loading...' : 'Live'} />

      {globalError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800 flex items-start gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {!hasData && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700 flex items-start gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold mb-1">No analytics data available</p>
            <p>
              {errorCount > 0
                ? `${errorCount} of 4 analytics endpoints returned errors. This may indicate that the analytics backend is not deployed or configured.`
                : 'The analytics endpoints returned empty results. Data will appear once patient encounters are recorded.'}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <HmsLoadingSkeleton variant="kpi" />
      ) : (
        <div className="space-y-6">
          {kpis.length > 0 && <HmsKpiStrip metrics={kpis} loading={false} />}

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 xl:col-span-6">
              <HmsDrilldownTable
                title="Top Diagnoses"
                description="Most frequently diagnosed conditions"
                data={diagnoses}
                keyExtractor={(item) => item.diagnosis}
                columns={[
                  { key: 'diagnosis', header: 'Diagnosis', render: (item) => <span className="font-semibold text-slate-800">{item.diagnosis}</span> },
                  { key: 'count', header: 'Count', render: (item) => <span className="font-mono font-bold text-slate-900">{item.count}</span> },
                ]}
                emptyMessage={apiStatus.diagnoses === 'error' ? 'Analytics API unavailable for this metric.' : 'No diagnosis data available'}
                maxRows={10}
              />
            </div>

            <div className="col-span-12 xl:col-span-6">
              <HmsDrilldownTable
                title="Bed Occupancy"
                description="Current occupancy rates by branch"
                data={occupancy}
                keyExtractor={(item) => item.branch}
                columns={[
                  { key: 'branch', header: 'Branch', render: (item) => <span className="font-semibold text-slate-800">{item.branch}</span> },
                  { key: 'rate', header: 'Rate', render: (item) => <span className="font-mono font-bold text-slate-900">{item.occupancyRate}%</span> },
                ]}
                emptyMessage={apiStatus.occupancy === 'error' ? 'Analytics API unavailable for this metric.' : 'No occupancy data available'}
                maxRows={10}
              />
            </div>

            <div className="col-span-12 xl:col-span-6">
              <HmsDrilldownTable
                title="Wait Times"
                description="Average wait times by department"
                data={waitTimes}
                keyExtractor={(item) => item.department}
                columns={[
                  { key: 'department', header: 'Department', render: (item) => <span className="font-semibold text-slate-800">{item.department}</span> },
                  { key: 'wait', header: 'Avg Minutes', render: (item) => <span className="font-mono font-bold text-slate-900">{item.avgWaitMinutes}m</span> },
                ]}
                emptyMessage={apiStatus.waitTimes === 'error' ? 'Analytics API unavailable for this metric.' : 'No wait time data available'}
                maxRows={10}
              />
            </div>

            <div className="col-span-12 xl:col-span-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3"><Activity className="h-5 w-5 text-slate-500" /><h3 className="text-sm font-bold text-slate-800">Quick Reports</h3></div>
                <div className="space-y-2">
                  <a href="/admin/executive" className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><TrendingUp className="h-4 w-4 text-blue-500" /> Executive Dashboard</a>
                  <a href="/admin/audit-logs" className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><FileText className="h-4 w-4 text-amber-500" /> Audit Logs</a>
                  <a href="/admin/branches" className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><BedDouble className="h-4 w-4 text-emerald-500" /> Branch Management</a>
                </div>
              </div>
            </div>
          </div>

          {errorCount > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">API Status</p>
              <div className="flex gap-4 text-xs">
                <span className={apiStatus.diagnoses === 'error' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  Diagnoses: {apiStatus.diagnoses === 'error' ? 'ERROR' : 'OK'}
                </span>
                <span className={apiStatus.occupancy === 'error' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  Occupancy: {apiStatus.occupancy === 'error' ? 'ERROR' : 'OK'}
                </span>
                <span className={apiStatus.waitTimes === 'error' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  Wait Times: {apiStatus.waitTimes === 'error' ? 'ERROR' : 'OK'}
                </span>
                <span className={apiStatus.revenue === 'error' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                  Revenue: {apiStatus.revenue === 'error' ? 'ERROR' : 'OK'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default ReportsAnalyticsPage;
