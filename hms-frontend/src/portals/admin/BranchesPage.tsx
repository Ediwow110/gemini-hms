import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { BranchActivityPanel } from './components/BranchActivityPanel';
import { Building, Plus, AlertTriangle, Search, Filter } from 'lucide-react';
import { StatusBadge } from '../../components/feedback/StatusBadge';

interface BranchItem {
  id: string;
  name: string;
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

export const BranchesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const mockBranches: BranchItem[] = [
    {
      id: "BR-101",
      name: "St. Jude - Metro Manila",
      tenant: "St. Jude Hospital Network",
      status: "ACTIVE",
      director: "Dr. Sarah Almeda",
      doctors: 18,
      nurses: 34,
      beds: 120,
      activeQueue: 14,
      latency: 42,
      encountersToday: 68
    },
    {
      id: "BR-102",
      name: "St. Jude - Cebu City",
      tenant: "St. Jude Hospital Network",
      status: "ACTIVE",
      director: "Dr. Jose Rizal",
      doctors: 10,
      nurses: 15,
      beds: 60,
      activeQueue: 4,
      latency: 58,
      encountersToday: 24
    },
    {
      id: "BR-103",
      name: "MediClinics - Singapore",
      tenant: "MediClinics Group",
      status: "MAINTENANCE",
      director: "Dr. Lee Kuan Yew",
      doctors: 6,
      nurses: 12,
      beds: 30,
      activeQueue: 0,
      latency: 185,
      encountersToday: 8
    }
  ];

  const filteredBranches = mockBranches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.tenant.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Branches Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This module configures branches in local sandbox memory. Physical facilities, capacity matrices, and local network link parameters are simulated. No database updates are persisted to the HMS backend core API.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <PageHeader 
          title="Branch Directory" 
          description="Manage and trace physical hospital networks, capacities, and network latency thresholds." 
        />
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 w-fit animate-pulse-subtle"
        >
          <Plus className="h-4 w-4" /> Provision Branch
        </button>
      </div>

      {/* Grid: Health Card Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockBranches.map((b) => (
          <BranchActivityPanel key={b.id} branch={b} />
        ))}
      </div>

      {/* Filtering Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search branch name, parent tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <Filter className="h-4 w-4" /> Filter Status
        </button>
      </div>

      {/* Branches Table */}
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Branch Details</th>
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
                  <td className="px-6 py-4 font-bold text-slate-800">
                    <div>
                      <p>{b.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Director: {b.director} | ID: {b.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600">{b.tenant}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700">{b.beds}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {b.doctors} Doctors / {b.nurses} Nurses
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-700">{b.latency}ms</td>
                  <td className="px-6 py-4">
                    <StatusBadge 
                      status={b.status} 
                      type={b.status === 'ACTIVE' ? 'success' : b.status === 'MAINTENANCE' ? 'warning' : 'danger'} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Branch Modal */}
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
                <p className="text-xs text-slate-400 mt-0.5">Mock governance sandbox execution</p>
              </div>
            </div>
            
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed border-t border-b border-slate-100 py-4">
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                This triggers a simulated branch provisioning template. Configuration mappings, bed counts, and clinical routing rules are evaluated in local memory. No database modifications are committed.
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
    </div>
  );
};
export default BranchesPage;
