import React from 'react';
import ProcurementScopeFilter from './components/ProcurementScopeFilter';
import { Truck, Plus, Search, Filter } from 'lucide-react';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';

export const SuppliersPage: React.FC = () => {
  const mockSuppliers = [
    { id: 'SUP-001', name: 'Apex Medical Corp', category: 'General Medical Supplies', status: 'ACCREDITED', risk: 'LOW', contact: 'sales@apexmed.com' },
    { id: 'SUP-002', name: 'Global Pharma Inc', category: 'Pharmaceuticals', status: 'ACCREDITED', risk: 'LOW', contact: 'orders@globalpharma.com' },
    { id: 'SUP-003', name: 'Metro Lab Tech', category: 'Laboratory Reagents', status: 'PROBATION', risk: 'MEDIUM', contact: 'support@metrolab.com' },
    { id: 'SUP-004', name: 'Stellar Imaging Solutions', category: 'Radiology Equipment', status: 'ACCREDITED', risk: 'LOW', contact: 'info@stellarimaging.com' },
    { id: 'SUP-005', name: 'QuickServe Logistics', category: 'Logistics/Courier', status: 'ACCREDITED', risk: 'LOW', contact: 'admin@quickserve.com' },
  ];

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Supplier Directory"
        description="Manage accredited vendors, accreditation status, and vendor risk profiles"
        actions={(
          <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all">
            <Plus className="h-4 w-4" /> Add New Supplier
          </button>
        )}
      />

      <ProcurementScopeFilter />

      <div className="card p-4 flex flex-wrap gap-4 items-center bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, category or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Category:</span>
          <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none">
            <option>All Categories</option>
            <option>General Supplies</option>
            <option>Pharmaceuticals</option>
            <option>Laboratory</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockSuppliers.map((sup) => (
          <div key={sup.id} className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Truck className="h-5 w-5" />
              </div>
              <div className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                sup.status === 'ACCREDITED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {sup.status}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-800 tracking-tight">{sup.name}</h4>
              <p className="text-[10px] text-slate-400 font-medium">{sup.category}</p>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Contact</span>
                <span className="text-slate-700 font-bold">{sup.contact}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Risk Profile</span>
                <span className={`font-black ${sup.risk === 'LOW' ? 'text-emerald-600' : 'text-amber-600'}`}>{sup.risk} RISK</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button className="text-[10px] text-slate-500 font-bold hover:underline cursor-pointer">View Credentials</button>
              <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">Manage Vendor &rarr;</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Sandbox Notice:</strong> Supplier data and accreditation status are simulated. Adding or editing vendors does not affect real procurement records.
      </div>
    </HmsDashboardShell>
  );
};

export default SuppliersPage;
