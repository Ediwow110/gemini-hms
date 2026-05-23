import React from 'react';
import { Wrench, Calendar, MapPin, User, ShieldCheck } from 'lucide-react';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';

export const InstallationMonitorPage: React.FC = () => {
  const installations = [
    { id: 'INS-2026-001', asset: 'GE Voluson E10', buyer: 'M*** C*** Hospital', technician: 'Tech A***', schedule: 'May 28, 2026', checklist: 'PENDING', handover: 'SCHEDULED', warranty: 'NOT_ACTIVATED' },
    { id: 'INS-2026-002', asset: 'Roche cobas c 311', buyer: 'S*** J*** Medical', technician: 'Tech B***', schedule: 'May 26, 2026', checklist: 'IN_PROGRESS', handover: 'PENDING', warranty: 'NOT_ACTIVATED' },
    { id: 'INS-2026-003', asset: 'Mindray N17', buyer: 'C*** D*** Clinic', technician: 'Tech C***', schedule: 'May 24, 2026', checklist: 'COMPLETE', handover: 'COMPLETE', warranty: 'ACTIVATED' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Installation Monitor</h2>
        <p className="text-xs text-slate-500 font-medium">Installation queue, technician scheduling, and handover tracking</p>
      </div>

      <MarketplaceAdminShellNotice />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled (Mock)</p>
          <p className="text-2xl font-black text-indigo-600">12</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Progress (Mock)</p>
          <p className="text-2xl font-black text-amber-600">4</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed (Mock)</p>
          <p className="text-2xl font-black text-emerald-600">87</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA On-Time (Mock)</p>
          <p className="text-2xl font-black text-emerald-600">97.8%</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Wrench className="h-4 w-4 text-indigo-500" />
            Installation Queue (Mock)
          </h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Technician</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Checklist</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Handover</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Warranty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {installations.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-xs font-black text-slate-800">{i.asset}</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{i.id}</p>
                </td>
                <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{i.buyer}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <User className="h-3 w-3" /> {i.technician}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Calendar className="h-3 w-3" /> {i.schedule}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                    i.checklist === 'COMPLETE' ? 'bg-emerald-50 text-emerald-600' :
                    i.checklist === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {i.checklist}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                    i.handover === 'COMPLETE' ? 'bg-emerald-50 text-emerald-600' :
                    i.handover === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {i.handover}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <ShieldCheck className="h-3 w-3" /> {i.warranty.replace('_', ' ')}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <MapPin className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-900">Scheduling / Warranty Placeholder</p>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">Technician scheduling, checklist status, and warranty activation are UI placeholders. No real scheduling or warranty mutations are performed in this phase.</p>
        </div>
      </div>
    </div>
  );
};

export default InstallationMonitorPage;
