import React from 'react';
import { Package, Box } from 'lucide-react';
import SupplierShellNotice from './components/SupplierShellNotice';
import FulfillmentChecklist from './components/FulfillmentChecklist';

export const SupplierFulfillmentPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Fulfillment & Logistics</h2>
          <p className="text-xs text-slate-500 font-medium">Serial number tracking and shipment preparation</p>
        </div>
      </div>

      <SupplierShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6">
             <div className="flex justify-between items-start pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">ORD-2026-9918</h3>
                    <p className="text-xs font-bold text-indigo-600 uppercase">Awaiting Logistics Handover</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Courier</p>
                  <p className="text-sm font-black text-slate-800">MedLogistics Express</p>
                </div>
             </div>

             <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Item Details</h4>
               <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-300">
                      <Box className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Voluson E10 Ultrasound Console</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Qty: 1 Unit</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <input type="text" placeholder="Enter Serial No." className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold w-40 focus:outline-none" />
                    <span className="text-[9px] text-rose-500 font-bold uppercase tracking-tight">Serial Required</span>
                  </div>
               </div>
             </div>
           </div>
        </div>

        <aside className="space-y-6">
           <FulfillmentChecklist />
        </aside>
      </div>
    </div>
  );
};

export default SupplierFulfillmentPage;
