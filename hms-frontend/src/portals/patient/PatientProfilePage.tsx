import React from 'react';
import PatientProfileSummary from './components/PatientProfileSummary';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { usePatientProfile } from '../../hooks/use-patient-portal';
import { HelpCircle } from 'lucide-react';

export const PatientProfilePage: React.FC = () => {
  const { profile, loading } = usePatientProfile();

  const displayProfile = profile ? {
    id: profile.patientNumber,
    fullName: `${profile.firstName} ${profile.lastName}`,
    dateOfBirth: new Date(profile.dob).toLocaleDateString(),
    email: '',
    phoneNumber: '',
    address: '',
    emergencyContact: '',
    insuranceProvider: '',
    bloodType: ''
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            My Patient Profile
          </h2>
          <p className="text-xs text-slate-500 font-medium">Your registered information</p>
        </div>
      </div>

      <PatientPortalShellNotice />

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">
            Loading profile...
          </div>
        ) : displayProfile ? (
          <PatientProfileSummary profile={displayProfile} />
        ) : (
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">Profile not available</p>
            <p className="text-[11px] text-slate-450">Please log in to the patient portal to view your profile.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfilePage;
