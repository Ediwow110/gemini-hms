import React from 'react';
import { FileText, Clock, AlertTriangle } from 'lucide-react';
import MarketplaceAdminShellNotice from './components/MarketplaceAdminShellNotice';

export const RFQMonitorPage: React.FC = () => {
  const rfqs = [
    { id: 'RFQ-2026-001', buyer: 'M*** C*** Hospital', responses: 3, deadline: '2026-05-25', status: 'ACTIVE', stalled: false },
    { id: 'RFQ-2026-004', buyer: 'S*** J*** Medical', responses: 1, deadline: '2026-05-22', status: 'URGENT', stalled: false },
    { id: 'RFQ-2026-009', buyer: 'C*** D*** Clinic', responses: 0, deadline: '2026-05-30', status: 'STALLED', stalled: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">RFQ Monitor</h2>
        <p className="text-xs text-slate-500 font-medium">Monitor RFQ activity, supplier responses, and stalled requests</p>
      </div>

      <MarketplaceAdminShellNotice />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active RFQs (Mock)</p>
          <p className="text-2xl font-black text-indigo-600">47</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Responses (Mock)</p>
          <p className="text-2xl font-black text-emerald-600">2.8</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stalled (Mock)</p>
          <p className="text-2xl font-black text-rose-600">5</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-500" />
            RFQ Activity Table (Mock)
          </h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">RFQ</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier Responses</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rfqs.map((r) => (
              <tr key={r.id} className={`hover:bg-slate-50/50 transition-colors group ${r.stalled ? 'bg-rose-50/30' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {r.stalled && <AlertTriangle className="h-4 w-4 text-rose-500" />}
                    <span className="text-xs font-black text-slate-800">{r.id}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{r.buyer}</td>
                <td className="px-6 py-4 text-xs font-bold text-slate-600">{r.responses} responses</td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-1.5 text-xs font-black ${r.status === 'URGENT' ? 'text-rose-600' : 'text-slate-500'}`}>
                    <Clock className="h-3.5 w-3.5" /> {r.deadline}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                    r.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    r.status === 'URGENT' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {r.stalled && (
                      <button className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 rounded-lg text-[10px] font-black uppercase">Escalate (Shell)</button>
                    )}
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

export default RFQMonitorPage;
