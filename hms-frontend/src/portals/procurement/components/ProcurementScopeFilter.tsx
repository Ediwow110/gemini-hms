import React, { useState } from 'react';
import { Filter, Building2, GitMerge, Globe, Warehouse } from 'lucide-react';

interface ProcurementScopeFilterProps {
  onScopeChange?: (scope: { tenantId: string; branchId: string; warehouseId: string; environment: string }) => void;
}

export const ProcurementScopeFilter: React.FC<ProcurementScopeFilterProps> = ({ onScopeChange }) => {
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedEnv, setSelectedEnv] = useState('production');

  const mockTenants = [
    { id: 'all', name: 'All Tenants (Global Operations)' },
    { id: 'TEN-001', name: 'St. Jude Hospital Network' },
    { id: 'TEN-002', name: 'MediClinics Group' },
  ];

  const mockBranches = {
    all: [{ id: 'all', name: 'All Branches' }],
    'TEN-001': [
      { id: 'all', name: 'All Branches' },
      { id: 'BR-001', name: 'St. Jude Metro' },
      { id: 'BR-002', name: 'St. Jude North' },
    ],
    'TEN-002': [
      { id: 'all', name: 'All Branches' },
      { id: 'BR-003', name: 'MediClinics Central' },
    ],
  };

  const mockWarehouses = {
    all: [{ id: 'all', name: 'All Warehouses' }],
    'BR-001': [
      { id: 'all', name: 'All Warehouses' },
      { id: 'WH-001', name: 'Metro Central Pharmacy WH' },
      { id: 'WH-002', name: 'Metro Medical Supply WH' },
    ],
    'BR-002': [
      { id: 'all', name: 'All Warehouses' },
      { id: 'WH-003', name: 'North General WH' },
    ],
    'BR-003': [
      { id: 'all', name: 'All Warehouses' },
      { id: 'WH-004', name: 'Central Logistics Hub' },
    ],
  };

  const environments = [
    { id: 'production', name: 'Production (Live)' },
    { id: 'staging', name: 'Staging (UAT)' },
    { id: 'development', name: 'Development (Sandbox)' },
  ];

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
    setSelectedBranch('all');
    setSelectedWarehouse('all');
    if (onScopeChange) {
      onScopeChange({ tenantId, branchId: 'all', warehouseId: 'all', environment: selectedEnv });
    }
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    setSelectedWarehouse('all');
    if (onScopeChange) {
      onScopeChange({ tenantId: selectedTenant, branchId, warehouseId: 'all', environment: selectedEnv });
    }
  };

  const handleWarehouseChange = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
    if (onScopeChange) {
      onScopeChange({ tenantId: selectedTenant, branchId: selectedBranch, warehouseId, environment: selectedEnv });
    }
  };

  const handleEnvChange = (env: string) => {
    setSelectedEnv(env);
    if (onScopeChange) {
      onScopeChange({ tenantId: selectedTenant, branchId: selectedBranch, warehouseId: selectedWarehouse, environment: env });
    }
  };

  const activeBranchOptions = mockBranches[selectedTenant as keyof typeof mockBranches] || [{ id: 'all', name: 'All Branches' }];
  const activeWarehouseOptions = mockWarehouses[selectedBranch as keyof typeof mockWarehouses] || [{ id: 'all', name: 'All Warehouses' }];

  return (
    <div className="flex flex-col xl:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm items-center">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
        <Filter className="h-4 w-4 text-indigo-500" />
        <span>Procurement Scope</span>
      </div>

      <div className="relative flex-1 w-full">
        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <select
          value={selectedTenant}
          onChange={(e) => handleTenantChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
        >
          {mockTenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex-1 w-full">
        <GitMerge className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <select
          value={selectedBranch}
          onChange={(e) => handleBranchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
        >
          {activeBranchOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex-1 w-full">
        <Warehouse className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <select
          value={selectedWarehouse}
          onChange={(e) => handleWarehouseChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
        >
          {activeWarehouseOptions.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex-1 w-full">
        <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <select
          value={selectedEnv}
          onChange={(e) => handleEnvChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
        >
          {environments.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ProcurementScopeFilter;
