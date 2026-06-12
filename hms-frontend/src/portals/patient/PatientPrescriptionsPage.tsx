import React from 'react';
import ActivePrescriptionCard from './components/ActivePrescriptionCard';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { usePatientPrescriptions } from '../../hooks/use-patient-portal';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { AlertCircle } from 'lucide-react';

export const PatientPrescriptionsPage: React.FC = () => {
  const { prescriptions, loading, error } = usePatientPrescriptions();

  const displayPrescriptions = prescriptions.map(p => ({
    id: p.id,
    medication: p.medicationName,
    dosage: p.dosage,
    frequency: p.frequency,
    prescribedBy: 'Attending Physician',
    expiryDate: '',
    remainingRefills: p.status === 'ACTIVE' ? 1 : 0,
  }));

  return (
    <HmsDashboardShell widthTier="standard">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="My Prescriptions"
          description="Your active medications and dispensed records"
        />

        <PatientPortalShellNotice />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <HmsLoadingSkeleton />
          ) : error ? (
            <div className="col-span-1 card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Unable to load prescriptions</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          ) : displayPrescriptions.length === 0 ? (
            <div className="col-span-1 card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <HmsEmptyState 
                title="No prescriptions found" 
                description="Active and dispensed prescriptions will appear here." 
              />
            </div>
          ) : (
            <ActivePrescriptionCard prescriptions={displayPrescriptions} />
          )}
          
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4 h-fit">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Pharmacy Information</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase">In-House Pharmacy</p>
              <p className="text-sm font-bold text-slate-800">Metro Central Hospital Pharmacy</p>
              <p className="text-xs text-slate-500 font-medium">Open 24/7 for patient pickups</p>
            </div>
          </div>
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default PatientPrescriptionsPage;
