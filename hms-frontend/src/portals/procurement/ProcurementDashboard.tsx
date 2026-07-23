import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import {
  procurementService,
  type PurchaseOrder,
  type PurchaseRequest,
  type Supplier,
} from '../../services/procurement.service';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsToolbar,
} from '../../components/hms-dashboard';

interface ProcurementDashboardData {
  suppliers: Supplier[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
}

const isOpenRequest = (status: string) =>
  !['REJECTED', 'ORDERED'].includes(status.toUpperCase());

const isOpenOrder = (status: string) =>
  !['RECEIVED', 'CANCELLED'].includes(status.toUpperCase());

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(value))
    : '—';

export const ProcurementDashboard: React.FC = () => {
  const dashboardQuery = useQuery({
    queryKey: ['procurement-dashboard-live'],
    queryFn: async (): Promise<ProcurementDashboardData> => {
      const [suppliers, purchaseRequests, purchaseOrders] = await Promise.all([
        procurementService.listSuppliers(),
        procurementService.listPurchaseRequests(),
        procurementService.listPurchaseOrders(),
      ]);
      return { suppliers, purchaseRequests, purchaseOrders };
    },
  });

  const data = dashboardQuery.data ?? {
    suppliers: [],
    purchaseRequests: [],
    purchaseOrders: [],
  };
  const activeSuppliers = data.suppliers.filter(
    (supplier) => supplier.status.toUpperCase() === 'ACTIVE',
  ).length;
  const openRequests = data.purchaseRequests.filter((request) =>
    isOpenRequest(request.status),
  ).length;
  const approvedRequests = data.purchaseRequests.filter(
    (request) => request.status.toUpperCase() === 'APPROVED',
  ).length;
  const openOrders = data.purchaseOrders.filter((order) =>
    isOpenOrder(order.status),
  ).length;

  const recentRequests = [...data.purchaseRequests]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 5);
  const recentOrders = [...data.purchaseOrders]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 5);

  return (
    <HmsDashboardShell
      widthTier="full"
      toolbar={
        <HmsToolbar
          branchName="Authorized procurement scope"
          role="Procurement Officer"
          onRefresh={() => void dashboardQuery.refetch()}
        />
      }
      footer={<HmsAuditFooter dataSource="Live Procurement API" />}
    >
      <div className="space-y-6 pb-12">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Supply chain operations
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">
            Procurement Overview
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Current supplier, purchase-request, and purchase-order totals from
            the transactional procurement API.
          </p>
        </header>

        {dashboardQuery.isError ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <span>
              Procurement data could not be loaded. No fallback or simulated
              values are being shown.
            </span>
            <button
              type="button"
              onClick={() => void dashboardQuery.refetch()}
              className="inline-flex items-center gap-2 rounded-md border border-rose-300 bg-white px-3 py-2 font-semibold"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : null}

        <section
          aria-busy={dashboardQuery.isLoading}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            label="Open purchase requests"
            value={dashboardQuery.isLoading ? '—' : openRequests}
            icon={<ShoppingBag className="h-5 w-5" aria-hidden="true" />}
            to="/procurement/purchase-requests"
          />
          <MetricCard
            label="Approved requests"
            value={dashboardQuery.isLoading ? '—' : approvedRequests}
            icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
            to="/procurement/purchase-requests"
          />
          <MetricCard
            label="Open purchase orders"
            value={dashboardQuery.isLoading ? '—' : openOrders}
            icon={<PackageCheck className="h-5 w-5" aria-hidden="true" />}
            to="/procurement/purchase-orders"
          />
          <MetricCard
            label="Active suppliers"
            value={dashboardQuery.isLoading ? '—' : activeSuppliers}
            icon={<Truck className="h-5 w-5" aria-hidden="true" />}
            to="/procurement/suppliers"
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <LiveTable
            title="Recent purchase requests"
            emptyLabel="No purchase requests are available in the authorized scope."
            headers={['Request', 'Status', 'Created']}
            rows={recentRequests.map((request) => [
              request.id,
              request.status,
              formatDate(request.createdAt),
            ])}
          />
          <LiveTable
            title="Recent purchase orders"
            emptyLabel="No purchase orders are available in the authorized scope."
            headers={['Order', 'Supplier', 'Status']}
            rows={recentOrders.map((order) => [
              order.orderNumber,
              order.supplier?.name ?? '—',
              order.status,
            ])}
          />
        </div>

        <section className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Historical spend trends, supplier SLA charts, stockout forecasting,
          and automatic RFQ generation are intentionally not displayed until
          dedicated backend analytics and mutation contracts are available.
        </section>
      </div>
    </HmsDashboardShell>
  );
};

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  to: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, to }) => (
  <Link
    to={to}
    className="block rounded-md border border-slate-300 border-l-[3px] border-l-sky-600 bg-white px-4 py-3 shadow-sm transition hover:border-slate-400"
  >
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-slate-400">{icon}</span>
    </div>
    <div className="mt-2 font-mono text-[22px] font-bold text-slate-900">{value}</div>
  </Link>
);

interface LiveTableProps {
  title: string;
  emptyLabel: string;
  headers: string[];
  rows: string[][];
}

const LiveTable: React.FC<LiveTableProps> = ({
  title,
  emptyLabel,
  headers,
  rows,
}) => (
  <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
    <div className="flex items-center gap-2 border-b border-slate-300 bg-slate-50 px-4 py-3">
      <div className="h-4 w-1 rounded-full bg-sky-600" />
      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">{title}</h2>
    </div>
    {rows.length === 0 ? (
      <p className="px-4 py-8 text-sm text-slate-500">{emptyLabel}</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/80 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-bold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${title}-${rowIndex}-${cellIndex}`}
                    className="px-4 py-3 text-slate-700"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

export default ProcurementDashboard;
