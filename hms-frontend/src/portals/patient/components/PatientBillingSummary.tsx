import React from 'react';
import { CreditCard, Download } from 'lucide-react';

export interface Invoice {
  id: string;
  service: string;
  amount: number;
  date: string;
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
}

interface PatientBillingSummaryProps {
  invoices: Invoice[];
  outstandingBalance: number;
}

export const PatientBillingSummary: React.FC<PatientBillingSummaryProps> = ({ invoices, outstandingBalance }) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-500" />
            Billing & Payments
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Manage your hospital invoices and receipts</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-4 relative overflow-hidden shadow-lg shadow-slate-200">
        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Balance</p>
          <p className="text-3xl font-black tracking-tight">₱{outstandingBalance.toLocaleString()}</p>
        </div>
        <button className="relative z-10 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer">
          Pay Balance Now
        </button>
        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-indigo-500/10 rounded-full" />
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider pt-2">Recent Invoices</h4>
        {invoices.map((inv) => (
          <div key={inv.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group">
            <div>
              <p className="text-xs font-black text-slate-800">{inv.service}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">{inv.date} · {inv.id}</p>
            </div>
            <div className="text-right flex items-center gap-3">
              <div>
                <p className="text-xs font-black text-slate-900">₱{inv.amount.toLocaleString()}</p>
                <span className={`text-[8px] font-extrabold px-1 py-0.5 rounded uppercase border ${
                  inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  {inv.status}
                </span>
              </div>
              <button className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold leading-relaxed">
        <strong>Security Notice:</strong> Payment processing is simulated. Clicking "Pay" does not initiate real bank transfers or card charges.
      </div>
    </div>
  );
};

export default PatientBillingSummary;
