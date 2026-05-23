import React from 'react';
import { Settings, CheckCircle2 } from 'lucide-react';

export const MaintenanceChecklistPanel: React.FC = () => {
  const tasks = [
    { label: 'Filter Cleaning', status: 'COMPLETED' },
    { label: 'Electrical Safety Test', status: 'COMPLETED' },
    { label: 'Firmware Integrity Check', status: 'IN_PROGRESS' },
    { label: 'Performance Calibration', status: 'PENDING' },
    { label: 'External Housing Inspection', status: 'PENDING' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
        <Settings className="h-4 w-4 text-indigo-500" />
        PM Checklist
      </h3>

      <div className="space-y-3">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <span className="text-xs font-bold text-slate-700">{task.label}</span>
            <div className={`p-1 rounded-lg ${
              task.status === 'COMPLETED' ? 'text-emerald-500' :
              task.status === 'IN_PROGRESS' ? 'text-indigo-600 animate-pulse' :
              'text-slate-300'
            }`}>
              {task.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-2">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technician Notes</p>
         <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none" rows={3} placeholder="Enter findings..." />
      </div>

      <button className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-xs uppercase shadow-xl">
        Finalize PM Report (Shell)
      </button>
    </div>
  );
};

export default MaintenanceChecklistPanel;
