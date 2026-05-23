import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import ServiceWorklogPanel from './components/ServiceWorklogPanel';

export const ServiceTicketWorklogPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Service Ticket Worklog</h2>
        <p className="text-xs text-slate-500 font-medium">Record maintenance activities and repair diagnosis</p>
      </div>

      <FieldServiceShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                       <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                       <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Ticket: TKT-2026-001</h3>
                       <p className="text-xs font-bold text-rose-600 uppercase">HIGH PRIORITY · OPEN</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Reported</p>
                    <p className="text-xs font-bold text-slate-700">Display Flickering</p>
                 </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Details</p>
                 <p className="text-xs font-black text-slate-800">GE Voluson E10 ultrasound</p>
                 <p className="text-[10px] text-slate-500 font-medium uppercase">SN: 9918-XYZ-2026 · Floor 4 Radiology</p>
              </div>
           </div>

           <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                 <h4 className="text-xs font-black text-amber-900 uppercase">SLA Milestone Alert</h4>
                 <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                   Initial response completed. Resolution deadline in 4.5 hours to maintain Platinum SLA.
                 </p>
              </div>
           </div>
        </div>

        <aside>
           <ServiceWorklogPanel />
           <button className="w-full mt-4 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200 uppercase text-xs">
              Resolve Ticket (Shell)
           </button>
        </aside>
      </div>
    </div>
  );
};

export default ServiceTicketWorklogPage;
