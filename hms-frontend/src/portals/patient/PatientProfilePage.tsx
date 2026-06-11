import React from 'react';
import PatientProfileSummary from './components/PatientProfileSummary';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { usePatientProfile } from '../../hooks/use-patient-portal';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { AlertCircle } from 'lucide-react';

export const PatientProfilePage: React.FC = () => {
  const { profile, loading, error } = usePatientProfile();

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
    <HmsDashboardShell>
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="My Patient Profile"
          description="Your registered information"
        />

        <PatientPortalShellNotice />

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <HmsLoadingSkeleton />
          ) : error ? (
            <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Unable to load profile</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          ) : displayProfile ? (
            <PatientProfileSummary profile={displayProfile} />
          ) : (
            <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <HmsEmptyState 
                title="Profile not available" 
                description="Please log in to the patient portal to view your profile." 
              />
            </div>
          )}
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default PatientProfilePage;
