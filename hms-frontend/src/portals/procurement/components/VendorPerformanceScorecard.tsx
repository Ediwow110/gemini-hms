import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';

export interface VendorPerformance {
  id: string;
  supplier: string;
  onTimeRate: number;
  qualityRate: number;
  responseTime: string;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface VendorPerformanceScorecardProps {
  vendors: VendorPerformance[];
}

export const VendorPerformanceScorecard: React.FC<VendorPerformanceScorecardProps> = ({ vendors }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="h-4 w-4 text-indigo-500" />
            Vendor Performance Scorecard
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Tracking reliability and quality metrics</p>
        </div>
      </div>

      <div className="space-y-3">
        {vendors.map((v) => (
          <div key={v.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-slate-800">{v.supplier}</p>
              <div className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                v.riskScore === 'LOW' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                v.riskScore === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {v.riskScore} RISK
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[9px] text-slate-400 font-bold uppercase">On-Time</p>
                <p className="text-xs font-black text-slate-700">{v.onTimeRate}%</p>
              </div>
              <div className="text-center border-x border-slate-200">
                <p className="text-[9px] text-slate-400 font-bold uppercase">Quality</p>
                <p className="text-xs font-black text-slate-700">{v.qualityRate}%</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-400 font-bold uppercase">Response</p>
                <p className="text-xs font-black text-slate-700">{v.responseTime}</p>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-1 text-[9px] text-slate-500 font-medium italic">
              <TrendingUp className="h-3 w-3 text-indigo-500" />
              Trend: Stable performance over last 3 POs
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
        <strong>Shell Notice:</strong> Vendor scoring is mock-generated. No real performance auditing or automated blacklisting is active.
      </div>
    </div>
  );
};
