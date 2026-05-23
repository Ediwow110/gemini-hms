import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export const ListingHealthPanel: React.FC = () => {
  const issues = [
    { id: '1', title: 'Missing technical manual', asset: 'GE Voluson E10', type: 'critical' },
    { id: '2', title: 'Low resolution images', asset: 'Mindray N17', type: 'warning' },
    { id: '3', title: 'Warranty terms expiring', asset: 'Roche cobas c 311', type: 'info' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
        Listing Health
      </h3>
      <div className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.id} className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className={`p-1.5 rounded-lg ${
              issue.type === 'critical' ? 'bg-rose-100 text-rose-600' :
              issue.type === 'warning' ? 'bg-amber-100 text-amber-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {issue.type === 'critical' ? <AlertCircle className="h-4 w-4" /> :
               issue.type === 'warning' ? <Info className="h-4 w-4" /> :
               <CheckCircle2 className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{issue.title}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{issue.asset}</p>
            </div>
            <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Fix</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingHealthPanel;
