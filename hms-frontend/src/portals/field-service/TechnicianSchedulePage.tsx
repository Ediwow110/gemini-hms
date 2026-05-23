import React from 'react';
import { ChevronRight, Filter } from 'lucide-react';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';

export const TechnicianSchedulePage: React.FC = () => {
  const days = ['MON 21', 'TUE 22', 'WED 23', 'THU 24', 'FRI 25', 'SAT 26', 'SUN 27'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">My Schedule</h2>
          <p className="text-xs text-slate-500 font-medium">Daily job queue and route optimization</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600">
           <Filter className="h-4 w-4" /> Filter View
        </button>
      </div>

      <FieldServiceShellNotice />

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
         {days.map((day, i) => (
           <button key={day} className={`flex flex-col items-center gap-1 p-4 rounded-[1.5rem] min-w-[80px] transition-all ${
             i === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-slate-100 text-slate-400 hover:border-indigo-200'
           }`}>
             <span className="text-[10px] font-black uppercase tracking-tight">{day.split(' ')[0]}</span>
             <span className="text-lg font-black">{day.split(' ')[1]}</span>
           </button>
         ))}
      </div>

      <div className="space-y-4">
         {[1, 2, 3].map((i) => (
           <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all group cursor-pointer">
              <div className="flex items-center gap-6">
                 <div className="text-center min-w-[60px]">
                    <p className="text-xs font-black text-slate-800">{8 + i}:00</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">AM</p>
                 </div>
                 <div className="h-10 w-px bg-slate-100 hidden md:block" />
                 <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Job #{1042+i}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Customer Visit · 2.5 Hrs</p>
                 </div>
              </div>

              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <p className="text-xs font-black text-slate-700">Metro Central Hospital</p>
                    <p className="text-[10px] text-slate-400 font-medium">Floor 4, Radiology</p>
                 </div>
                 <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ChevronRight className="h-5 w-5" />
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};

export default TechnicianSchedulePage;
