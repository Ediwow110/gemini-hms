import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { Search, FileText, ShieldCheck, Heart, AlertTriangle } from 'lucide-react';

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  patientName: string;
  mrn: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Unpaid' | 'Voided' | 'HMO Claim';
  hmoProvider?: string;
}

const mockInvoices: InvoiceItem[] = [
  { id: '1', invoiceNo: 'INV-2026-1044', patientName: 'Carmilla Karnstein', mrn: 'MRN-2026-0771', amount: 1450.00, date: 'Today, 10:25 AM', status: 'Unpaid' },
  { id: '2', invoiceNo: 'INV-2026-1045', patientName: 'Arthur Pendleton', mrn: 'MRN-2026-0042', amount: 500.00, date: 'Today, 09:14 AM', status: 'HMO Claim', hmoProvider: 'Maxicare Plus' },
  { id: '3', invoiceNo: 'INV-2026-1043', patientName: 'Eleanor Vance', mrn: 'MRN-2026-0091', amount: 2180.50, date: 'Yesterday, 04:12 PM', status: 'Unpaid' },
  { id: '4', invoiceNo: 'INV-2026-1042', patientName: 'John Watson', mrn: 'MRN-2026-0035', amount: 3500.00, date: 'Yesterday, 02:45 PM', status: 'Paid' },
  { id: '5', invoiceNo: 'INV-2026-1041', patientName: 'Victor Frankenstein', mrn: 'MRN-2026-0012', amount: 12500.00, date: '2026-05-19', status: 'Voided' }
];

export const InvoicesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'Paid' | 'Unpaid' | 'Voided' | 'HMO Claim'>('ALL');

  const filtered = mockInvoices.filter(inv => {
    const matchesSearch = inv.patientName.toLowerCase().includes(search.toLowerCase()) || 
                          inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
                          inv.mrn.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || inv.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Sandbox Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">UI Demonstration Sandbox Shell</h5>
          <p className="font-medium mt-0.5">
            This invoice directory is running in demo mode. Listed items are mock values used to simulate layout rendering.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="POS Invoice Directory" 
          description="View and trace all invoices issued in this branch. Process unpaid charges or examine billing breakdowns." 
        />
        <div className="text-[10px] font-black uppercase text-indigo-750 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl select-none">
          Total Invoices: {mockInvoices.length}
        </div>
      </div>

      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, invoice number, MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9.5 text-xs py-2 w-full rounded-xl bg-slate-50 border-slate-200/80"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'ALL' | 'Paid' | 'Unpaid' | 'Voided' | 'HMO Claim')}
            className="input text-xs py-2 w-full md:w-[180px] rounded-xl bg-white border border-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="HMO Claim">HMO Claim</option>
            <option value="Voided">Voided</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-3xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
              <th className="px-6 py-3.5">Invoice Number</th>
              <th className="px-6 py-3.5">Patient & MRN</th>
              <th className="px-6 py-3.5">Invoice Date</th>
              <th className="px-6 py-3.5">Payer Details</th>
              <th className="px-6 py-3.5 text-right">Total Amount</th>
              <th className="px-6 py-3.5 text-center">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold">
                  No invoices found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-650 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    {inv.invoiceNo}
                  </td>
                  <td className="px-6 py-4 space-y-0.5">
                    <span className="font-black text-slate-800">{inv.patientName}</span>
                    <div className="text-[10px] text-slate-400 font-mono">MRN: {inv.mrn}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-500">{inv.date}</td>
                  <td className="px-6 py-4">
                    {inv.hmoProvider ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-750 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-lg select-none">
                        <ShieldCheck className="h-3 w-3 text-indigo-500" /> {inv.hmoProvider}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-550 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg select-none">
                        <Heart className="h-3 w-3 text-slate-400" /> Private Pay
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-800 text-sm">
                    ₱{inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-xl font-black uppercase text-[9px] border tracking-wider select-none ${
                      inv.status === 'Paid'
                        ? 'bg-emerald-50 border-emerald-150 text-emerald-700'
                        : inv.status === 'Unpaid'
                        ? 'bg-rose-50 border-rose-150 text-rose-700 animate-pulse'
                        : inv.status === 'HMO Claim'
                        ? 'bg-blue-50 border-blue-150 text-blue-700'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/cashier/billing?id=${inv.id}&invoice=${inv.invoiceNo}`)}
                      className="btn border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3.5 py-1.5 text-[11px] font-extrabold rounded-xl shadow-sm transition-all"
                    >
                      View Invoice Details
                    </button>
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

export default InvoicesPage;
