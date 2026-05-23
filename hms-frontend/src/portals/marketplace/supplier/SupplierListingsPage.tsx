import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import SupplierShellNotice from './components/SupplierShellNotice';
import SupplierProductTable from './components/SupplierProductTable';

export const SupplierListingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Product Listings</h2>
          <p className="text-xs text-slate-500 font-medium">Manage your equipment catalog and inventory levels</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-md">
          <Plus className="h-4 w-4" /> Create Listing (Shell)
        </button>
      </div>

      <SupplierShellNotice />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search by name, SKU, or category..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600">
          <Filter className="h-4 w-4" /> Advanced Filters
        </button>
      </div>

      <SupplierProductTable />
    </div>
  );
};

export default SupplierListingsPage;
