import React from 'react';
import { Plus, Search } from 'lucide-react';
import SupplierShellNotice from './components/SupplierShellNotice';
import SupplierServiceTable from './components/SupplierServiceTable';

export const SupplierServiceListingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Service Commitments</h2>
          <p className="text-xs text-slate-500 font-medium">Manage maintenance, calibration, and support offerings</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-md">
          <Plus className="h-4 w-4" /> Add Service (Shell)
        </button>
      </div>

      <SupplierShellNotice />

      <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center justify-between">
         <div className="relative w-96">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <input type="text" placeholder="Search services..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs" />
         </div>
      </div>

      <SupplierServiceTable />
    </div>
  );
};

export default SupplierServiceListingsPage;
