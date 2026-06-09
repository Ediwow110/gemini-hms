import React from 'react';
import PatientBillingSummary from './components/PatientBillingSummary';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { usePatientInvoices } from '../../hooks/use-patient-portal';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';
import { safeMoney } from '../../lib/safe-money';

export const PatientBillingPage: React.FC = () => {
  const { invoices, loading } = usePatientInvoices();

  const displayInvoices = invoices.map((inv) => ({
    id: inv.id,
    service: `Invoice ${inv.invoiceNumber || inv.id.substring(0, 8)}`,
    amount: safeMoney(inv.balance) > 0 ? safeMoney(inv.totalAmount) : safeMoney(inv.paidAmount),
    date: new Date(inv.createdAt).toLocaleDateString(),
    status: inv.status === 'PAID' ? 'PAID' as const : inv.status === 'PARTIAL' ? 'PARTIAL' as const : 'UNPAID' as const,
  }));

  const outstandingBalance = invoices.reduce(
    (sum, inv) => sum + safeMoney(inv.balance),
    0,
  );

  return (
    <HmsDashboardShell>
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Billing & Payments"
          description="Review invoices and manage payments for your healthcare services"
        />

        <PatientPortalShellNotice />

        {loading ? (
          <HmsLoadingSkeleton />
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
