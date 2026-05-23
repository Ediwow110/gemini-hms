import React from 'react';
import { CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';
import CheckoutStepper from './components/CheckoutStepper';

export const MarketplaceCheckoutPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Checkout</h2>
        <p className="text-xs text-slate-500 font-medium">Finalize your procurement request</p>
      </div>

      <MarketplaceShellNotice />

      <CheckoutStepper currentStep={0} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Delivery & Site Readiness</h3>
            <div className="space-y-4">
               <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Delivery Address</p>
                 <p className="text-xs font-bold text-slate-800 leading-relaxed">
                   Metro Central Hospital - Radiology Dept.<br />
                   Blk 45, Medical Ave, Quezon City, 1100
                 </p>
               </div>
               <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-3">Site Readiness Checklist</p>
                 <div className="space-y-2">
                   {['Power Supply (220V/UPS)', 'Floor Space Verified', 'Network Connectivity'].map((item) => (
                     <label key={item} className="flex items-center gap-2 cursor-pointer">
                       <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
                       <span className="text-xs font-medium text-slate-600">{item}</span>
                     </label>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Billing & Approval</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                <CreditCard className="h-6 w-6 text-slate-400" />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Billing Account</p>
                  <p className="text-xs font-bold text-slate-800">FACILITY-DEPT-RAD-001</p>
                </div>
              </div>
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                <ShieldCheck className="h-6 w-6 text-indigo-600" />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">Approval Routing</p>
                  <p className="text-xs font-bold text-indigo-900">Requires Hospital Director Approval</p>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer">
            Confirm & Send for Approval (Shell) <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceCheckoutPage;
