import React, { useState } from 'react';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';
import WarrantyStatusCard, { Warranty } from './components/WarrantyStatusCard';
import { ShieldCheck } from 'lucide-react';

export const MarketplaceWarrantyPage: React.FC = () => {
  // Buyer warranty tracking for purchased marketplace items is not implemented in backend.
  const [warranties] = useState<Warranty[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Warranties & Protection</h2>
          <p className="text-xs text-slate-500 font-medium">Manage your equipment coverage and service level agreements</p>
        </div>
      </div>

      <MarketplaceShellNotice />

      <div className="grid grid-cols-1 gap-4">
        {warranties.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 border rounded">No warranties tracked. Buyer marketplace warranty surfaces are prototype shell (no live backend data or actions).</div>
        ) : warranties.map((w) => (
          <WarrantyStatusCard key={w.id} warranty={w} />
        ))}
      </div>

      <div className="bg-indigo-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-md">
           <h3 className="text-xl font-black tracking-tight">Extend Your Protection</h3>
           <p className="text-indigo-300 text-xs font-medium leading-relaxed">
             Secure your facility assets beyond the manufacturer's warranty. Our comprehensive service plans include 24/7 technical support and quarterly preventive maintenance.
           </p>
           <button className="bg-white text-indigo-900 px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-black/20 hover:scale-105 transition-all">
             Browse Service Plans
           </button>
        </div>
        <ShieldCheck className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5" />
      </div>
    </div>
  );
};

export default MarketplaceWarrantyPage;
