import React, { useState, useEffect, useCallback } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import { Building, Plus, Search, Filter, Globe, Users, Layers } from 'lucide-react';
import { adminService, type AdminTenantItem } from '../../services/admin.service';

export const TenantsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tenants, setTenants] = useState<AdminTenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.listTenants();
      setTenants(data);
    } catch {
      setError('Unable to load tenants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const derivedStats = [
    { label: 'Total Tenants', val: tenants.length.toString(), icon: Globe, color: 'from-indigo-500 to-violet-500 shadow-indigo-200/50' },
    { label: 'Active', val: tenants.filter((t) => t.status === 'ACTIVE').length.toString(), icon: Building, color: 'from-emerald-500 to-teal-500 shadow-emerald-200/50' },
    { label: 'Total Users', val: tenants.reduce((sum, t) => sum + t.userCount, 0).toString(), icon: Users, color: 'from-blue-500 to-cyan-500 shadow-blue-200/50' },
    { label: 'Total Branches', val: tenants.reduce((sum, t) => sum + t.branchCount, 0).toString(), icon: Layers, color: 'from-amber-500 to-orange-500 shadow-amber-200/50' },
  ];

  return (
    <HmsDashboardShell
      widthTier="full"
      footer={<HmsAuditFooter dataSource="Live tenant API (GET /api/v1/admin/tenants)" />}
    >
      <AdminShellNotice />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <HmsPageHeader
          title="Multi-Tenant Console"
          description="Global configuration and monitoring of isolated tenant clusters."
          badge="Live"
        />
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 w-fit"
        >
          <Plus className="h-4 w-4" /> Provision Tenant
        </button>
      </div>

      {loading ? (
        <>
          <HmsLoadingSkeleton variant="kpi" />
          <HmsLoadingSkeleton variant="table" rows={3} />
        </>
      ) : error ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
          {error}
          <button
            type="button"
            onClick={fetchTenants}
            className="ml-3 underline font-bold"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {derivedStats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className={`card-hover p-4 text-center animate-slide-up stagger-${i + 1}`}
                >
                  <div
                    className={`mx-auto w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} shadow-md flex items-center justify-center mb-2.5`}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <p
                    className="text-2xl font-extrabold text-slate-900"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {s.val}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tenant name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED')}
                className="appearance-none btn border border-slate-200 bg-white text-slate-650 hover:bg-slate-50 pl-9 pr-8 py-2.5 text-xs font-bold rounded-xl cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <Filter className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {filteredTenants.length === 0 ? (
            <HmsEmptyState
              title="No matching tenants"
              description={search ? 'Try adjusting your search query.' : 'No tenants configured.'}
              icon={<Globe className="h-6 w-6" />}
            />
          ) : (
            <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant ID</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant Name</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Users</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Branches</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Lifecycle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-indigo-50/10 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-slate-500" title={t.id}>
                            {t.id.length > 8 ? `${t.id.slice(0, 8)}\u2026` : t.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{t.name}</p>
                              <p className="text-[10px] text-slate-400">Tenant</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              t.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : t.status === 'INACTIVE'
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-900">{t.userCount}</td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-900">{t.branchCount}</td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-bold border border-amber-200">
                            WIP
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-2 text-[10px] text-slate-400 bg-slate-50 border-t border-slate-100 italic">
                Tenant management is read-only in this release. Create, edit, suspend, and delete operations require new backend endpoints.
              </div>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-in relative">
            <div className="flex gap-3 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl h-fit border border-indigo-100">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider select-none">
                  Provision Tenant
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Not yet implemented</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                Tenant provisioning is a WIP feature. The backend does not expose a POST endpoint yet.
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
