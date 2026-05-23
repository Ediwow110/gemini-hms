import { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { 
  ShieldAlert, 
  Search, 
  PhoneCall, 
  CheckCircle, 
  Clock, 
  User
} from 'lucide-react';

interface CriticalResultLog {
  id: string;
  patientName: string;
  mrn: string;
  testName: string;
  parameterName: string;
  value: string;
  refRange: string;
  physicianName: string;
  physicianPhone: string;
  reportedTime: string;
  status: 'Pending' | 'Contacted';
  contactedTime?: string;
  contactedBy?: string;
  remarks?: string;
}

const mockCriticalLogs: CriticalResultLog[] = [
  {
    id: 'CRIT-101',
    patientName: 'Arthur Pendleton',
    mrn: 'MRN-2026-0042',
    testName: 'Serum Chemistry',
    parameterName: 'Potassium (K+)',
    value: '6.2 mEq/L',
    refRange: '3.5 - 5.1 mEq/L',
    physicianName: 'Dr. Victor Frankenstein',
    physicianPhone: '555-0199',
    reportedTime: 'Today, 08:35 AM',
    status: 'Pending'
  },
  {
    id: 'CRIT-102',
    patientName: 'Carmilla Karnstein',
    mrn: 'MRN-2026-0771',
    testName: 'Complete Blood Count',
    parameterName: 'Hemoglobin (Hgb)',
    value: '58 g/L',
    refRange: '120 - 160 g/L',
    physicianName: 'Dr. John Seward',
    physicianPhone: '555-0122',
    reportedTime: 'Today, 07:12 AM',
    status: 'Contacted',
    contactedTime: 'Today, 07:25 AM',
    contactedBy: 'Jane Smith, RMT',
    remarks: 'Dr. Seward ordered immediate blood transfusion and inpatient admission.'
  },
  {
    id: 'CRIT-103',
    patientName: 'Eleanor Vance',
    mrn: 'MRN-2026-0091',
    testName: 'Thyroid Screen',
    parameterName: 'Free T4',
    value: '0.4 ng/dL',
    refRange: '0.8 - 1.8 ng/dL',
    physicianName: 'Dr. John Watson',
    physicianPhone: '555-0144',
    reportedTime: 'Yesterday, 04:30 PM',
    status: 'Contacted',
    contactedTime: 'Yesterday, 04:45 PM',
    contactedBy: 'Jane Smith, RMT',
    remarks: 'Watson acknowledged, will review dosage during follow-up.'
  }
];

export const CriticalResultsPage = () => {
  const [logs, setLogs] = useState<CriticalResultLog[]>(mockCriticalLogs);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'Pending' | 'Contacted'>('ALL');
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [remarksText, setRemarksText] = useState('');

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.patientName.toLowerCase().includes(search.toLowerCase()) || 
                          l.mrn.toLowerCase().includes(search.toLowerCase()) ||
                          l.physicianName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || l.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleOpenAcknowledge = (id: string) => {
    setActiveLogId(id);
    setShowLogModal(true);
  };

  const handleConfirmAcknowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLogId) return;

    setLogs(logs.map(log => 
      log.id === activeLogId 
        ? { 
            ...log, 
            status: 'Contacted', 
            contactedTime: 'Just now', 
            contactedBy: 'Lab Technician User', 
            remarks: remarksText || 'Physician contacted, results relayed.' 
          } 
        : log
    ));

    alert('Clinician contact logged and audit history updated.');
    setShowLogModal(false);
    setActiveLogId(null);
    setRemarksText('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="Critical Alerts & Notification Registry" 
          description="Track panic-level diagnostic results that require direct, immediate physician notification. Log caller identity and clinican acknowledgment times." 
        />
        <div className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-150 px-3.5 py-1.5 rounded-xl select-none animate-pulse">
          Panic Registry Active
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, physician, MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9.5 text-xs py-2 w-full rounded-xl bg-slate-50 border-slate-200/80"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'ALL' | 'Pending' | 'Contacted')}
            className="input text-xs py-2 w-full md:w-[180px] rounded-xl bg-white border border-slate-200"
          >
            <option value="ALL">All Panic Logs</option>
            <option value="Pending">Pending Contact</option>
            <option value="Contacted">Contacted / Logged</option>
          </select>
        </div>
      </div>

      {/* Critical Logs Queue */}
      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-455 font-black uppercase tracking-wider border-b border-slate-150">
                <th className="px-6 py-4">Patient Profile</th>
                <th className="px-6 py-4">Critical Parameter</th>
                <th className="px-6 py-4">Physician & Phone</th>
                <th className="px-6 py-4">Time Flagged</th>
                <th className="px-6 py-4">Notification Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-655">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-bold text-xs">
                    No critical alert records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className={log.status === 'Pending' ? 'bg-rose-50/10' : ''}>
                    <td className="px-6 py-4 space-y-0.5">
                      <p className="font-black text-slate-800 text-sm leading-tight">{log.patientName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">MRN: {log.mrn}</p>
                    </td>

                    <td className="px-6 py-4 space-y-1">
                      <p className="text-rose-700 font-black">
                        {log.testName} - {log.parameterName}: <strong className="underline text-sm">{log.value}</strong>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Ref Range: {log.refRange}</p>
                    </td>

                    <td className="px-6 py-4 space-y-0.5">
                      <p className="font-bold text-slate-700 flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-400" /> {log.physicianName}</p>
                      <p className="text-[10px] text-indigo-600 font-mono flex items-center gap-1"><PhoneCall className="h-3 w-3" /> {log.physicianPhone}</p>
                    </td>

                    <td className="px-6 py-4 space-y-0.5">
                      <p className="flex items-center gap-1 text-slate-700"><Clock className="h-3.5 w-3.5 text-slate-400" /> {log.reportedTime}</p>
                    </td>

                    <td className="px-6 py-4">
                      {log.status === 'Contacted' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-extrabold text-[9px] border border-emerald-100 select-none">
                            <CheckCircle className="h-3 w-3" /> Contacted
                          </span>
                          <p className="text-[9px] text-slate-400 font-medium leading-tight">
                            Logged: {log.contactedTime} by {log.contactedBy}
                          </p>
                          {log.remarks && (
                            <p className="text-[9px] text-slate-505 italic max-w-xs truncate" title={log.remarks}>
                              "{log.remarks}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 font-extrabold text-[9px] border border-rose-150 animate-pulse select-none">
                          <ShieldAlert className="h-3 w-3" /> Pending Contact
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {log.status === 'Pending' ? (
                        <button
                          onClick={() => handleOpenAcknowledge(log.id)}
                          className="btn bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] shadow-sm flex items-center gap-1 mx-auto"
                        >
                          <PhoneCall className="h-3 w-3" /> Log Contact
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold block">Archived</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Call Modal Dialog */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleConfirmAcknowledge} className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in relative space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
              Document Physician Contact
            </h4>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Log call confirmation details to satisfy LIS SLA rules and audit requirements. This will notify clinical supervisors and EMR receivers.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase block">Physician Instructions & Notes</label>
              <textarea
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                placeholder="Enter verbal orders or critical receipt notes given by physician..."
                className="input min-h-[90px] text-xs py-2 w-full rounded-xl bg-slate-50 border border-slate-200"
                required
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="submit"
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm"
              >
                Log Contact Cleared
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogModal(false);
                  setActiveLogId(null);
                  setRemarksText('');
                }}
                className="btn border border-slate-200 text-slate-650 hover:bg-slate-550 text-xs font-bold px-4 py-2.5 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default CriticalResultsPage;
