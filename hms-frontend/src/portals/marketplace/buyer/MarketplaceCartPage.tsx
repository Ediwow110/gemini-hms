import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';
import CartItemGroup from './components/CartItemGroup';
import { Package, ArrowRight } from 'lucide-react';

export const MarketplaceCartPage: React.FC = () => {
  const navigate = useNavigate();

  // Cart is client-side only for now; no backend cart persistence or checkout flow implemented.
  const [cartGroups] = useState<any[]>([]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Shopping Cart</h2>
        <p className="text-xs text-slate-500 font-medium">Review your items and requested services</p>
      </div>

      <MarketplaceShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {cartGroups.length === 0 ? (
            <div className="p-6 bg-white border rounded-3xl text-sm text-slate-500">Your cart is empty. Adding items and full checkout are prototype shell behaviors (no backend cart/order creation yet).</div>
          ) : cartGroups.map((group) => (
            <CartItemGroup key={group.supplier} supplier={group.supplier} items={group.items} />
          ))}
        </div>

        {/* Summary */}
        <aside className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Order Summary</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Subtotal (0 Items)</span>
                <span>₱0</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Services (Installation/Warranty)</span>
                <span className="text-emerald-600">N/A</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Estimated Shipping</span>
                <span className="text-emerald-600">N/A</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">₱0</p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/marketplace/checkout')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              disabled
              title="Checkout is not wired; this is a shell"
            >
              Proceed to Checkout (Shell) <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-3">
            <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
              <Package className="h-4 w-4" /> Approval Required
            </h4>
            <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
              Cart and checkout flows are currently shell-only. No real orders are created.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MarketplaceCartPage;
