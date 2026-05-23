import React from 'react';
import { Users, Activity, FileText } from 'lucide-react';

export const BuyerActivityTable: React.FC = () => {
  const buyers = [
    { id: 'BYR-001', org: 'M*** C*** Hospital', branch: 'Main Branch', status: 'ACTIVE', orders: 12, rfqs: 3 },
    { id: 'BYR-002', org: 'S*** J*** Medical Center', branch: 'East Wing', status: 'ACTIVE', orders: 8, rfqs: 1 },
    { id: 'BYR-003', org: 'C*** D*** Clinic', branch: 'Downtown', status: 'RESTRICTED', orders: 2, rfqs: 0 },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          Buyer Activity (Mock)
        </h3>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Orders</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">RFQs</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {buyers.map((b) => (
            <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800">{b.org}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{b.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{b.branch}</td>
              <td className="px-6 py-4">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                  b.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {b.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Activity className="h-3 w-3" /> {b.orders}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <FileText className="h-3 w-3" /> {b.rfqs}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-black uppercase">View (Shell)</button>
                  {b.status === 'ACTIVE' && (
                    <button className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg text-[10px] font-black uppercase">Restrict (Shell)</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BuyerActivityTable;
