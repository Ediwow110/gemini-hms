import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Building, Shield, Activity } from 'lucide-react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsKpiStrip, HmsLoadingSkeleton } from '../../components/hms-dashboard';
import { dashboardService } from '../../services/dashboard.service';
import { adminService } from '../../services/admin.service';

export const SuperAdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<{ activePatients: number; todaysAppointments: number; pendingLabs: number; lowStock: number; revenue: number; securityAlerts: number } | null>(null);
  const [tenants, setTenants] = useState<{ id: string; name: string; status: string; userCount: number; branchCount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, t] = await Promise.all([
          dashboardService.getAdminSummary({ dateRange: { from: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] } }),
          adminService.listTenants(),
        ]);
        setSummary(s);
        setTenants(t);
      } catch {
        setError('Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const kpis = summary ? [
    { id: 'kpi-patients', label: 'Active Patients', value: summary.activePatients.toLocaleString(), severity: 'info' as const },
    { id: 'kpi-volume', label: "Today's Volume", value: summary.todaysAppointments.toLocaleString(), severity: 'success' as const },
    { id: 'kpi-revenue', label: '7d Revenue', value: `₱${summary.revenue.toLocaleString()}`, severity: 'success' as const },
    { id: 'kpi-security', label: 'Security Events', value: summary.securityAlerts.toLocaleString(), severity: summary.securityAlerts > 0 ? 'critical' as const : 'success' as const },
    { id: 'kpi-tenants', label: 'Tenants', value: tenants.length.toLocaleString(), severity: 'info' as const },
  ] : [];

  return (
    <HmsDashboardShell widthTier="full" footer={<HmsAuditFooter dataSource="System Operations API" />}>
      <HmsPageHeader title="Platform Command Center" description="Multi-tenant operations, security posture, system health, and drilldown-ready governance signals." badge={loading ? 'Loading...' : 'Live'} />

      {loading ? (
        <HmsLoadingSkeleton variant="kpi" />
      ) : error ? (
        <div className="max-w-3xl mx-auto py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <p className="text-sm text-slate-600">{error}</p>
            <Link to="/admin/executive" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs font-bold hover:bg-indigo-700">
              Open Live Admin Executive <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <HmsKpiStrip metrics={kpis} loading={false} />

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 xl:col-span-8">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-800">Tenant Overview</h3>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="pb-2">Tenant</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Users</th>
                      <th className="pb-2">Branches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100">
                        <td className="py-2.5 font-semibold text-slate-800">{t.name}</td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${t.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono font-bold text-slate-900">{t.userCount}</td>
                        <td className="py-2.5 font-mono font-bold text-slate-900">{t.branchCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="col-span-12 xl:col-span-4 space-y-4">
              <Link to="/admin/tenants" className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Tenants</p>
                    <p className="text-[11px] text-slate-500">Manage multi-tenant</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
                </div>
              </Link>
              <Link to="/admin/security" className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-rose-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Security Center</p>
                    <p className="text-[11px] text-slate-500">Audit & compliance</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
                </div>
              </Link>
              <Link to="/admin/reports" className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Reports</p>
                    <p className="text-[11px] text-slate-500">Analytics & exports</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
                </div>
              </Link>
              <Link to="/admin/executive" className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Executive Dashboard</p>
                    <p className="text-[11px] text-slate-500">Patient volume & revenue</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default SuperAdminDashboard;
