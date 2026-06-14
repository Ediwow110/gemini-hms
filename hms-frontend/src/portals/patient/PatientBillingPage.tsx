import React from 'react';
import PatientBillingSummary from './components/PatientBillingSummary';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { usePatientInvoices } from '../../hooks/use-patient-portal';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { AlertCircle } from 'lucide-react';
import { safeMoney } from '../../lib/safe-money';

export const PatientBillingPage: React.FC = () => {
  const { invoices, loading, error } = usePatientInvoices();

  const displayInvoices = invoices.map((inv) => ({
    id: inv.id,
    service: `Invoice ${inv.invoiceNumber || inv.id.substring(0, 8)}`,
    amount: safeMoney(inv.balance) > 0 ? safeMoney(inv.balance) : safeMoney(inv.paidAmount),
    date: new Date(inv.createdAt).toLocaleDateString(),
    status: inv.status === 'PAID' ? 'PAID' as const : inv.status === 'PARTIAL' ? 'PARTIAL' as const : 'UNPAID' as const,
  }));

  const outstandingBalance = invoices.reduce(
    (sum, inv) => sum + safeMoney(inv.balance),
    0,
  );

  return (
    <HmsDashboardShell widthTier="standard">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Billing & Payments"
          description="Review invoices and manage payments for your healthcare services"
        />

        <PatientPortalShellNotice />

        {loading ? (
          <HmsLoadingSkeleton />
        ) : error ? (
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Unable to load invoices</p>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        ) : displayInvoices.length === 0 ? (
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <HmsEmptyState 
              title="No invoices found" 
              description="When services are billed, invoices will appear here." 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <PatientBillingSummary invoices={displayInvoices} outstandingBalance={outstandingBalance} />
          </div>
        )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default PatientBillingPage;
