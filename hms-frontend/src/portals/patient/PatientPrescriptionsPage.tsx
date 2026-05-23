import React from 'react';
import ActivePrescriptionCard, { ActivePrescription } from './components/ActivePrescriptionCard';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';

export const PatientPrescriptionsPage: React.FC = () => {
  const mockPrescriptions: ActivePrescription[] = [
    { id: 'RX-101', medication: 'Amlodipine Besylate', dosage: '5mg', frequency: 'Once daily', prescribedBy: 'Dr. Gregory House', expiryDate: '2026-11-20', remainingRefills: 2 },
    { id: 'RX-102', medication: 'Metformin HCl', dosage: '500mg', frequency: 'Twice daily with meals', prescribedBy: 'Dr. Allison Cameron', expiryDate: '2026-08-15', remainingRefills: 5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            My Prescriptions
          </h2>
          <p className="text-xs text-slate-500 font-medium">Manage your active medications and refill requests</p>
        </div>
      </div>

      <PatientPortalShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivePrescriptionCard prescriptions={mockPrescriptions} />
        
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Pharmacy Information Shell</h3>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase">Preferred In-House Pharmacy</p>
            <p className="text-sm font-bold text-slate-800">Metro Central Hospital Pharmacy</p>
            <p className="text-xs text-slate-500 font-medium">Open 24/7 for patient pickups</p>
          </div>
          <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition-all">
            Transfer Prescription to Branch
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientPrescriptionsPage;
