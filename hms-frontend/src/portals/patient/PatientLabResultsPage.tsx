import React from 'react';
import ReleasedResultCard from './components/ReleasedResultCard';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { Search, Filter, HelpCircle } from 'lucide-react';
import { usePatientLabResults } from '../../hooks/use-patient-portal';

export const PatientLabResultsPage: React.FC = () => {
  const { results, loading } = usePatientLabResults();

  const displayResults = results.map(r => ({
    id: r.id,
    testName: `Lab Result #${r.id.substring(0, 8)}`,
    dateReleased: r.lockedAt ? new Date(r.lockedAt).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString(),
    doctorName: 'Attending Physician',
    status: 'NORMAL' as const,
    isReleased: true,
    doctorNotes: r.remarks || '',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            My Test Results
          </h2>
          <p className="text-xs text-slate-500 font-medium">Access your laboratory reports securely</p>
        </div>
      </div>

      <PatientPortalShellNotice />

      <div className="card p-4 flex flex-wrap gap-4 items-center bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search results..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
          <Filter className="h-4 w-4" /> Filter by Date
        </button>
      </div>

      {loading ? (
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">
          Loading your lab results...
        </div>
      ) : displayResults.length === 0 ? (
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
          <p className="text-xs font-bold text-slate-600">No released lab results found</p>
          <p className="text-[11px] text-slate-450">When your physician releases results, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <ReleasedResultCard results={displayResults} />
        </div>
      )}

      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
        <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest mb-2">Important Security Notice</h4>
        <p className="text-xs text-rose-800 leading-relaxed font-medium">
          Only results that have been verified by a qualified physician and explicitly released are displayed here.
          If you are awaiting a result that is not visible, please contact your prescribing doctor.
        </p>
      </div>
    </div>
  );
};

export default PatientLabResultsPage;
