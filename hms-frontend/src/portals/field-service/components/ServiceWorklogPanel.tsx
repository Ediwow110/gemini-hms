import React from 'react';
import { FileText } from 'lucide-react';

export const ServiceWorklogPanel: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
        <FileText className="h-4 w-4 text-rose-500" />
        Job Worklog
      </h3>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnosis & Findings</p>
          <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none" rows={3} placeholder="Initial assessment..." />
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Performed</p>
          <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none" rows={3} placeholder="Describe actions taken..." />
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Labor Time</p>
            <span className="text-xs font-black text-emerald-400">2.5 Hrs</span>
          </div>
          <div className="flex gap-2">
             <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black text-white transition-colors">Start Timer</button>
             <button className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-[10px] font-black text-white transition-colors">Stop Timer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceWorklogPanel;
