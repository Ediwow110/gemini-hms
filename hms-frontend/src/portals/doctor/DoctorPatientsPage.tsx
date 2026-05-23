import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, FileText } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  dob: string;
  contact: string;
  status: string;
}

export const DoctorPatientsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const patients: PatientRecord[] = [
    { id: 'P-101', name: 'Eleanor Vance', age: 37, gender: 'Female', dob: '1988-11-24', contact: '+63 912 345 6789', status: 'Active' },
    { id: 'P-102', name: 'Arthur Pendleton', age: 60, gender: 'Male', dob: '1965-04-12', contact: '+63 923 456 7890', status: 'Active' },
    { id: 'P-103', name: 'Victor Frankenstein', age: 29, gender: 'Male', dob: '1996-08-18', contact: '+63 934 567 8901', status: 'Active' },
  ];

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Patient Directory" 
        description="Search global medical records and browse active clinical profile summaries." 
      />

      {/* Directory Filter bar */}
      <div className="card p-4 bg-white border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient record directories by name or MRN number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Patient Directory Grid/Table */}
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">MRN Number</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Date of Birth</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Contact Info</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-semibold">
                  No patient records match query terms.
                </td>
              </tr>
            ) : (
              filteredPatients.map((p) => {
                const initials = p.name.split(' ').map(n => n[0]).join('');
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-extrabold text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{p.gender} · {p.age} Years Old</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[10px] uppercase">
                        {p.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      {p.dob}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      {p.contact}
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default DoctorPatientsPage;
