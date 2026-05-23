import React from 'react';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { FileBadge, Download, ShieldCheck, Lock } from 'lucide-react';

export const PatientMedicalRecordsPage: React.FC = () => {
  const mockRecords = [
    { id: 'MR-2026-001', type: 'Clinical Summary', provider: 'Dr. Gregory House', date: '2026-05-15', status: 'RELEASED' },
    { id: 'MR-2025-042', type: 'Annual Wellness Report', provider: 'Dr. Allison Cameron', date: '2025-10-12', status: 'RELEASED' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Medical Records & Summaries
          </h2>
          <p className="text-xs text-slate-500 font-medium">Access your released medical history and encounter summaries</p>
        </div>
      </div>

      <PatientPortalShellNotice />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest px-1">Released Records</h3>
          {mockRecords.map((record) => (
            <div key={record.id} className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                  <FileBadge className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">{record.type}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{record.date} · {record.provider}</p>
                </div>
              </div>
              <button className="flex items-center gap-2 bg-slate-50 hover:bg-indigo-600 text-slate-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all border border-slate-200 hover:border-indigo-600 cursor-pointer shadow-sm">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Privacy Control Shell
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              You can control who has access to your medical records. Staff members require explicit clinical authorization to view your full history.
            </p>
            <button className="w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">
              Manage Access Permissions
            </button>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest flex items-center gap-2">
              <Lock className="h-4 w-4" /> Data Restriction Policy
            </h4>
            <p className="text-[10px] text-rose-800 leading-relaxed font-medium">
              Internal clinical SOAP notes, unverified lab results, and administrative audit logs are strictly restricted from patient view to ensure data integrity and privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientMedicalRecordsPage;
