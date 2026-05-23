import React from 'react';
import { AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react';

export const MarketplaceRiskPanel: React.FC = () => {
  const risks = [
    { id: '1', type: 'SUPPLIER', title: 'Supplier onboarding backlog', count: 5, severity: 'MEDIUM' },
    { id: '2', type: 'LISTING', title: 'Listings missing compliance docs', count: 3, severity: 'HIGH' },
    { id: '3', type: 'DISPUTE', title: 'Unresolved disputes past SLA', count: 2, severity: 'CRITICAL' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-rose-500" />
        Marketplace Risk (Mock)
      </h3>
      <div className="space-y-3">
        {risks.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${
                r.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-600' :
                r.severity === 'HIGH' ? 'bg-amber-100 text-amber-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{r.title}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{r.type} · {r.count} items</p>
              </div>
            </div>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
              r.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-600' :
              r.severity === 'HIGH' ? 'bg-amber-50 text-amber-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              {r.severity}
            </span>
          </div>
        ))}
      </div>
      <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-xl transition-colors flex items-center justify-center gap-2">
        Full Risk Report <TrendingUp className="h-3 w-3" />
      </button>
    </div>
  );
};

export default MarketplaceRiskPanel;
