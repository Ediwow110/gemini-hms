import React from 'react';
import { Search, Filter, ShieldCheck } from 'lucide-react';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';
import SupplierApprovalQueue from './components/SupplierApprovalQueue';

export const SupplierManagementPage: React.FC = () => {
  const suppliers = [
    { id: 'SUP-2026-001', name: 'Global Med Systems', status: 'ACTIVE', onboarding: 'COMPLETE', docs: 'All Verified', risk: 'LOW', performance: '4.8/5.0' },
    { id: 'SUP-2026-002', name: 'PharmaTech Solutions', status: 'ACTIVE', onboarding: 'COMPLETE', docs: 'Certificate Missing', risk: 'MEDIUM', performance: '4.2/5.0' },
    { id: 'SUP-2026-003', name: 'BioEquip International', status: 'PENDING', onboarding: 'IN_PROGRESS', docs: 'Under Review', risk: 'LOW', performance: 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Supplier Management</h2>
          <p className="text-xs text-slate-500 font-medium">Directory, onboarding status, and supplier governance</p>
        </div>
      </div>

      <MarketplaceAdminShellNotice />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search by supplier name or ID..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600">
          <Filter className="h-4 w-4" /> Advanced Filters
        </button>
      </div>

      <SupplierApprovalQueue />

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            Supplier Directory (Mock)
          </h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Onboarding</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Docs</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="text-xs font-black text-slate-800">{s.name}</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{s.id}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                    s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                    s.onboarding === 'COMPLETE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {s.onboarding.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{s.docs}</td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                    s.risk === 'LOW' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {s.risk}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-600">{s.performance}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase">Approve (Shell)</button>
                    <button className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg text-[10px] font-black uppercase">Reject (Shell)</button>
                    <button className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 rounded-lg text-[10px] font-black uppercase">Suspend (Shell)</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierManagementPage;
