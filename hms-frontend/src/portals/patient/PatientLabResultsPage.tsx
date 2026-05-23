import React from 'react';
import ReleasedResultCard, { ReleasedResult } from './components/ReleasedResultCard';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { Search, Filter } from 'lucide-react';

export const PatientLabResultsPage: React.FC = () => {
  const mockResults: ReleasedResult[] = [
    { id: '1', testName: 'Complete Blood Count (CBC)', dateReleased: '2026-05-18', doctorName: 'Dr. Foreman', status: 'NORMAL', isReleased: true, doctorNotes: 'All parameters within normal range. No follow-up needed for this test.' },
    { id: '2', testName: 'Urinalysis', dateReleased: '2026-05-19', doctorName: 'Dr. Cameron', status: 'NORMAL', isReleased: true, doctorNotes: 'Routine screening clear. Continue current hydration.' },
    { id: '3', testName: 'Liver Function Test (LFT)', dateReleased: 'Pending', doctorName: 'Dr. House', status: 'NORMAL', isReleased: false },
    { id: '4', testName: 'Lipid Profile', dateReleased: '2026-02-10', doctorName: 'Dr. Chase', status: 'ABNORMAL', isReleased: true, doctorNotes: 'Total cholesterol slightly elevated. Please schedule a follow-up consultation to discuss dietary adjustments.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            My Test Results
          </h2>
          <p className="text-xs text-slate-500 font-medium">Access your laboratory and radiology reports securely</p>
        </div>
      </div>

      <PatientPortalShellNotice />

      <div className="card p-4 flex flex-wrap gap-4 items-center bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tests by name or doctor..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
          <Filter className="h-4 w-4" /> Filter by Date
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ReleasedResultCard results={mockResults} />
      </div>

      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
        <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest mb-2">Important Security Notice</h4>
        <p className="text-xs text-rose-800 leading-relaxed font-medium">
          For your protection, unreleased or preliminary laboratory results are strictly restricted from the Patient Portal. 
          Only results that have been verified by a qualified physician and explicitly marked for release are displayed here. 
          If you are awaiting a result that is not visible, please contact your prescribing doctor.
        </p>
      </div>
    </div>
  );
};

export default PatientLabResultsPage;
