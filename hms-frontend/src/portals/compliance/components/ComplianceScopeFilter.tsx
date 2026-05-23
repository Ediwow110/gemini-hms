import React, { useState } from 'react';
import { Filter, Building2, GitMerge } from 'lucide-react';

interface ComplianceScopeFilterProps {
  onScopeChange?: (scope: { tenantId: string; branchId: string }) => void;
}

export const ComplianceScopeFilter: React.FC<ComplianceScopeFilterProps> = ({ onScopeChange }) => {
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');

  const mockTenants = [
    { id: 'all', name: 'All Tenants (Global View)' },
    { id: 'TEN-001', name: 'St. Jude Hospital Network' },
    { id: 'TEN-002', name: 'MediClinics Group' },
    { id: 'TEN-003', name: 'Apex Healthcare Services' },
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
    'TEN-003': [
      { id: 'all', name: 'All Branches' },
      { id: 'BR-004', name: 'Apex West' },
    ],
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId);
    setSelectedBranch('all');
    if (onScopeChange) {
      onScopeChange({ tenantId, branchId: 'all' });
    }
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    if (onScopeChange) {
      onScopeChange({ tenantId: selectedTenant, branchId });
    }
  };

  const activeBranchOptions = mockBranches[selectedTenant as keyof typeof mockBranches] || [{ id: 'all', name: 'All Branches' }];

  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm items-center">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
        <Filter className="h-4 w-4 text-indigo-500" />
        <span>Scope Filter</span>
      </div>

      <div className="relative flex-1 w-full">
        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <select
          value={selectedTenant}
          onChange={(e) => handleTenantChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
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
          className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
        >
          {activeBranchOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
export default ComplianceScopeFilter;
