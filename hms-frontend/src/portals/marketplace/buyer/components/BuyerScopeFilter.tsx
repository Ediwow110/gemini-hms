import React from 'react';
import { Briefcase } from 'lucide-react';

export const BuyerScopeFilter: React.FC = () => {
  return (
    <button className="flex items-center gap-2 px-3.5 py-2 bg-slate-50/80 rounded-xl border border-slate-200/80 text-sm text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
      <Briefcase className="h-4 w-4 text-slate-400" />
      <span className="font-medium text-xs">Buying for: Main Branch</span>
    </button>
  );
};

export default BuyerScopeFilter;
