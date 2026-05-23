import React from 'react';
import AppointmentSummaryCard, { Appointment } from './components/AppointmentSummaryCard';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { Plus } from 'lucide-react';

export const PatientAppointmentsPage: React.FC = () => {
  const mockAppointments: Appointment[] = [
    { id: '1', doctorName: 'Dr. Gregory House', department: 'Clinical', date: '2026-05-25', time: '10:00 AM', status: 'UPCOMING', type: 'CLINIC' },
    { id: '2', doctorName: 'Dr. James Wilson', department: 'Oncology', date: '2026-04-12', time: '02:30 PM', status: 'COMPLETED', type: 'TELEHEALTH' },
    { id: '3', doctorName: 'Dr. Eric Foreman', department: 'Neurology', date: '2026-03-15', time: '09:00 AM', status: 'COMPLETED', type: 'CLINIC' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            My Appointments
          </h2>
          <p className="text-xs text-slate-500 font-medium">Schedule and manage your visits with our specialists</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer">
          <Plus className="h-4 w-4" /> Book New Appointment
        </button>
      </div>

      <PatientPortalShellNotice />

      <div className="grid grid-cols-1 gap-6">
        <AppointmentSummaryCard appointments={mockAppointments} />
      </div>
    </div>
  );
};

export default PatientAppointmentsPage;
