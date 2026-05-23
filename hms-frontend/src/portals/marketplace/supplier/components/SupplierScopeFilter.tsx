import React from 'react';
import { Building2 } from 'lucide-react';

export const SupplierScopeFilter: React.FC = () => {
  return (
    <button className="flex items-center gap-2 px-3.5 py-2 bg-slate-50/80 rounded-xl border border-slate-200/80 text-sm text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
      <Building2 className="h-4 w-4 text-slate-400" />
      <span className="font-medium text-xs">Business: Global Med Systems (Verified)</span>
    </button>
  );
};

export default SupplierScopeFilter;
