import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../../lib/api';

interface SupplierSalesOrder {
  id: string;
  orderNumber?: string | null;
  status: string;
  totalAmount: string | number;
  quote?: {
    rfq?: {
      title?: string | null;
    } | null;
  } | null;
}

interface SupplierOrdersResponse {
  salesOrders?: SupplierSalesOrder[];
}

const peso = (value: string | number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const SupplierOrderQueue: React.FC = () => {
  const [orders, setOrders] = useState<SupplierSalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<SupplierOrdersResponse>(
        '/marketplace/supplier/orders',
      );
      setOrders(
        Array.isArray(response.data?.salesOrders)
          ? response.data.salesOrders
          : [],
      );
    } catch {
      setError('Supplier orders could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        <p className="mt-3 text-xs font-semibold text-slate-500">Loading supplier orders…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="h-8 w-8 text-rose-500" />
        <p className="mt-3 text-sm font-semibold text-rose-800">{error}</p>
        <button
          type="button"
          onClick={() => void fetchOrders()}
          className="mt-4 min-h-10 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="supplier-order-heading">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 id="supplier-order-heading" className="text-sm font-semibold text-slate-900">Order queue</h3>
          <p className="mt-1 text-xs text-slate-500">Live sales orders associated with this supplier account.</p>
        </div>
        <Link to="/supplier/orders" className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
          View all
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
          <Package className="h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No active orders</p>
          <p className="mt-1 text-xs text-slate-500">Accepted buyer orders will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="shrink-0 rounded-xl border border-indigo-100 bg-indigo-50 p-2.5 text-indigo-600">
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {order.quote?.rfq?.title || 'Marketplace order'}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">
                    {order.orderNumber || order.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700">
                  {order.status}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-900">
                  {peso(order.totalAmount)}
                </span>
                <Link
                  to="/supplier/orders"
                  className="min-h-9 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SupplierOrderQueue;
