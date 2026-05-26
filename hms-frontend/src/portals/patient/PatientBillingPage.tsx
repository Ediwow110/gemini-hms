import React from 'react';
import PatientBillingSummary from './components/PatientBillingSummary';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { usePatientInvoices } from '../../hooks/use-patient-portal';
import { HelpCircle } from 'lucide-react';

export const PatientBillingPage: React.FC = () => {
  const { invoices, loading } = usePatientInvoices();

  const displayInvoices = invoices.map((inv) => ({
    id: inv.id,
    service: `Invoice ${inv.invoiceNumber || inv.id.substring(0, 8)}`,
    amount: Number(inv.balance > 0 ? inv.totalAmount : inv.paidAmount),
    date: new Date(inv.createdAt).toLocaleDateString(),
    status: inv.status === 'PAID' ? 'PAID' as const : inv.status === 'PARTIAL' ? 'PARTIAL' as const : 'UNPAID' as const,
  }));

  const outstandingBalance = invoices.reduce(
    (sum, inv) => sum + Number(inv.balance),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Billing & Payments
          </h2>
          <p className="text-xs text-slate-500 font-medium">Review invoices and manage payments for your healthcare services</p>
        </div>
      </div>

      <PatientPortalShellNotice />

      {loading ? (
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center">
          <p className="text-xs text-slate-400 font-semibold">Loading your invoices...</p>
        </div>
      ) : displayInvoices.length === 0 ? (
        <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
          <p className="text-xs font-bold text-slate-600">No invoices found</p>
          <p className="text-[11px] text-slate-450">When services are billed, invoices will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <PatientBillingSummary invoices={displayInvoices} outstandingBalance={outstandingBalance} />
        </div>
      )}
    </div>
  );
};

export default PatientBillingPage;
