import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

export interface QueueItem {
  id: string;
  patientName: string;
  mrn: string;
  invoiceNo: string;
  department: string;
  amount: number;
  hmoProvider?: string;
  status: 'Unpaid' | 'Partial' | 'Pending Approval';
  priority: 'STAT' | 'Routine';
}

interface PaymentQueueTableProps {
  items: QueueItem[];
  limit?: number;
  className?: string;
}

export const PaymentQueueTable = ({ items, limit, className = '' }: PaymentQueueTableProps) => {
  const navigate = useNavigate();
  const displayItems = limit ? items.slice(0, limit) : items;

  return (
    <div className={`card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <CreditCard className="h-4.5 w-4.5 text-indigo-500" />
          Pending Payment Queue
        </h3>
        <button
          onClick={() => navigate('/cashier/billing')}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
        >
          View Billing Desk <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
              <th className="px-4 py-3">Patient & MRN</th>
              <th className="px-4 py-3">Invoice & Dept</th>
              <th className="px-4 py-3">Payer Split</th>
              <th className="px-4 py-3 text-right">Balance Due</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400 font-semibold">
                  No patients waiting in queue.
                </td>
              </tr>
            ) : (
              displayItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3.5 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-800">{item.patientName}</span>
                      {item.priority === 'STAT' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-150 text-rose-700 font-extrabold text-[8px] animate-pulse">
                          STAT
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">MRN: {item.mrn}</span>
                  </td>
                  <td className="px-4 py-3.5 space-y-0.5">
                    <div className="font-bold text-slate-700 font-mono">{item.invoiceNo}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{item.department}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    {item.hmoProvider ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-750 bg-indigo-50 border border-indigo-150/60 px-2 py-0.5 rounded-lg select-none">
                        <ShieldCheck className="h-3 w-3 text-indigo-500" /> {item.hmoProvider}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-550 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg select-none">
                        <Heart className="h-3 w-3 text-slate-400" /> Private Pay
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-slate-800 text-sm">
                    ₱{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg font-black uppercase text-[9px] border tracking-wider select-none ${
                      item.status === 'Partial'
                        ? 'bg-amber-50 border-amber-150 text-amber-700'
                        : item.status === 'Pending Approval'
                        ? 'bg-rose-50 border-rose-150 text-rose-700 animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => navigate(`/cashier/billing?id=${item.id}&invoice=${item.invoiceNo}`)}
                      className="btn border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3.5 py-1.5 text-[11px] font-extrabold rounded-xl shadow-sm transition-all"
                    >
                      Process Bill
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

export default PaymentQueueTable;
