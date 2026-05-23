import { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { Search, ShieldCheck, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface HmoClaim {
  id: string;
  claimNo: string;
  invoiceNo: string;
  patientName: string;
  hmoProvider: string;
  loaCode: string;
  amount: number;
  status: 'Pending Submission' | 'Submitted' | 'Approved' | 'Rejected';
  date: string;
}

const mockClaims: HmoClaim[] = [
  { id: 'C1', claimNo: 'CLM-2026-081', invoiceNo: 'INV-2026-1045', patientName: 'Arthur Pendleton', hmoProvider: 'Maxicare Plus', loaCode: 'LOA-9018-AB', amount: 450.00, status: 'Pending Submission', date: 'Today' },
  { id: 'C2', claimNo: 'CLM-2026-080', invoiceNo: 'INV-2026-1035', patientName: 'Seward Jack', hmoProvider: 'Intellicare', loaCode: 'LOA-8921-XY', amount: 1200.00, status: 'Submitted', date: 'Yesterday' },
  { id: 'C3', claimNo: 'CLM-2026-079', invoiceNo: 'INV-2026-1022', patientName: 'Quincey Morris', hmoProvider: 'MediCard', loaCode: 'LOA-7781-CC', amount: 3500.00, status: 'Approved', date: '2026-05-18' },
  { id: 'C4', claimNo: 'CLM-2026-078', invoiceNo: 'INV-2026-1011', patientName: 'Lucy Westenra', hmoProvider: 'PhilHealth', loaCode: 'LOA-3321-ZZ', amount: 8000.00, status: 'Rejected', date: '2026-05-17' }
];

export const HMOClaimsPage = () => {
  const [claims, setClaims] = useState<HmoClaim[]>(mockClaims);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBatchSubmit = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one pending claim to submit.');
      return;
    }

    setClaims(claims.map(c => 
      selectedIds.includes(c.id) ? { ...c, status: 'Submitted' } : c
    ));
    setSelectedIds([]);
    alert(`Batch of ${selectedIds.length} HMO claims transmitted to electronic billing portal (Sandbox Simulation).`);
  };

  const filtered = claims.filter(c => 
    c.patientName.toLowerCase().includes(search.toLowerCase()) ||
    c.claimNo.toLowerCase().includes(search.toLowerCase()) ||
    c.loaCode.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = claims.filter(c => c.status === 'Pending Submission').length;
  const submittedCount = claims.filter(c => c.status === 'Submitted').length;
  const approvedCount = claims.filter(c => c.status === 'Approved').length;
  const rejectedCount = claims.filter(c => c.status === 'Rejected').length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This claims workspace processes insurer communications in memory only. Electronic dispatch logs are simulated.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="HMO & Insurance Claims" 
          description="Track Letter of Authorization (LOA) approvals, submit e-claims to partner HMO portals, and log co-pays." 
        />
        {pendingCount > 0 && (
          <button
            onClick={handleBatchSubmit}
            className="btn btn-primary text-xs font-black px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
          >
            <ArrowUpRight className="h-4 w-4" /> Batch Transmit ({selectedIds.length} Selected)
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pending Submission</span>
          <h3 className="font-black text-slate-800 text-lg mt-1">{pendingCount} Claims</h3>
        </div>
        <div className="card p-4.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Submitted</span>
          <h3 className="font-black text-slate-850 text-lg mt-1">{submittedCount} Claims</h3>
        </div>
        <div className="card p-4.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Approved / Settled</span>
          <h3 className="font-black text-emerald-600 text-lg mt-1">{approvedCount} Claims</h3>
        </div>
        <div className="card p-4.5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Rejected / Disputed</span>
          <h3 className="font-black text-rose-600 text-lg mt-1">{rejectedCount} Claims</h3>
        </div>
      </div>

      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search claim number, patient, LOA auth code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9.5 text-xs py-2 w-full rounded-xl bg-slate-50 border-slate-200/80"
          />
        </div>
      </div>

      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-3xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
              <th className="px-6 py-3.5 text-center w-[50px]">Select</th>
              <th className="px-6 py-3.5">Claim & LOA Code</th>
              <th className="px-6 py-3.5">Patient Name</th>
              <th className="px-6 py-3.5">HMO Provider</th>
              <th className="px-6 py-3.5">Invoice Ref</th>
              <th className="px-6 py-3.5 text-right">Coverage Amount</th>
              <th className="px-6 py-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold">
                  No HMO claims match filters.
                </td>
              </tr>
            ) : (
              filtered.map((cl) => (
                <tr key={cl.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-center">
                    {cl.status === 'Pending Submission' ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(cl.id)}
                        onChange={() => handleToggleSelect(cl.id)}
                        className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                      />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 space-y-0.5">
                    <span className="font-bold text-slate-750 block">{cl.claimNo}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">LOA: {cl.loaCode}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-800">{cl.patientName}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 font-bold text-indigo-750 bg-indigo-50 border border-indigo-150/60 px-2 py-0.5 rounded-lg select-none">
                      <ShieldCheck className="h-3 w-3 text-indigo-500" /> {cl.hmoProvider}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-slate-500">{cl.invoiceNo}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-800 text-sm">
                    ₱{cl.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-xl font-black uppercase text-[9px] border tracking-wider select-none ${
                      cl.status === 'Approved'
                        ? 'bg-emerald-50 border-emerald-150 text-emerald-700'
                        : cl.status === 'Submitted'
                        ? 'bg-blue-50 border-blue-150 text-blue-700'
                        : cl.status === 'Pending Submission'
                        ? 'bg-amber-50 border-amber-150 text-amber-700 animate-pulse'
                        : 'bg-rose-50 border-rose-150 text-rose-700'
                    }`}>
                      {cl.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default HMOClaimsPage;
