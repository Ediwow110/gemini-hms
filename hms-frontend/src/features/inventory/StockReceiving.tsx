import { useState, useMemo } from 'react';
import { PageHeader } from '../../components/ui/page-header';
import {
  HmsDashboardShell,
  HmsAuditFooter,
  HmsLoadingSkeleton,
  HmsEmptyState,
} from '../../components/hms-dashboard';
import { useInventoryCatalog, useReceiveStock } from '../../hooks/use-inventory';
import { Inbox, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { InventoryCatalogItem } from '../../services/inventory.service';

export const StockReceiving = () => {
  const { data: items, isLoading, error } = useInventoryCatalog();
  const receive = useReceiveStock();
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [supplierName, setSupplierName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const catalog: InventoryCatalogItem[] = useMemo(() => items ?? [], [items]);
  const selectedItem = useMemo(
    () => catalog.find((i) => i.id === selectedItemId) ?? null,
    [catalog, selectedItemId],
  );

  const submitDisabled =
    !selectedItemId || !Number.isFinite(quantity) || quantity < 1 || receive.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitDisabled) return;
    setSuccessMessage(null);
    try {
      await receive.mutateAsync({
        itemId: selectedItemId,
        quantity,
        supplierName: supplierName.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      setSuccessMessage(
        `Received ${quantity} ${selectedItem?.unit ?? 'unit(s)'} of ${
          selectedItem?.name ?? 'item'
        }.`,
      );
      setQuantity(1);
      setSupplierName('');
      setRemarks('');
    } catch {
      // Error is surfaced via receive.isError; do not fabricate success.
    }
  };

  return (
    <HmsDashboardShell
      widthTier="compact"
      footer={<HmsAuditFooter dataSource="Live inventory backend (POST /v1/inventory/items/:id/receive)" />}
    >
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Stock Receiving"
          description="Record incoming shipments from suppliers and update branch stock."
        />

        {error && (
          <div
            role="alert"
            data-testid="stock-receiving-error"
            className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-bold mb-1">Failed to load inventory catalog</p>
              <p>The inventory backend is not reachable. Please retry or contact your administrator.</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            data-testid="stock-receiving-success"
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800 flex items-start gap-3"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold mb-0.5">Stock received</p>
              <p>{successMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss success message"
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {receive.isError && !successMessage && (
          <div
            role="alert"
            data-testid="stock-receiving-submit-error"
            className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-bold mb-1">Failed to post receiving</p>
              <p>
                The receiving transaction was not completed. The stock balance was
                not changed. Please retry or contact your administrator.
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          data-testid="stock-receiving-form"
          className="card p-6 space-y-6"
        >
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Inbox className="h-4 w-4 text-slate-400" />
            Supplier Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-xs">
              <span className="font-semibold text-slate-700">Supplier Name</span>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Supplier name (optional)"
                className="mt-1 input w-full"
                disabled={receive.isPending}
              />
            </label>
            <label className="block text-xs">
              <span className="font-semibold text-slate-700">Reference No.</span>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reference / remarks (optional)"
                className="mt-1 input w-full"
                disabled={receive.isPending}
              />
            </label>
          </div>

          <h2 className="font-semibold text-slate-900">Received Items</h2>

          {isLoading ? (
            <HmsLoadingSkeleton variant="table" rows={3} />
          ) : catalog.length === 0 ? (
            <HmsEmptyState
              title="No inventory items in catalog"
              description="Add inventory items before recording a stock receipt."
            />
          ) : (
            <div className="space-y-3">
              <label className="block text-xs">
                <span className="font-semibold text-slate-700">Inventory Item</span>
                <select
                  data-testid="stock-receiving-item-select"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="mt-1 input w-full"
                  disabled={receive.isPending}
                  required
                >
                  <option value="">— Select an item —</option>
                  {catalog.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku || item.id.slice(0, 8)})
                    </option>
                  ))}
                </select>
              </label>

              {selectedItem && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold">Current stock:</span>{' '}
                    {selectedItem.stock} {selectedItem.unit}
                  </p>
                  <p>
                    <span className="font-semibold">Reorder level:</span>{' '}
                    {selectedItem.reorderLevel} {selectedItem.unit}
                  </p>
                </div>
              )}

              <label className="block text-xs">
                <span className="font-semibold text-slate-700">Quantity</span>
                <input
                  data-testid="stock-receiving-quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1 input w-full"
                  disabled={receive.isPending}
                  required
                />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedItemId('');
                setQuantity(1);
                setSupplierName('');
                setRemarks('');
                setSuccessMessage(null);
              }}
              className="btn btn-secondary"
              disabled={receive.isPending}
            >
              Reset
            </button>
            <button
              type="submit"
              data-testid="stock-receiving-submit"
              className="btn btn-primary"
              disabled={submitDisabled}
            >
              {receive.isPending ? 'Posting…' : 'Post Receiving'}
            </button>
          </div>
        </form>
      </div>
    </HmsDashboardShell>
  );
};

export default StockReceiving;
