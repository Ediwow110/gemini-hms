import React, { useEffect, useState } from 'react';
import { 
  DashboardKpiCard, 
  DashboardAlertCard, 
  DashboardDataTable, 
  DashboardSection, 
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
      } catch {
        setError('Failed to load clinical operations data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-full w-full text-red-500">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 flex items-center justify-center h-full w-full text-slate-500">
        No operational data available.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clinical Operations</h1>
          <p className="text-slate-500">Patient flow and clinical workload monitoring</p>
        </div>
        <DashboardFilterBar 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange} 
        />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Panel */}
        <div className="lg:col-span-1 space-y-6">
          <DashboardSection title="Urgent Actions">
            <div className="col-span-full space-y-3">
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
                <p className="text-sm text-slate-500 text-center py-4">No urgent actions required.</p>
              )}
            </div>
          </DashboardSection>

          <DashboardSection title="Department Pressure">
            <div className="col-span-full space-y-2">
              {data.topDepartments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600">{dept.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">{dept.value}</span>
                    <span className={`text-xs ${dept.trend === '↑' ? 'text-red-500' : dept.trend === '↓' ? 'text-green-500' : 'text-slate-400'}`}>
                      {dept.trend}
                    </span>
                  </div>
                </div>
              ))}
              <div className="mt-3 p-2 bg-slate-100 rounded text-[10px] text-slate-500 italic text-center">
                Demo Data: Departmental trends are simulated.
              </div>
            </div>
          </DashboardSection>
        </div>

        {/* Main Queue / Flow */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-black tracking-tight text-slate-900 px-1">Pending Clinical Queue</h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardSection title="Patient Flow Distribution">
               <div className="col-span-full flex flex-col gap-3 py-4">
                  {data.flowDistribution.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-medium text-slate-900">{item.value}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-slate-500 h-full transition-all duration-500" 
                          style={{ width: `${(item.value / (data.flowDistribution.reduce((a, b) => a + b.value, 0) || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
               </div>
            </DashboardSection>

            <DashboardSection title="Workload by Specialty">
               <div className="col-span-full flex flex-col gap-3 py-4">
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
                  <div className="mt-2 p-2 bg-slate-100 rounded text-[10px] text-slate-500 italic text-center">
                    Demo Data: Workload distribution is simulated.
                  </div>
               </div>
            </DashboardSection>
          </div>
        </div>
      </div>

      <div className="text-right text-[10px] text-slate-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default ClinicalOperationsDashboard;


