import React, { useState, useMemo } from 'react';
import { 
  HmsDashboardShell, 
  HmsToolbar, 
  HmsAuditFooter, 
  HmsDrilldownTable, 
  HmsStatusChip 
} from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';
import { Search, Receipt, Printer, Info, AlertCircle } from 'lucide-react';
import { useActiveSession } from '../../hooks/use-billing';
import { useUser } from '../../hooks/use-user';
import { ActiveSessionDto } from '../../services/billing-frontend.service';

type PaymentRecord = ActiveSessionDto['payments'][number];

export const PaymentsPage: React.FC = () => {
  const user = useUser();
  const { session, loading, error } = useActiveSession();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'CASH' | 'CARD' | 'GCASH'>('ALL');

  const filtered = useMemo(() => {
    const list = session?.payments || [];
    return list.filter(rcp => {
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
  }, [session?.payments, search, methodFilter]);

  const columns = [
    {
      key: 'id',
      header: 'Receipt ID',
      render: (rcp: PaymentRecord) => (
        <div className="flex items-center gap-1.5">
          <Receipt className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-mono font-bold text-emerald-700">{rcp.id.substring(0, 8)}</span>
        </div>
      )
    },
    {
      key: 'invoice',
      header: 'Invoice Reference',
      render: (rcp: PaymentRecord) => (
        <span className="font-mono font-bold text-slate-600">{rcp.invoice?.invoiceNumber || 'N/A'}</span>
      )
    },
    {
      key: 'patient',
      header: 'Patient Name',
      render: (rcp: PaymentRecord) => {
        const name = `${rcp.invoice?.order?.patient?.firstName || 'Walk-in'} ${rcp.invoice?.order?.patient?.lastName || 'Patient'}`;
        return <span className="font-bold text-slate-800">{name}</span>;
      }
    },
    {
      key: 'time',
      header: 'Processed Time',
      render: (rcp: PaymentRecord) => (
        <span className="font-mono text-slate-500">{new Date(rcp.createdAt).toLocaleTimeString()}</span>
      )
    },
    {
      key: 'method',
      header: 'Method',
      render: (rcp: PaymentRecord) => (
        <HmsStatusChip status={rcp.paymentMethod} variant="neutral" />
      )
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      width: 'text-right',
      render: (rcp: PaymentRecord) => (
        <span className="font-mono font-bold text-slate-900">
          ₱{Number(rcp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'action',
      header: 'Action',
      width: 'w-24',
      render: () => (
        <button
          disabled
          className="border border-slate-200 text-slate-400 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-not-allowed opacity-60"
          title="Receipt printing is simulated"
        >
          <Printer className="h-3 w-3" /> Print
        </button>
      )
    }
  ];

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar 
          branchName={user?.branchId ? `Branch ID: ${user.branchId}` : 'Main Clinic'}
          role={user?.roles?.join(', ')}
        >
          <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
            Receipts: {filtered.length}
          </span>
        </HmsToolbar>
      }
      footer={<HmsAuditFooter dataSource="POS Billing Engine" />}
    >
      <HmsPageHeader 
        title="POS Receipts Registry" 
        description="Examine transaction history logs, check reference codes, and reprint customer sales receipts."
        badge="Settlement Desk"
      />

      {!session && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2.5 text-[12px] text-amber-800 animate-fade-in">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="font-medium">
            <strong>No Active Cashier Session:</strong> Please open a cashier shift drawer session first to view and process payment receipts.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-[12px] text-rose-700 font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, receipt ID, invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}
          className="w-full md:w-48 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">All Payment Modes</option>
          <option value="CASH">CASH</option>
          <option value="CARD">CARD</option>
          <option value="GCASH">GCASH</option>
        </select>
      </div>

      <HmsDrilldownTable
        title="Payment Records"
        description="Detailed log of all customer settlements in the current session."
        columns={columns}
        data={filtered}
        keyExtractor={(rcp) => rcp.id}
        loading={loading}
        emptyMessage="No payment records found under this active session."
      />

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex gap-2 items-start">
        <Printer className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong>Simulated Print Behavior:</strong> Digital receipt generation and physical thermal printing are currently simulated. Reprints do not consume paper or increment the fiscal counter.
        </p>
      </div>

    </HmsDashboardShell>
  );
};

export default PaymentsPage;
