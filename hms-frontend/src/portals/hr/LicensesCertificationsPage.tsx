import React, { useState } from 'react';
import HRScopeFilter from './components/HRScopeFilter';
import { LicenseMonitorPanel, License } from './components/LicenseMonitorPanel';
import { ShieldCheck, Plus, Search } from 'lucide-react';
import { useHr } from '../../hooks/use-hr';
import { useUser } from '../../hooks/use-user';
import { apiClient } from '../../lib/api';

export const LicensesCertificationsPage: React.FC = () => {
  const user = useUser();
  const { fetchLicenses } = useHr(user?.branchId ?? '');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<{id: string, name: string}[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const handleSearchEmployees = async () => {
    if (!searchQuery) return;
    try {
      const res = await apiClient.get(`/hr/employees?q=${searchQuery}`);
      setEmployees(res.data.map((e: { id: string; firstName: string; lastName: string }) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })));
    } catch (e) {
      console.error("Employee search failed", e);
    }
  };

  const loadLicenses = async (empId: string) => {
    setIsLoading(true);
    try {
      const data = await fetchLicenses(empId);
      setLicenses(data as unknown as License[]);
    } catch (e) {
      console.error("Failed to load licenses", e);
    } finally {
      setIsLoading(false);
    }
  };

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
          <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all">
            <Plus className="h-4 w-4" /> Upload New Credential
          </button>
        </div>
      </div>

      <HRScopeFilter />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search employee to view licenses..." 
              className="flex-1 px-2 py-1 bg-transparent border-none focus:outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchEmployees()}
            />
            <button onClick={handleSearchEmployees} className="text-xs font-bold text-indigo-600">Search</button>
          </div>

          {employees.length > 0 && !selectedEmployee && (
            <div className="grid grid-cols-2 gap-3">
              {employees.map(e => (
                <div 
                  key={e.id} 
                  onClick={() => { setSelectedEmployee(e.id); loadLicenses(e.id); }}
                  className="p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-all text-sm font-medium"
                >
                  {e.name}
                </div>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="p-10 text-center text-slate-400">Loading licenses...</div>
          ) : selectedEmployee ? (
            <LicenseMonitorPanel licenses={licenses} />
          ) : (
            <div className="p-20 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
              Select an employee to monitor their professional credentials.
            </div>
          )}
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
                <p className="text-xl font-black text-emerald-700">{licenses.filter(l => l.status === 'VALID').length} / {licenses.length}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <p className="text-[10px] text-rose-800 font-bold uppercase tracking-wider mb-1">Expired / Action Required</p>
                <p className="text-xl font-black text-rose-700">{licenses.filter(l => l.status !== 'VALID').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Automated Verification</h4>
            <p className="text-[10px] text-indigo-800 leading-relaxed font-medium">
              The system performs weekly automated background checks against professional regulation commissions.
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
