import React from 'react';
import { Wrench, Calendar } from 'lucide-react';
import MarketplaceShellNotice from './components/MarketplaceShellNotice';

export const MarketplaceInstallationTrackingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Installation & Commissioning</h2>
        <p className="text-xs text-slate-500 font-medium">Monitor site readiness and technician scheduling</p>
      </div>

      <MarketplaceShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">GE Voluson E10 Installation</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ticket: INS-2026-0042</p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider">Awaiting Delivery</span>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Readiness Checklist</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Power Requirements', status: 'READY' },
                  { label: 'Space Verification', status: 'READY' },
                  { label: 'Network Config', status: 'PENDING' },
                  { label: 'Personnel Training', status: 'SCHEDULED' },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    <span className={`text-[9px] font-black uppercase tracking-tight ${item.status === 'READY' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Assigned Technician</h4>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black">EM</div>
              <div>
                <p className="text-xs font-black text-slate-800">Engr. Eric M. (GE Official)</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Senior Field Engineer</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-50 space-y-3">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold">Tentative: May 26, 2026</span>
              </div>
              <button className="w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 cursor-not-allowed">
                Reschedule Request
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MarketplaceInstallationTrackingPage;
