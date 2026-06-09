import React, { useState, useEffect } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import { TenantHealthCard } from './components/TenantHealthCard';
import { Building, Plus, Search, Filter, Database } from 'lucide-react';
import { StatusBadge } from '../../components/feedback/StatusBadge';

interface TenantItem {
  id: string;
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  tier: 'ENTERPRISE' | 'PREMIUM' | 'STANDARD';
  branchCount: number;
  userCount: number;
  dbSize: string;
  cpuUsage: number;
  ramUsage: number;
  errorRate: number;
  region: string;
}

export const TenantsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HEALTHY' | 'DEGRADED' | 'CRITICAL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const mockTenants: TenantItem[] = [
    {
      id: "TEN-001",
      name: "St. Jude Hospital Network",
      status: "HEALTHY",
      tier: "ENTERPRISE",
      branchCount: 8,
      userCount: 142,
      dbSize: "42.5 GB",
      cpuUsage: 28,
      ramUsage: 64,
      errorRate: 0.012,
      region: "US-East"
    },
    {
      id: "TEN-002",
      name: "MediClinics Group",
      status: "DEGRADED",
      tier: "PREMIUM",
      branchCount: 3,
      userCount: 48,
      dbSize: "12.8 GB",
      cpuUsage: 89,
      ramUsage: 78,
      errorRate: 1.450,
      region: "AP-South"
    },
    {
      id: "TEN-003",
      name: "Apex Healthcare Services",
      status: "HEALTHY",
      tier: "STANDARD",
      branchCount: 2,
      userCount: 18,
      dbSize: "4.2 GB",
      cpuUsage: 14,
      ramUsage: 45,
      errorRate: 0.005,
      region: "EU-West"
    }
  ];

  const filteredTenants = mockTenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <HmsDashboardShell>
        <HmsLoadingSkeleton variant="kpi" />
        <HmsLoadingSkeleton variant="table" rows={3} />
      </HmsDashboardShell>
    );
  }

  return (
    <HmsDashboardShell
      footer={<HmsAuditFooter dataSource="Mock tenant data (sandbox)" />}
    >
      <AdminShellNotice />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <HmsPageHeader
          title="Multi-Tenant Console"
          description="Global configuration and monitoring of isolated tenant clusters and databases."
          badge="Sandbox"
        />
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 w-fit"
        >
          <Plus className="h-4 w-4" /> Provision Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockTenants.map((t) => (
          <TenantHealthCard key={t.id} tenant={t} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search tenant name, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'HEALTHY' | 'DEGRADED' | 'CRITICAL')}
            className="appearance-none btn border border-slate-200 bg-white text-slate-650 hover:bg-slate-50 pl-9 pr-8 py-2.5 text-xs font-bold rounded-xl cursor-pointer focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="HEALTHY">Healthy</option>
            <option value="DEGRADED">Degraded</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <Filter className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {filteredTenants.length === 0 ? (
        <HmsEmptyState
          title="No matching tenants"
          description="Try adjusting your search query."
          icon={<Database className="h-6 w-6" />}
        />
      ) : (
        <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-sm text-left min-w-[800px] border-separate border-spacing-0">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Tenant Name</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Subscription Tier</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-200">Branches</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-200">Total Users</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Storage Used</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">API SLA Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-indigo-50/10 group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-indigo-50/10 px-6 py-4 font-bold text-slate-800 border-b border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div>
                        <p>{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {t.id} | Region: {t.region}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100">
                      <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-2 py-0.5 rounded-md">
                        {t.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700 border-b border-slate-100">{t.branchCount}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700 border-b border-slate-100">{t.userCount}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600 border-b border-slate-100">{t.dbSize}</td>
                    <td className="px-6 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <StatusBadge 
                          status={t.status} 
                          type={t.status === 'HEALTHY' ? 'success' : t.status === 'DEGRADED' ? 'warning' : 'danger'} 
                        />
                        <span className="text-[10px] text-slate-400 font-mono">({t.errorRate.toFixed(3)}% errors)</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-in relative">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit border border-indigo-100">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                  Provision Tenant
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Mock governance sandbox execution</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                This forms a simulated tenant registration workflow. Database clusters, container configurations, and isolated namespaces are shown as mock configurations. No write actions are committed to the HMS backend API.
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-full btn border border-slate-200 hover:bg-slate-50 font-bold py-2 rounded-xl text-slate-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};
export default TenantsPage;
