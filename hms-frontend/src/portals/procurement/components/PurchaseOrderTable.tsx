import React from 'react';
import { ShoppingBag, Package, PackageCheck } from 'lucide-react';

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED'
  | string;

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  itemCount: number | null;
  date: string;
  status: PurchaseOrderStatus;
  canReceive?: boolean;
  receiveBlockedReason?: string;
}

interface PurchaseOrderTableProps {
  orders: PurchaseOrder[];
  onReceive?: (order: PurchaseOrder) => void;
  busyOrderId?: string | null;
}

const statusBadgeClass = (status: string | undefined): string => {
  const s = (status || '').toUpperCase();
  if (s === 'RECEIVED') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
  if (s === 'SENT' || s === 'PARTIALLY_RECEIVED') {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }
  if (s === 'DRAFT') {
    return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  }
  if (s === 'CANCELLED') {
    return 'bg-slate-50 text-slate-500 border-slate-200';
  }
  return 'bg-slate-50 text-slate-500 border-slate-200';
};

const statusLabel = (status: string | undefined): string => {
  const s = (status || '').toUpperCase();
  if (s === 'DRAFT') return 'Draft';
  if (s === 'SENT') return 'Sent';
  if (s === 'PARTIALLY_RECEIVED') return 'Partially Received';
  if (s === 'RECEIVED') return 'Received';
  if (s === 'CANCELLED') return 'Cancelled';
  return s || '—';
};

export const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({
  orders,
  onReceive,
  busyOrderId,
}) => {
  const isLive = Boolean(onReceive);
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-indigo-500" />
            Active Purchase Orders
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">Tracking issued procurement orders</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-3 pl-2">PO #</th>
              <th className="pb-3">Supplier</th>
              <th className="pb-3">Items</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((po) => {
              const isBusy = busyOrderId === po.id;
              return (
                <tr
                  key={po.id}
                  className="hover:bg-slate-50/50 transition-colors"
                  data-testid={`purchase-order-row-${po.id}`}
                >
                  <td className="py-3 pl-2 font-mono font-bold text-slate-600">
                    <span data-testid={`purchase-order-number-${po.id}`}>
                      {po.poNumber}
                    </span>
                    <p className="text-[9px] text-slate-400 font-medium">
                      {po.date}
                    </p>
                  </td>
                  <td
                    className="py-3 font-bold text-slate-800"
                    data-testid={`purchase-order-supplier-${po.id}`}
                  >
                    {po.supplier}
                  </td>
                  <td
                    className="py-3 text-slate-600"
                    data-testid={`purchase-order-items-${po.id}`}
                  >
                    {po.itemCount === null
                      ? '—'
                      : po.itemCount === 1
                        ? '1 item'
                        : `${po.itemCount} items`}
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${statusBadgeClass(po.status)}`}
                      data-testid={`purchase-order-status-${po.id}`}
                    >
                      {statusLabel(po.status)}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-2">
                    {onReceive ? (
                      <button
                        type="button"
                        onClick={() => onReceive(po)}
                        disabled={isBusy || po.canReceive === false}
                        title={
                          po.receiveBlockedReason ||
                          (po.canReceive === false
                            ? 'Cannot receive in current state'
                            : 'Mark as received')
                        }
                        data-testid={`purchase-order-receive-${po.id}`}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:hover:text-inherit"
                      >
                        {po.status === 'RECEIVED' ? (
                          <PackageCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Package className="h-3.5 w-3.5" />
                        )}
                        {isBusy ? 'Working…' : 'Receive'}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isLive ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-800 font-semibold">
          <strong>Simulation Notice:</strong> Purchase order generation is mock-only. No real PDF generation or electronic data interchange (EDI) occurs.
        </div>
      ) : null}
    </div>
  );
};

export default PurchaseOrderTable;
