import React, { useEffect, useState, useMemo } from 'react';
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

const ClinicalOperationsDashboard: React.FC = () => {
  const [data, setData] = useState<ClinicalOpsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dateRange, setDateRange] = useState({ 
    from: new Date().toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const result = await clinicalOpsDashboardService.getDashboardData();
        setData(result);
        setLastUpdated(new Date());
      } catch {
        setError('Failed to load clinical operations data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const flowTotal = useMemo(() =>
    data ? data.flowDistribution.reduce((a, b) => a + b.value, 0) : 0,
    [data?.flowDistribution]
  );

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
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Clinical Operations</h1>
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black tracking-tight text-slate-900 mb-4">Patient Flow Distribution</h3>
              <div className="flex flex-col gap-3 py-2">
                {data.flowDistribution.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-900">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-500 h-full transition-all duration-500"
                        style={{ width: `${(item.value / (flowTotal || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black tracking-tight text-slate-900 mb-4">Workload by Specialty</h3>
              <div className="flex flex-col gap-3 py-2">
                {data.workloadDistribution.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-900">{item.value}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-400 h-full transition-all duration-500"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-slate-100 rounded text-[10px] text-slate-500 italic text-center">
                Demo Data: Workload distribution is simulated.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Label */}
      <div className="flex justify-center">
        <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
          Mixed Mode: Real Queue / Demo Analytics
        </span>
      </div>
    </div>
  );
};

export default ClinicalOperationsDashboard;


