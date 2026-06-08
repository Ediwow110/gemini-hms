import React from 'react';
import PatientProfileSummary from './components/PatientProfileSummary';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { usePatientProfile } from '../../hooks/use-patient-portal';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';

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
