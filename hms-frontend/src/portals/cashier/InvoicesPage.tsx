import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsToolbar, HmsAuditFooter, HmsStatusChip, HmsDrilldownTable } from '../../components/hms-dashboard';
import { Search, FileText, RefreshCw } from 'lucide-react';
import { useInvoices } from '../../hooks/use-billing';
import { useUser } from '../../hooks/use-user';
import { safeMoney } from '../../lib/safe-money';

export const InvoicesPage = () => {
  const navigate = useNavigate();
  const user = useUser();
  const { invoices, loading, error, refetch } = useInvoices();
  const [search, setSearch] = useState('');

  const filtered = invoices.filter(inv => {
    const query = search.toLowerCase();
    return inv.invoiceNumber.toLowerCase().includes(query);
  });

  const getStatusVariant = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED') return 'success';
    if (s === 'PENDING' || s === 'UNPAID') return 'warning';
    if (s === 'VOID' || s === 'CANCELLED') return 'critical';
    return 'neutral';
  };

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (inv: typeof invoices[0]) => (
        <span className="font-mono font-bold text-blue-600">{inv.invoiceNumber}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (inv: typeof invoices[0]) => (
        <HmsStatusChip status={inv.status} variant={getStatusVariant(inv.status)} />
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (inv: typeof invoices[0]) => (
        <span className="font-mono font-bold text-slate-800">
          {safeMoney(inv.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₱
        </span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      render: (inv: typeof invoices[0]) => (
        <span className="font-mono text-slate-500">
          {safeMoney(inv.paidAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₱
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (inv: typeof invoices[0]) => (
        <span className="font-mono text-slate-400">
          {new Date(inv.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      width: 'w-24',
      render: (inv: typeof invoices[0]) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/cashier/billing?invoice=${inv.id}`);
          }}
          className="border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-650 px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-all"
        >
          <FileText className="h-3 w-3" /> Pay
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      <HmsPageHeader 
        title="Invoice Directory" 
        description="View and trace all invoices issued in this branch."
        badge="Billing Desk"
      />

      <HmsToolbar 
        branchName={user?.branchId ? `Branch ID: ${user.branchId}` : 'Main Clinic'}
        role={user?.roles?.join(', ')}
        onRefresh={refetch}
      >
        <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
          {loading ? 'Loading...' : `Total: ${invoices.length}`}
        </span>
      </HmsToolbar>

      {/* Search panel */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-2 h-4 w-4 text-slate-450" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-550"
          />
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-[12px] text-red-750 text-center space-y-2">
          <p className="font-bold">Error loading invoices</p>
          <p className="text-[11px] font-medium">{error}</p>
          <button 
            onClick={refetch} 
            className="bg-red-100 hover:bg-red-200 text-red-800 font-bold px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      ) : (
        <HmsDrilldownTable
          title="Issued Invoice Records"
          description={search ? `Filtered results for "${search}"` : "All invoices recorded in the system"}
          columns={columns}
          data={filtered}
          keyExtractor={(inv) => inv.id}
          loading={loading}
          emptyMessage="No invoices found matching query"
          onRowClick={(inv) => navigate(`/cashier/billing?invoice=${inv.id}`)}
        />
      )}

      <HmsAuditFooter dataSource="Billing Financial Service" lastRefreshed={new Date()} />
    </div>
  );
};

export default InvoicesPage;
