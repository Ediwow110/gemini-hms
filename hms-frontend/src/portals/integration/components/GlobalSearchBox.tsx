import React from 'react';
import { Search, Filter } from 'lucide-react';

interface Props {
  query: string;
  setQuery: (q: string) => void;
  filterType: string;
  setFilterType: (t: string) => void;
}

export const GlobalSearchBox: React.FC<Props> = ({ query, setQuery, filterType, setFilterType }) => {

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search across all portals, records, and activities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-slate-400" />
        <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="PATIENT">Patient</option>
          <option value="ORDER">Order</option>
          <option value="LAB">Lab</option>
          <option value="BILLING">Billing</option>
          <option value="MARKETPLACE">Marketplace</option>
        </select>
        <span className="text-[10px] text-slate-400 font-bold uppercase">Results limited to your role permissions</span>
      </div>
    </div>
  );
};

export default GlobalSearchBox;
