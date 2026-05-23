import React from 'react';
import { Package, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const ListingApprovalQueue: React.FC = () => {
  const listings = [
    { id: 'LST-001', supplier: 'Global Med Systems', product: 'GE Voluson E10', type: 'PRODUCT', status: 'PENDING', missingDocs: ['Technical Manual'], compliance: 'FDA Pending' },
    { id: 'LST-002', supplier: 'PharmaTech Solutions', product: 'Annual Calibration Service', type: 'SERVICE', status: 'PENDING', missingDocs: [], compliance: 'Certified' },
    { id: 'LST-003', supplier: 'BioEquip International', product: 'Mindray N17 Monitor', type: 'PRODUCT', status: 'UNDER_REVIEW', missingDocs: ['Product Images'], compliance: 'CE Marked' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Package className="h-4 w-4 text-indigo-500" />
          Listing Approval Queue (Mock)
        </h3>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Docs</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {listings.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800">{l.product}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{l.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{l.supplier}</td>
              <td className="px-6 py-4">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
                  l.type === 'PRODUCT' ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-50 text-violet-600'
                }`}>
                  {l.type}
                </span>
              </td>
              <td className="px-6 py-4">
                {l.missingDocs.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{l.missingDocs.length} missing</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Complete</span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <FileText className="h-3 w-3" /> {l.compliance}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                  l.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  {l.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase">Approve (Shell)</button>
                  <button className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg text-[10px] font-black uppercase">Reject (Shell)</button>
                  <button className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 rounded-lg text-[10px] font-black uppercase">Request Changes (Shell)</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListingApprovalQueue;
