import React from 'react';
import { Truck, ChevronRight } from 'lucide-react';

export const DeliveryJobTable: React.FC = () => {
  const jobs = [
    { id: 'DEL-9918', customer: 'M*** C*** Hospital', items: 'GE Voluson E10 ultrasound', status: 'IN_TRANSIT', eta: '14:30' },
    { id: 'DEL-9922', customer: 'S*** J*** Medical', items: 'Replacement Probes (x4)', status: 'PENDING', eta: '16:00' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Active Deliveries</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {jobs.map((job) => (
          <div key={job.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                job.status === 'IN_TRANSIT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100'
              }`}>
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">{job.id}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{job.customer}</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase border ${
                  job.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ETA</p>
                <p className="text-xs font-black text-slate-800">{job.eta}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeliveryJobTable;
