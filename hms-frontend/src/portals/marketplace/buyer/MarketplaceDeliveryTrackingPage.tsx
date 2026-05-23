import React from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';

export const MarketplaceDeliveryTrackingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Delivery Tracking</h2>
        <p className="text-xs text-slate-500 font-medium">Real-time logistics monitoring for your equipment</p>
      </div>

      <MarketplaceShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking Number</p>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">HMS-LOG-9918-2026</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Arrival</p>
                <p className="text-lg font-black text-indigo-600 tracking-tight">May 25, 2026</p>
              </div>
            </div>

            <div className="relative pl-8 space-y-12">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
              
              <div className="relative">
                <div className="absolute -left-8 top-0 h-6 w-6 bg-emerald-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Order Dispatched</p>
                  <p className="text-[10px] text-slate-500 font-medium">Manufacturer Warehouse, Manila Hub</p>
                  <p className="text-[9px] text-slate-400 font-bold">MAY 18, 2026 · 10:30 AM</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-8 top-0 h-6 w-6 bg-indigo-500 rounded-full border-4 border-white shadow-sm animate-pulse" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">In-Transit to Facility</p>
                  <p className="text-[10px] text-slate-500 font-medium">Forwarding via Specialized Medical Logistics</p>
                  <p className="text-[9px] text-slate-400 font-bold">MAY 20, 2026 · 02:15 PM</p>
                </div>
              </div>

              <div className="relative opacity-40">
                <div className="absolute -left-8 top-0 h-6 w-6 bg-slate-200 rounded-full border-4 border-white shadow-sm" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Out for Delivery</p>
                  <p className="text-[10px] text-slate-500 font-medium">Local Last-Mile Delivery Partner</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="h-4 w-4 text-rose-500" />
              Delivery Location
            </h4>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-xs font-bold text-slate-700 leading-relaxed">
                 Metro Central Hospital<br />
                 Receiving Bay 2, South Wing<br />
                 Quezon City, 1100
               </p>
            </div>
            <div className="pt-4 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carrier Information</p>
              <p className="text-xs font-bold text-slate-800">MedLogistics Express PH</p>
              <p className="text-[10px] text-slate-500 font-medium">+63 2 8888 0000</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MarketplaceDeliveryTrackingPage;
