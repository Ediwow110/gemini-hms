import React from 'react';
import { 
  Pill, 
  CreditCard, 
  MessageSquare, 
  Heart,
  ShieldCheck,
  Bell,
  Calendar,
  FileText,
  UserCircle,
  Video
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PatientHomeCard from './components/PatientHomeCard';
import AppointmentSummaryCard, { Appointment } from './components/AppointmentSummaryCard';
import ReleasedResultCard, { ReleasedResult } from './components/ReleasedResultCard';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';

export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();

  const mockAppointments: Appointment[] = [
    { id: '1', doctorName: 'Dr. Gregory House', department: 'Clinical', date: '2026-05-25', time: '10:00 AM', status: 'UPCOMING', type: 'CLINIC' },
  ];

  const mockResults: ReleasedResult[] = [
    { id: '1', testName: 'Complete Blood Count (CBC)', dateReleased: '2026-05-18', doctorName: 'Dr. Foreman', status: 'NORMAL', isReleased: true, doctorNotes: 'All parameters within normal range. No follow-up needed for this test.' },
    { id: '2', testName: 'Urinalysis', dateReleased: '2026-05-19', doctorName: 'Dr. Cameron', status: 'NORMAL', isReleased: true, doctorNotes: 'Routine screening clear. Continue current hydration.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Hello, Welcome Back
          </h2>
          <p className="text-xs text-slate-500 font-medium">Access your medical records, appointments, and care team</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
          <button 
            onClick={() => navigate('/patient/profile')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md"
          >
            My Profile
          </button>
        </div>
      </div>

      <PatientPortalShellNotice />

      {/* Quick Actions Section */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => navigate('/patient/appointments')}
            className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-xl transition-all group"
          >
            <Calendar className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-1.5" />
            <span className="text-[10px] font-black text-slate-600 group-hover:text-indigo-700">Book Visit</span>
          </button>
          <button 
            onClick={() => navigate('/patient/medical-records')}
            className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-100 rounded-xl transition-all group"
          >
            <FileText className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 mb-1.5" />
            <span className="text-[10px] font-black text-slate-600 group-hover:text-emerald-700">Get Records</span>
          </button>
          <button 
            onClick={() => navigate('/telehealth')}
            className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-100 rounded-xl transition-all group"
          >
            <Video className="h-5 w-5 text-slate-400 group-hover:text-amber-600 mb-1.5" />
            <span className="text-[10px] font-black text-slate-600 group-hover:text-amber-700">Video Call</span>
          </button>
          <button 
            onClick={() => navigate('/patient/profile')}
            className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-violet-50 border border-slate-100 hover:border-violet-100 rounded-xl transition-all group"
          >
            <UserCircle className="h-5 w-5 text-slate-400 group-hover:text-violet-600 mb-1.5" />
            <span className="text-[10px] font-black text-slate-600 group-hover:text-violet-700">Update Info</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PatientHomeCard 
          title="Outstanding Balance" 
          value="₱4,250.00" 
          icon={CreditCard} 
          description="Due for recent laboratory tests"
          type="warning"
          actionLabel="Pay Now"
          onClick={() => navigate('/patient/billing')}
        />
        <PatientHomeCard 
          title="Active Prescriptions" 
          value="2 Items" 
          icon={Pill} 
          description="Amlodipine, Metformin"
          type="success"
          actionLabel="View Details"
          onClick={() => navigate('/patient/prescriptions')}
        />
        <PatientHomeCard 
          title="Unread Messages" 
          value="1 New" 
          icon={MessageSquare} 
          description="From Dr. House's assistant"
          type="info"
          actionLabel="Open Inbox"
          onClick={() => navigate('/patient/messages')}
        />
        <PatientHomeCard 
          title="Health Score" 
          value="92/100" 
          icon={Heart} 
          description="Based on latest wellness check"
          type="info"
          actionLabel="Wellness Plan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentSummaryCard appointments={mockAppointments} />
        <ReleasedResultCard results={mockResults} />
      </div>

      <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Health Maintenance Reminders</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-tight">Annual Physical</p>
            <p className="text-xs font-medium text-emerald-700">Scheduled for Oct 2026</p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight">Vaccination Update</p>
            <p className="text-xs font-medium text-amber-700">Flu shot recommended</p>
          </div>
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
            <p className="text-[10px] font-black text-indigo-800 uppercase tracking-tight">Lab Follow-up</p>
            <p className="text-xs font-medium text-indigo-700">Check LDL in 3 months</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
