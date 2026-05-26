import React from 'react';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { Calendar, AlertTriangle } from 'lucide-react';

export const PatientAppointmentsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            My Appointments
          </h2>
          <p className="text-xs text-slate-500 font-medium">Schedule and manage your visits</p>
        </div>
      </div>

      <PatientPortalShellNotice />

      {/* WIP Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Appointments (WIP)</h5>
          <p className="font-medium mt-0.5">
            Appointment scheduling and management is not yet available. Please contact your clinic directly to book, reschedule, or cancel visits.
          </p>
        </div>
      </div>

      {/* Empty state placeholder */}
      <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-3">
        <Calendar className="h-10 w-10 mx-auto text-slate-300" />
        <p className="text-sm font-bold text-slate-600">No appointments available</p>
        <p className="text-xs text-slate-450 max-w-md mx-auto">
          Online appointment booking is currently under development. Please call or visit the clinic reception desk to schedule an appointment.
        </p>
      </div>
    </div>
  );
};

export default PatientAppointmentsPage;
