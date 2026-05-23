import { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { Search, Receipt, AlertTriangle } from 'lucide-react';

interface PaymentReceipt {
  id: string;
  receiptNo: string;
  invoiceNo: string;
  patientName: string;
  amount: number;
  paymentMethod: string;
  referenceNo?: string;
  date: string;
  cashier: string;
}

const mockReceipts: PaymentReceipt[] = [
  { id: 'R1', receiptNo: 'RCP-2026-9028', invoiceNo: 'INV-2026-1042', patientName: 'John Watson', amount: 3500.00, paymentMethod: 'Cash', date: 'Today, 10:45 AM', cashier: 'Mark Santos' },
  { id: 'R2', receiptNo: 'RCP-2026-9027', invoiceNo: 'INV-2026-1040', patientName: 'Mina Murray', amount: 5120.00, paymentMethod: 'Card Payment', referenceNo: 'AUTH-8921-22', date: 'Today, 09:12 AM', cashier: 'Mark Santos' },
  { id: 'R3', receiptNo: 'RCP-2026-9026', invoiceNo: 'INV-2026-1039', patientName: 'Lucy Westenra', amount: 850.00, paymentMethod: 'Digital Wallet (GCash)', referenceNo: 'TXN-90218-AA', date: 'Yesterday, 04:30 PM', cashier: 'Mark Santos' },
  { id: 'R4', receiptNo: 'RCP-2026-9025', invoiceNo: 'INV-2026-1038', patientName: 'Renfield Fly', amount: 1500.00, paymentMethod: 'Cash', date: 'Yesterday, 02:15 PM', cashier: 'Jane Doe' }
];

export const PaymentsPage = () => {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'Cash' | 'Card' | 'Online'>('ALL');

  const filtered = mockReceipts.filter(rcp => {
    const matchesSearch = rcp.patientName.toLowerCase().includes(search.toLowerCase()) || 
                          rcp.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
                          rcp.invoiceNo.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = methodFilter === 'ALL' || 
                          (methodFilter === 'Cash' && rcp.paymentMethod === 'Cash') ||
                          (methodFilter === 'Card' && rcp.paymentMethod === 'Card Payment') ||
                          (methodFilter === 'Online' && rcp.paymentMethod.includes('Digital'));
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
            This receipts ledger is currently running in demonstration mode. Receipt list records represent mock transaction logs.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="POS Receipts Registry" 
          description="Examine transactions history logs, check cash/card/e-wallet reference codes, and reprint customer sales receipts." 
        />
        <div className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl select-none">
          Total Receipts: {mockReceipts.length}
        </div>
      </div>

      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, receipt number, invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9.5 text-xs py-2 w-full rounded-xl bg-slate-50 border-slate-200/80"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as 'ALL' | 'Cash' | 'Card' | 'Online')}
            className="input text-xs py-2 w-full md:w-[180px] rounded-xl bg-white border border-slate-200"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Online">GCash / Digital</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-3xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
              <th className="px-6 py-3.5">Receipt Number</th>
              <th className="px-6 py-3.5">Invoice Reference</th>
              <th className="px-6 py-3.5">Patient Name</th>
              <th className="px-6 py-3.5">Processed Time</th>
              <th className="px-6 py-3.5">Payment Method</th>
              <th className="px-6 py-3.5">Audit Teller</th>
              <th className="px-6 py-3.5 text-right">Amount Paid</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400 font-semibold">
                  No payment records found.
                </td>
              </tr>
            ) : (
              filtered.map((rcp) => (
                <tr key={rcp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    {rcp.receiptNo}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-600">{rcp.invoiceNo}</td>
                  <td className="px-6 py-4 font-black text-slate-800">{rcp.patientName}</td>
                  <td className="px-6 py-4 font-semibold text-slate-500">{rcp.date}</td>
                  <td className="px-6 py-4 space-y-1">
                    <span className="font-bold text-slate-750 block">{rcp.paymentMethod}</span>
                    {rcp.referenceNo && (
                      <span className="text-[10px] text-slate-400 font-mono font-semibold block">Ref: {rcp.referenceNo}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-500">{rcp.cashier}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-800 text-sm">
                    ₱{rcp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => alert(`Reprinting receipt ${rcp.receiptNo} in mock PDF format...`)}
                      className="btn border border-slate-200 hover:bg-slate-50 px-3.5 py-1.5 text-[11px] font-bold rounded-xl shadow-sm transition-all"
                    >
                      Print Copy
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

export default PaymentsPage;
