import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { Search, Receipt, AlertCircle, Printer } from 'lucide-react';
import { useActiveSession } from '../../hooks/use-billing';

export const PaymentsPage: React.FC = () => {
  const { session, loading, error } = useActiveSession();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'CASH' | 'CARD' | 'GCASH'>('ALL');

  if (loading) {
    return (
      <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">
        Loading POS receipts registry...
      </div>
    );
  }

  const receipts = session?.payments || [];

  const filtered = receipts.filter(rcp => {
    const patientName = `${rcp.invoice?.order?.patient?.firstName || ''} ${rcp.invoice?.order?.patient?.lastName || ''}`.toLowerCase();
    const invoiceNo = rcp.invoice?.invoiceNumber?.toLowerCase() || '';
    const receiptNo = rcp.id.toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = patientName.includes(query) || 
                          receiptNo.includes(query) ||
                          invoiceNo.includes(query);

    const matchesFilter = methodFilter === 'ALL' || rcp.paymentMethod === methodFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-750 font-bold">
          {error}
        </div>
      )}

      {!session && (
        <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-extrabold uppercase text-[10px] tracking-wider">No Active Cashier Session</h5>
            <p className="font-medium mt-0.5">
              Please open a cashier shift drawer session first to view and process payment receipts.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="POS Receipts Registry" 
          description="Examine transactions history logs, check cash/card/e-wallet reference codes, and reprint customer sales receipts." 
        />
        <div className="text-[10px] font-black uppercase text-indigo-750 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl select-none">
          Total Receipts: {filtered.length}
        </div>
      </div>

      <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, receipt ID, invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9.5 text-xs py-2 w-full rounded-xl bg-slate-50 border-slate-200/80 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as 'ALL' | 'CASH' | 'CARD' | 'GCASH')}
            className="input text-xs py-2 w-full md:w-[180px] rounded-xl bg-white border border-slate-200"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="CASH">CASH</option>
            <option value="CARD">CARD</option>
            <option value="GCASH">GCASH</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-3xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
              <th className="px-6 py-3.5">Receipt ID</th>
              <th className="px-6 py-3.5">Invoice Reference</th>
              <th className="px-6 py-3.5">Patient Name</th>
              <th className="px-6 py-3.5">Processed Time</th>
              <th className="px-6 py-3.5">Payment Method</th>
              <th className="px-6 py-3.5 text-right">Amount Paid</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-450 font-bold uppercase tracking-wider">
                  No payment records found under this active session.
                </td>
              </tr>
            ) : (
              filtered.map((rcp) => {
                const patientName = `${rcp.invoice?.order?.patient?.firstName || 'Walk-in'} ${rcp.invoice?.order?.patient?.lastName || 'Patient'}`;
                return (
                  <tr key={rcp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-slate-450 group-hover:text-emerald-600 transition-colors" />
                      {rcp.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">
                      {rcp.invoice?.invoiceNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800">{patientName}</td>
                    <td className="px-6 py-4 font-semibold text-slate-500">
                      {new Date(rcp.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-750">
                      {rcp.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-850 text-sm">
                      ₱{Number(rcp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => alert(`Reprinting receipt ${rcp.id} in mock PDF format...`)}
                        className="btn border border-slate-200 hover:bg-slate-50 px-3.5 py-1.5 text-[11px] font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 ml-auto"
                      >
                        <Printer className="h-3.5 w-3.5" /> Print
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

export default PaymentsPage;
