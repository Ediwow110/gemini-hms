import React, { useEffect, useState } from 'react';
import {
  DashboardKpiCard,
  DashboardAlertCard,
  DashboardDataTable,
  DashboardFilterBar
} from '../../components/dashboard';
import { clinicalOpsDashboardService } from '../../services/clinical-ops-dashboard.service';
import type { ClinicalOpsDashboardData } from '../../types/clinical-ops-dashboard';
import type { ClinicalWorkQueueDto } from '../../services/clinicalWorkflow.service';
import {
  Activity,
  Users,
  Clock,
  AlertCircle,
  Stethoscope,
  Loader2
} from 'lucide-react';
import {
  StatusDonutChart,
  ComparisonBarChart
} from '../../components/analytics/charts';
import type { StatusBreakdown, TrendPoint } from '../../types/analytics';

export const ClinicalOperationsDashboard: React.FC = () => {
  const [data, setData] = useState<ClinicalOpsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isDemoData, setIsDemoData] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await clinicalOpsDashboardService.getDashboardData();
        setData(result);
        setIsDemoData(false);
        setLastUpdated(new Date());
      } catch (err) {
        console.warn('Failed to load clinical operations data from backend, falling back to mock data:', err);
        setData({
          kpis: [
            { title: 'Active Patients', value: 48, description: 'Currently in clinic (Demo)', severity: 'info' },
            { title: 'Pending Triage', value: 3, description: 'Awaiting initial assessment (Demo)', severity: 'success' },
            { title: 'Waiting for Doctor', value: 12, description: 'Ready for consultation (Demo)', severity: 'critical' },
            { title: 'Nursing Tasks', value: 15, description: 'Open clinical actions (Demo)', severity: 'info' },
          ],
          alerts: [
            { id: 'alert-1', title: 'Urgent Nursing Task', message: 'Administer IV meds - Patient: Demo Patient A', severity: 'critical' },
            { id: 'alert-2', title: 'Emergency Patient', message: 'Patient Demo Patient B in Urgent Care queue', severity: 'critical' },
          ],
          flowDistribution: [
            { label: 'Triage', value: 3 },
            { label: 'Waiting', value: 12 },
            { label: 'In Consultation', value: 18 },
            { label: 'Completed', value: 15 },
          ],
          workloadDistribution: [
            { label: 'General Practice', value: 40 },
            { label: 'Pediatrics', value: 25 },
            { label: 'Internal Medicine', value: 20 },
            { label: 'Urgent Care', value: 15 },
          ],
          topDepartments: [
            { id: 'd1', label: 'Emergency', value: 'High', trend: '↑' },
            { id: 'd2', label: 'Pediatrics', value: 'Medium', trend: '→' },
            { id: 'd3', label: 'General', value: 'Medium', trend: '↓' },
          ],
          pendingQueue: [
            { id: 'q-1', queueNumber: 'Q-001', patientName: 'Demo Patient A', category: 'URGENT', serviceType: 'Consultation', waitTimeMinutes: 22, status: 'WAITING' },
            { id: 'q-2', queueNumber: 'Q-002', patientName: 'Demo Patient B', category: 'EMERGENCY', serviceType: 'Triage', waitTimeMinutes: 5, status: 'TRIAGE' },
          ] as unknown as ClinicalWorkQueueDto[],
        });
        setIsDemoData(true);
        setLastUpdated(new Date());
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

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

  if (!data) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-500">
        No operational data available.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Clinical Operations</h1>
            {isDemoData && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 animate-pulse">
                Demo Preview Mode
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500">Patient flow and clinical workload monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardFilterBar
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Updated</p>
            <p className="text-xs font-bold text-slate-600">{lastUpdated.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi, idx) => (
          <DashboardKpiCard
            key={idx}
            title={kpi.title}
            value={kpi.value}
            description={kpi.description}
            severity={kpi.severity}
            icon={kpi.title.includes('Patients') ? Users : kpi.title.includes('Triage') ? Stethoscope : kpi.title.includes('Doctor') ? Clock : Activity}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Action Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Urgent Actions</h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black">
              {data.alerts.length} URGENT
            </span>
          </div>
          <div className="space-y-3">
            {data.alerts.length > 0 ? (
              data.alerts.map((alert) => (
                <DashboardAlertCard
                  key={alert.id}
                  title={alert.title}
                  message={alert.message}
                  severity={alert.severity}
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm font-medium">No urgent actions required.</div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-black tracking-tight text-slate-900 mb-3">Department Pressure</h3>
            <div className="space-y-2">
              {data.topDepartments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600">{dept.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{dept.value}</span>
                    <span className={`text-xs ${dept.trend === '↑' ? 'text-red-500' : dept.trend === '↓' ? 'text-green-500' : 'text-slate-400'}`}>
                      {dept.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2 bg-slate-100 rounded text-[10px] text-slate-500 italic text-center">
              Demo Data: Departmental trends are simulated.
            </div>
          </div>
        </div>

        {/* Main Queue / Flow */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black tracking-tight text-slate-900 mb-4 px-1">Pending Clinical Queue</h2>
            <DashboardDataTable
              title="Active Patient Queue"
              columns={[
                { header: 'Queue #', accessor: 'queueNumber' },
                { header: 'Patient', accessor: 'patientName' },
                { header: 'Category', accessor: 'category' },
                { header: 'Service', accessor: 'serviceType' },
                { header: 'Wait Time', accessor: (item: ClinicalWorkQueueDto) => `${item.waitTimeMinutes}m` },
                { header: 'Status', accessor: 'status' },
              ]}
              data={data.pendingQueue}
              emptyMessage="No patients currently in queue."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
              <h3 className="text-sm font-black tracking-tight text-slate-900 mb-4 flex justify-between items-center">
                <span>Patient Flow Distribution</span>
                {isDemoData && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">DEMO</span>}
              </h3>
              <div className="h-[calc(100%-3rem)]">
                <StatusDonutChart
                  data={data.flowDistribution.map(f => ({ label: f.label, value: f.value })) as StatusBreakdown[]}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
              <h3 className="text-sm font-black tracking-tight text-slate-900 mb-4 flex justify-between items-center">
                <span>Workload by Specialty</span>
                {isDemoData && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">DEMO</span>}
              </h3>
              <div className="h-[calc(100%-3rem)]">
                <ComparisonBarChart
                  data={data.workloadDistribution.map(w => ({ label: w.label, value: w.value })) as TrendPoint[]}
                  valueLabel="Workload %"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Label */}
      <div className="flex justify-center">
        <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
          {isDemoData ? 'Demo analytics preview — sample data for client walkthrough' : 'Mixed Mode: Real Queue / Demo Analytics'}
        </span>
      </div>
    </div>
  );
};

export default ClinicalOperationsDashboard;
