import React from 'react';
import { Calendar, Clock, XCircle } from 'lucide-react';

export interface Appointment {
  id: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  type: 'CLINIC' | 'TELEHEALTH';
}

interface AppointmentSummaryCardProps {
  appointments: Appointment[];
}

export const AppointmentSummaryCard: React.FC<AppointmentSummaryCardProps> = ({ appointments }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            My Appointments
          </h3>
        </div>
        <button className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">View Schedule</button>
      </div>

      <div className="divide-y divide-slate-50">
        {appointments.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Calendar className="h-8 w-8 text-slate-200 mx-auto" />
            <p className="text-xs font-bold text-slate-400">No scheduled appointments</p>
          </div>
        ) : (
          appointments.map((appt) => (
            <div key={appt.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                  {appt.date.split('-')[2]}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">{appt.doctorName}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{appt.department} · {appt.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-700">{appt.time}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{appt.date}</p>
                </div>
                <div className="flex gap-1">
                  <button title="Reschedule" className="p-1.5 hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-indigo-100 cursor-pointer">
                    <Clock className="h-4 w-4" />
                  </button>
                  <button title="Cancel" className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold leading-relaxed">
          <strong>Shell Notice:</strong> Appointment management is simulated. Actions update UI state only and do not affect real clinical schedules.
        </div>
      </div>
    </div>
  );
};

export default AppointmentSummaryCard;
