import { useState } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import { Search, FileText, HelpCircle } from 'lucide-react';
import { useInvoices } from '../../hooks/use-billing';

export const InvoicesPage = () => {
  const { invoices, loading, error, refetch } = useInvoices();
  const [search, setSearch] = useState('');

  const filtered = invoices.filter(inv => {
    const query = search.toLowerCase();
    return inv.invoiceNumber.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="Invoice Directory" 
          description="View and trace all invoices issued in this branch." 
        />
        <div className="text-[10px] font-black uppercase text-indigo-750 bg-indigo-50 border border-indigo-150 px-3.5 py-1.5 rounded-xl select-none">
          {loading ? '...' : `Total: ${invoices.length}`}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-xs text-slate-400">Loading invoices...</div>
      ) : error ? (
        <div className="card bg-red-50 border border-red-200 rounded-2xl p-6 text-xs text-red-700 text-center">
          <p className="font-bold">Error loading invoices</p>
          <p className="mt-1">{error}</p>
          <button onClick={refetch} className="mt-2 text-indigo-600 font-bold cursor-pointer hover:underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
          <p className="text-xs font-bold text-slate-600">No invoices found</p>
        </div>
      ) : (
        <div className="card overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        inv.status === 'PAID' || inv.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'PENDING' || inv.status === 'UNPAID' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{Number(inv.totalAmount).toLocaleString()} ₱</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{Number(inv.paidAmount).toLocaleString()} ₱</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer">
                        <FileText className="h-3.5 w-3.5 inline mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
