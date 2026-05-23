import React from 'react';
import { Search } from 'lucide-react';

export const MarketplaceSearchBar: React.FC = () => {
  return (
    <div className="relative w-full max-w-2xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
      <input
        type="text"
        placeholder="Search equipment, service, brand, or SKU..."
        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all shadow-sm"
      />
    </div>
  );
};

export default MarketplaceSearchBar;
