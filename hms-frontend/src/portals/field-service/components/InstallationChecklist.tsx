import React from 'react';
import { CheckCircle2, ClipboardCheck } from 'lucide-react';

export const InstallationChecklist: React.FC = () => {
  const steps = [
    { label: 'Unboxing & Inventory', status: 'COMPLETED' },
    { label: 'Physical Positioning', status: 'COMPLETED' },
    { label: 'Power & Network Connectivity', status: 'IN_PROGRESS' },
    { label: 'Software Configuration', status: 'PENDING' },
    { label: 'Calibration & Testing', status: 'PENDING' },
    { label: 'User Training', status: 'PENDING' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-emerald-500" />
        Installation Workflow
      </h3>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-3">
               <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${
                 step.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500 text-white' :
                 step.status === 'IN_PROGRESS' ? 'bg-indigo-100 border-indigo-200 text-indigo-600' :
                 'bg-white border-slate-200 text-slate-300'
               }`}>
                 {step.status === 'COMPLETED' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px] font-black">{i+1}</span>}
               </div>
               <span className={`text-xs font-bold ${step.status === 'PENDING' ? 'text-slate-400' : 'text-slate-700'}`}>{step.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstallationChecklist;
