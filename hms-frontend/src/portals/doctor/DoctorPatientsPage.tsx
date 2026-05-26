import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, FileText, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { usePatientList } from '../../hooks/use-doctor';

export const DoctorPatientsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: patients, isLoading, error } = usePatientList(searchQuery || undefined);

  const safePatients = patients || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notice: WIP for advanced EMR features */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Patient Directory (Real — Advanced EMR features WIP)</h5>
          <p className="font-medium mt-0.5">
            Patient list is loaded from the live patient repository. Advanced EMR features (full chart, CDS, e-prescribing) remain in development.
          </p>
        </div>
      </div>

      <PageHeader 
        title="Patient Directory" 
        description="Search patient records and access clinical profile summaries." 
      />

      {/* Directory Filter bar */}
      <div className="card p-4 bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient by name or MRN number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="card bg-white border border-slate-200/80 shadow-sm p-10 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-100 rounded w-1/3 mx-auto" />
            <div className="h-3 bg-slate-50 rounded w-1/4 mx-auto" />
          </div>
          <p className="text-xs text-slate-400 font-semibold mt-4">Loading patient records...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="card bg-white border border-rose-200 shadow-sm p-10 text-center">
          <p className="text-sm font-bold text-rose-600">Failed to load patient records</p>
          <p className="text-xs text-slate-400 mt-1">Please try again or contact IT support.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && safePatients.length === 0 && (
        <div className="card bg-white border border-slate-200/80 shadow-sm p-10 text-center">
          <p className="text-sm font-semibold text-slate-400">No patient records found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? 'No records match your search query.' : 'No patients registered in this branch.'}
          </p>
        </div>
      )}

      {/* Patient Directory Grid/Table */}
      {!isLoading && !error && safePatients.length > 0 && (
        <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">MRN Number</th>
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Date of Birth</th>
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safePatients.map((p) => {
                const initials = `${p.firstName[0]}${p.lastName[0]}`;
                const displayDob = p.dob ? new Date(p.dob).toLocaleDateString() : '—';
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-extrabold text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.firstName} {p.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[10px] uppercase">
                        {p.patientNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      {displayDob}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/doctor/emr/${p.id}`)}
                        className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-sm text-[11px]"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        Open Chart
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default DoctorPatientsPage;
