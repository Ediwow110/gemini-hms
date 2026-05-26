import React from 'react';
import ActivePrescriptionCard from './components/ActivePrescriptionCard';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { usePatientPrescriptions } from '../../hooks/use-patient-portal';
import { HelpCircle } from 'lucide-react';

export const PatientPrescriptionsPage: React.FC = () => {
  const { prescriptions, loading } = usePatientPrescriptions();

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            My Prescriptions
          </h2>
          <p className="text-xs text-slate-500 font-medium">Your active medications and dispensed records</p>
        </div>
      </div>

      <PatientPortalShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">
            Loading prescriptions...
          </div>
        ) : displayPrescriptions.length === 0 ? (
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">No prescriptions found</p>
            <p className="text-[11px] text-slate-450">Active and dispensed prescriptions will appear here.</p>
          </div>
        ) : (
          <ActivePrescriptionCard prescriptions={displayPrescriptions} />
        )}
        
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Pharmacy Information</h3>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase">In-House Pharmacy</p>
            <p className="text-sm font-bold text-slate-800">Metro Central Hospital Pharmacy</p>
            <p className="text-xs text-slate-500 font-medium">Open 24/7 for patient pickups</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPrescriptionsPage;
