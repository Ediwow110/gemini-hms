import React from 'react';
import { Trash2, Wrench, ShieldCheck } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  hasInstallation: boolean;
  hasWarranty: boolean;
}

interface CartItemGroupProps {
  supplier: string;
  items: CartItem[];
}

export const CartItemGroup: React.FC<CartItemGroupProps> = ({ supplier, items }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">{supplier.substring(0, 2)}</div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{supplier}</h3>
        </div>
        <span className="text-[10px] text-emerald-600 font-black uppercase">Verified Supplier</span>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="p-6 flex gap-6 items-start">
            <div className="h-24 w-24 bg-slate-50 rounded-2xl border border-slate-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <h4 className="text-sm font-black text-slate-800">{item.name}</h4>
                <button className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SKU: {item.sku}</p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {item.hasInstallation && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-tight">
                    <Wrench className="h-3 w-3" /> Installation Included
                  </div>
                )}
                {item.hasWarranty && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-tight">
                    <ShieldCheck className="h-3 w-3" /> Warranty Active
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center bg-slate-100 rounded-xl p-1">
                  <button className="h-7 w-7 flex items-center justify-center font-bold hover:bg-white rounded-lg transition-colors">-</button>
                  <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                  <button className="h-7 w-7 flex items-center justify-center font-bold hover:bg-white rounded-lg transition-colors">+</button>
                </div>
                <p className="text-lg font-black text-slate-900">₱{item.price.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CartItemGroup;
