import React from 'react';
import { Package, MoreVertical, Edit2, Trash2, AlertTriangle, FileText } from 'lucide-react';

export const SupplierProductTable: React.FC = () => {
  const products = [
    { id: '1', name: 'GE Voluson E10', sku: 'GE-V-E10', price: 4250000, stock: 5, status: 'ACTIVE', warranty: '3 Years', missingDocs: ['Technical Manual'] },
    { id: '2', name: 'Roche cobas c 311', sku: 'RO-C311', price: 1850000, stock: 2, status: 'ACTIVE', warranty: '2 Years', missingDocs: [] },
    { id: '3', name: 'Mindray BeneVision N17', sku: 'MR-N17', price: 450000, stock: 12, status: 'DRAFT', warranty: '1 Year', missingDocs: ['Product Images', 'Spec Sheet'] },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Warranty</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Docs</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black text-slate-800">{p.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{p.sku}</td>
              <td className="px-6 py-4 text-xs font-black text-slate-900">₱{p.price.toLocaleString()}</td>
              <td className="px-6 py-4 text-xs font-bold text-slate-600">{p.stock} Units</td>
              <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{p.warranty}</td>
              <td className="px-6 py-4">
                {p.missingDocs.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{p.missingDocs.length} missing</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Complete</span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                  p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  {p.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                  <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><MoreVertical className="h-3.5 w-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierProductTable;
