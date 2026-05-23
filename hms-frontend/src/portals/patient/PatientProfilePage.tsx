import React from 'react';
import PatientProfileSummary, { PatientProfile } from './components/PatientProfileSummary';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';

export const PatientProfilePage: React.FC = () => {
  const mockProfile: PatientProfile = {
    id: 'PAT-2026-8842',
    fullName: 'Juan Dela Cruz',
    dateOfBirth: '1985-07-24',
    email: 'j.delacruz@example.com',
    phoneNumber: '+63 912 345 6789',
    address: '123 Mahogany St, Metro Manila, Philippines',
    emergencyContact: 'Maria Dela Cruz (Spouse) - +63 912 987 6543',
    insuranceProvider: 'Maxicare Health Corp',
    bloodType: 'O+'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            My Patient Profile
          </h2>
          <p className="text-xs text-slate-500 font-medium">Manage your personal information, contact details, and privacy settings</p>
        </div>
      </div>

      <PatientPortalShellNotice />

      <div className="grid grid-cols-1 gap-6">
        <PatientProfileSummary profile={mockProfile} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Security & Account Shell</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-600">Multi-Factor Authentication</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-md">ENABLED</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-600">Active Login Sessions</span>
                <span className="text-[10px] text-indigo-600 font-black">2 Devices</span>
              </div>
            </div>
            <button className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black rounded-xl text-[10px] transition-all cursor-pointer">
              Change Account Password
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Notification Preferences</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-[11px] font-bold text-slate-600">Appointment Reminders (SMS)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-[11px] font-bold text-slate-600">New Lab Results (Email)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-[11px] font-bold text-slate-600">Hospital Newsletter</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfilePage;
