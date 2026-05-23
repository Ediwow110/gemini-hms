import React from 'react';
import { Wrench } from 'lucide-react';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import InstallationChecklist from './components/InstallationChecklist';

export const InstallationJobsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Installation Jobs</h2>
          <p className="text-xs text-slate-500 font-medium">Monitor equipment setup and facility commissioning tasks</p>
        </div>
      </div>

      <FieldServiceShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           {[1, 2].map((i) => (
             <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">Job: INS-2026-00{i}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">GE Voluson E10 · Metro Central</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[9px] font-black px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg uppercase tracking-tight">PENDING START</span>
                   <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-black transition-colors">
                     Start Job (Shell)
                   </button>
                </div>
             </div>
           ))}
        </div>
        <aside>
           <InstallationChecklist />
        </aside>
      </div>
    </div>
  );
};

export default InstallationJobsPage;
