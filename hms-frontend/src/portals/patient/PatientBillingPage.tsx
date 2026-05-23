import React from 'react';
import PatientBillingSummary, { Invoice } from './components/PatientBillingSummary';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';

export const PatientBillingPage: React.FC = () => {
  const mockInvoices: Invoice[] = [
    { id: 'INV-2026-001', service: 'Complete Blood Count (CBC)', amount: 1250, date: '2026-05-18', status: 'UNPAID' },
    { id: 'INV-2026-002', service: 'Urinalysis', amount: 850, date: '2026-05-19', status: 'UNPAID' },
    { id: 'INV-2026-003', service: 'General Consultation', amount: 2150, date: '2026-05-15', status: 'UNPAID' },
    { id: 'INV-2026-004', service: 'X-Ray Chest PA', amount: 3500, date: '2026-04-10', status: 'PAID' },
  ];

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

      <div className="grid grid-cols-1 gap-6">
        <PatientBillingSummary invoices={mockInvoices} outstandingBalance={4250} />
      </div>
    </div>
  );
};

export default PatientBillingPage;
