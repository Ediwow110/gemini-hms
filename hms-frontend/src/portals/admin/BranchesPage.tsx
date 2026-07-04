import React, { useState, useEffect, useCallback } from 'react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { AdminShellNotice } from './components/AdminShellNotice';
import { BranchActivityPanel } from './components/BranchActivityPanel';
import { Building, Plus, Search, Filter } from 'lucide-react';
import { adminService, type AdminBranchItem } from '../../services/admin.service';

interface BranchItem {
  id: string;
  name: string;
  code: string;
  tenant: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
  director: string;
  doctors: number;
  nurses: number;
  beds: number;
  activeQueue: number;
  latency: number;
  encountersToday: number;
}

function mapToBranchItem(apiItem: AdminBranchItem): BranchItem {
  return {
    id: apiItem.id,
    name: apiItem.name,
    code: apiItem.code,
    tenant: '\u2014',
    status: 'ACTIVE' as const,
    director: '\u2014',
    doctors: 0,
    nurses: 0,
    beds: 0,
    activeQueue: 0,
    latency: 0,
    encountersToday: 0,
  };
}

export const BranchesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.listBranches({ search: search || undefined });
      setBranches(response.data.map(mapToBranchItem));
    } catch {
      setError('Failed to load branches. Using API service.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const filteredBranches = branches.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
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
    <HmsDashboardShell widthTier="full"
      footer={<HmsAuditFooter dataSource="Live branch API" />}
    >
      <AdminShellNotice />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <HmsPageHeader
          title="Branch Directory"
          description="Manage and trace physical hospital networks, capacities, and network latency thresholds."
          badge="Beta"
        />
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 w-fit animate-pulse-subtle"
        >
          <Plus className="h-4 w-4" /> Provision Branch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.slice(0, 3).map((b) => (
          <BranchActivityPanel key={b.id} branch={b} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search branch name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE')}
            className="appearance-none btn border border-slate-200 bg-white text-slate-650 hover:bg-slate-50 pl-9 pr-8 py-2.5 text-xs font-bold rounded-xl cursor-pointer focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OFFLINE">Offline</option>
          </select>
          <Filter className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
          {error}
        </div>
      ) : filteredBranches.length === 0 ? (
        <HmsEmptyState
          title="No matching branches"
          description="Try adjusting your search query."
          icon={<Building className="h-6 w-6" />}
        />
      ) : (
        <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Branch Details</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Parent Tenant</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Beds Capacity</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Staff</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Link Latency</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBranches.map((b) => (
                  <tr key={b.id} className="hover:bg-indigo-50/10">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-500" title={b.id}>{b.id.length > 8 ? `${b.id.slice(0, 8)}\u2026` : b.id}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div>
                        <p>{b.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Director: {b.director}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">{b.code}</td>
                    <td className="px-6 py-4 font-semibold text-slate-400 italic">{b.tenant}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-400">{b.beds || '\u2014'}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      {b.doctors > 0 ? `${b.doctors} Doctors / ${b.nurses} Nurses` : '\u2014'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-400">{b.latency > 0 ? `${b.latency}ms` : '\u2014'}</td>
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
            Staff, capacity, latency, and SLA data not yet available from backend. Branch API fields are limited to id, name, code.
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
                  Provision Branch
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Not yet implemented</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                Branch provisioning is a WIP feature. The backend does not expose a POST endpoint yet.
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
export default BranchesPage;
