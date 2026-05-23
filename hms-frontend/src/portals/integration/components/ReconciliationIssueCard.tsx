import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ReconciliationIssueCardProps {
  id: string;
  domainPair: string;
  severity: string;
  category: string;
  suggestedResolution: string;
  isMock?: boolean;
}

export const ReconciliationIssueCard: React.FC<ReconciliationIssueCardProps> = ({ id, domainPair, severity, category, suggestedResolution, isMock }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
            severity === 'CRITICAL' ? 'bg-rose-50 text-rose-600' :
            severity === 'HIGH' ? 'bg-amber-50 text-amber-600' :
            'bg-blue-50 text-blue-600'
          }`}>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">
              {id}
              {isMock && <span className="ml-2 text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">MOCK</span>}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{domainPair}</p>
          </div>
        </div>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${
          severity === 'CRITICAL' ? 'bg-rose-50 text-rose-600' :
          severity === 'HIGH' ? 'bg-amber-50 text-amber-600' :
          'bg-blue-50 text-blue-600'
        }`}>
          {severity}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase">Category:</span>
          <span className="text-[10px] font-bold text-slate-600">{category}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Suggested Resolution (Shell)</p>
          <p className="text-xs text-slate-600">{suggestedResolution}</p>
        </div>
        <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-xl transition-colors">
          Mark Reviewed (Shell)
        </button>
      </div>
    </div>
  );
};

export default ReconciliationIssueCard;
