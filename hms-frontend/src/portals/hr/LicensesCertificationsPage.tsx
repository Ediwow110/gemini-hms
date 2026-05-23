import React from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { LicenseMonitorPanel, License } from './components/LicenseMonitorPanel';
import { ShieldCheck, Plus } from 'lucide-react';

export const LicensesCertificationsPage: React.FC = () => {
  const mockLicenses: License[] = [
    { id: 'LIC-001', employeeName: 'Dr. Gregory House', type: 'Medical Board License', expiryDate: '2026-06-15', daysRemaining: 25, status: 'EXPIRING' },
    { id: 'LIC-002', employeeName: 'Nurse Judy Hopps', type: 'Nursing License', expiryDate: '2026-08-30', daysRemaining: 101, status: 'VALID' },
    { id: 'LIC-003', employeeName: 'Eric Foreman', type: 'Neurology Board Certification', expiryDate: '2026-05-20', daysRemaining: -1, status: 'EXPIRED' },
    { id: 'LIC-004', employeeName: 'Robert Chase', type: 'BLS/ACLS Certification', expiryDate: '2026-07-12', daysRemaining: 52, status: 'VALID' },
    { id: 'LIC-005', employeeName: 'Allison Cameron', type: 'Immunology Certification', expiryDate: '2026-06-01', daysRemaining: 11, status: 'EXPIRING' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Licenses & Certifications
          </h2>
          <p className="text-xs text-slate-500 font-medium">Compliance monitoring for medical and professional credentials</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-semibold max-w-md">
            <strong>Sandbox Notice:</strong> License verification is simulated. No real external board checks are performed.
          </div>
          <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all">
            <Plus className="h-4 w-4" /> Upload New Credential
          </button>
        </div>
      </div>

      <HRScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LicenseMonitorPanel licenses={mockLicenses} />
        </div>
        
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              Compliance Snapshot
            </h4>
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-1">Total Valid</p>
                <p className="text-xl font-black text-emerald-700">92%</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <p className="text-[10px] text-rose-800 font-bold uppercase tracking-wider mb-1">Expired / Action Required</p>
                <p className="text-xl font-black text-rose-700">8%</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Automated Verification Shell</h4>
            <p className="text-[10px] text-indigo-800 leading-relaxed font-medium">
              The system performs weekly automated background checks against PRC (Professional Regulation Commission) and major certification providers.
            </p>
            <button className="text-[10px] text-indigo-700 font-bold hover:underline cursor-pointer">
              Configure Verification Providers &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicensesCertificationsPage;
