import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  PurchaseOrderTable,
  type PurchaseOrder as PresentationalOrder,
} from './components/PurchaseOrderTable';
import {
  FilePlus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Truck,
} from 'lucide-react';
import { ReportExportButton } from '../../components/analytics';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';
import { useAuth } from '../../hooks/use-user';
import {
  procurementService,
  type PurchaseOrder,
  type CreatePurchaseOrderPayload,
  type ReceivePurchaseOrderPayload,
  type PurchaseRequest,
  type Supplier,
} from '../../services/procurement.service';

const initialCreateState = {
  supplierId: '',
  purchaseRequestId: '',
  notes: '',
};

const extractApiError = (err: unknown, fallback: string): string => {
  const e = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const detail = e?.response?.data?.message;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) return detail.join(', ');
  if (e?.message) return e.message;
  return fallback;
};

const shortId = (id: string | null | undefined, fallback = '—'): string => {
  if (!id) return fallback;
  if (id.length <= 10) return id;
  return `${id.slice(0, 8)}…`;
};

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const mapOrder = (po: PurchaseOrder): PresentationalOrder => {
  const supplierName = po.supplier?.name || `Supplier ${shortId(po.supplierId, '—')}`;
  const itemCount =
    po.purchaseRequest && Array.isArray(po.purchaseRequest.items)
      ? po.purchaseRequest.items.length
      : null;
  const canReceive = (po.status || '').toUpperCase() === 'SENT';
  let receiveBlockedReason: string | undefined;
  if (!canReceive) {
    receiveBlockedReason = `Cannot receive a purchase order with status ${po.status}`;
  }
  return {
    id: po.id,
    poNumber: po.orderNumber,
    supplier: supplierName,
    itemCount,
    date: formatDate(po.createdAt),
    status: po.status,
    canReceive,
    receiveBlockedReason,
  };
};

export const PurchaseOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const currentBranchId = user?.branchId ?? null;

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateState);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supplier + approved-PR lookups for the create form
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);
  const [approvedRequests, setApprovedRequests] = useState<PurchaseRequest[]>(
    [],
  );
  const [approvedRequestsLoading, setApprovedRequestsLoading] = useState(false);
  const [approvedRequestsError, setApprovedRequestsError] = useState<
    string | null
  >(null);

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<PresentationalOrder | null>(
    null,
  );
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiveError, setReceiveError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await procurementService.listPurchaseOrders();
      setOrders(list);
    } catch (err: unknown) {
      setFetchError(extractApiError(err, 'Failed to load purchase orders.'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const fetchSuppliers = useCallback(async () => {
    setSuppliersLoading(true);
    setSuppliersError(null);
    try {
      const list = await procurementService.listSuppliers();
      setSuppliers(list);
    } catch (err: unknown) {
      setSuppliersError(
        extractApiError(err, 'Failed to load suppliers.'),
      );
      setSuppliers([]);
    } finally {
      setSuppliersLoading(false);
    }
  }, []);

  const fetchApprovedRequests = useCallback(async () => {
    setApprovedRequestsLoading(true);
    setApprovedRequestsError(null);
    try {
      const list = await procurementService.listPurchaseRequests({
        status: 'APPROVED',
      });
      setApprovedRequests(list);
    } catch (err: unknown) {
      setApprovedRequestsError(
        extractApiError(err, 'Failed to load approved purchase requests.'),
      );
      setApprovedRequests([]);
    } finally {
      setApprovedRequestsLoading(false);
    }
  }, []);

  const presentational = useMemo(() => orders.map(mapOrder), [orders]);

  const statusCount = useMemo(() => {
    const counts = {
      sent: 0,
      received: 0,
      cancelled: 0,
      draft: 0,
      other: 0,
    };
    for (const o of orders) {
      const s = (o.status || '').toUpperCase();
      if (s === 'SENT') counts.sent += 1;
      else if (s === 'RECEIVED') counts.received += 1;
      else if (s === 'CANCELLED') counts.cancelled += 1;
      else if (s === 'DRAFT') counts.draft += 1;
      else counts.other += 1;
    }
    return counts;
  }, [orders]);

  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateForm(initialCreateState);
    setCreateError(null);
    setCreateSuccess(null);
    void fetchSuppliers();
    void fetchApprovedRequests();
  };

  const closeCreateModal = () => {
    if (isSubmitting) return;
    setShowCreateModal(false);
    setCreateForm(initialCreateState);
    setCreateError(null);
    setCreateSuccess(null);
  };

  const validateCreateForm = (): string | null => {
    if (!currentBranchId) {
      return 'No branch context is available for your account. Cannot create a purchase order.';
    }
    if (!createForm.supplierId) {
      return 'Select a supplier.';
    }
    if (!createForm.purchaseRequestId) {
      return 'Select an approved purchase request.';
    }
    return null;
  };

  const handleCreate = async () => {
    setCreateError(null);
    setCreateSuccess(null);

    const validationError = validateCreateForm();
    if (validationError) {
      setCreateError(validationError);
      return;
    }
    if (!currentBranchId) {
      setCreateError('Missing branch context.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreatePurchaseOrderPayload = {
        branchId: currentBranchId,
        supplierId: createForm.supplierId,
        purchaseRequestId: createForm.purchaseRequestId,
      };
      const created = await procurementService.createPurchaseOrder(payload);
      setCreateSuccess(
        `Purchase order ${created.orderNumber} created.`,
      );
      setCreateForm(initialCreateState);
      await fetchOrders();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      setCreateError(
        extractApiError(err, 'Failed to create purchase order.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReceiveModal = (po: PresentationalOrder) => {
    setReceiveTarget(po);
    setReceiveNotes('');
    setReceiveError(null);
    setShowReceiveModal(true);
  };

  const closeReceiveModal = () => {
    if (busyOrderId !== null) return;
    setShowReceiveModal(false);
    setReceiveTarget(null);
    setReceiveNotes('');
    setReceiveError(null);
  };

  const handleReceive = async () => {
    if (!receiveTarget) return;
    setBusyOrderId(receiveTarget.id);
    setReceiveError(null);
    setActionError(null);
    setActionSuccess(null);
    try {
      const payload: ReceivePurchaseOrderPayload = receiveNotes.trim()
        ? { notes: receiveNotes.trim() }
        : {};
      await procurementService.receivePurchaseOrder(receiveTarget.id, payload);
      setActionSuccess(
        `Purchase order ${receiveTarget.poNumber} marked as received.`,
      );
      setShowReceiveModal(false);
      setReceiveTarget(null);
      setReceiveNotes('');
      await fetchOrders();
    } catch (err: unknown) {
      setReceiveError(extractApiError(err, 'Failed to receive purchase order.'));
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Purchase Order Management"
        description="Tracking issued orders, delivery status, and financial disbursement authorization"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchOrders()}
              disabled={loading}
              data-testid="purchase-orders-refresh"
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              title="Refresh purchase orders"
            >
              <RefreshCw
                className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
            <ReportExportButton
              label="Export PO register"
              sensitive
              requiresReason
            />
            <button
              type="button"
              onClick={openCreateModal}
              data-testid="purchase-orders-create"
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all"
            >
              <FilePlus className="h-4 w-4" /> New Purchase Order
            </button>
          </div>
        }
      />

      {actionSuccess && (
        <div
          role="status"
          data-testid="purchase-orders-action-success"
          className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-800 font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          data-testid="purchase-orders-action-error"
          className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-800 font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          {actionError}
        </div>
      )}

      {fetchError && (
        <div
          role="alert"
          data-testid="purchase-orders-fetch-error"
          className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-800 font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div
              data-testid="purchase-orders-loading"
              className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-500 text-xs"
            >
              Loading purchase orders…
            </div>
          ) : presentational.length === 0 ? (
            <div
              data-testid="purchase-orders-empty"
              className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-400 text-xs"
            >
              No purchase orders yet. Use <strong>New Purchase Order</strong>{' '}
              to create one from an approved purchase request.
            </div>
          ) : (
            <PurchaseOrderTable
              orders={presentational}
              onReceive={openReceiveModal}
              busyOrderId={busyOrderId}
            />
          )}

          {orders.length > 0 ? (
            <div
              data-testid="purchase-orders-summary"
              className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Sent
                </p>
                <p className="text-lg font-black text-amber-600" data-testid="purchase-orders-stat-sent">
                  {statusCount.sent}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Received
                </p>
                <p className="text-lg font-black text-emerald-600" data-testid="purchase-orders-stat-received">
                  {statusCount.received}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Draft
                </p>
                <p className="text-lg font-black text-indigo-600" data-testid="purchase-orders-stat-draft">
                  {statusCount.draft}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Cancelled
                </p>
                <p className="text-lg font-black text-slate-500" data-testid="purchase-orders-stat-cancelled">
                  {statusCount.cancelled}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Truck className="h-4 w-4 text-indigo-500" />
              Receiving Workflow
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Only orders in <strong>Sent</strong> status can be marked as
              received. Receiving creates an immutable receiving record,
              increments stock, and writes an audit event.
            </p>
            <p
              className="text-[10px] text-slate-500 leading-relaxed font-medium"
              data-testid="current-user-context"
            >
              Acting as:{' '}
              <span className="text-slate-700 font-bold">
                {currentUserId ? `User ${shortId(currentUserId)}` : '—'}
              </span>
              {currentBranchId ? (
                <>
                  {' '}
                  · Branch{' '}
                  <span className="text-slate-700 font-bold">
                    {shortId(currentBranchId)}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">PO Integrity Notes</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Purchase orders are immutable once created. Supplier and
              purchase-request relationships are server-validated; the
              backend atomically claims the PR (APPROVED → ORDERED) on
              create, and the PO (SENT → RECEIVED) on receive.
            </p>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FilePlus className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  New Purchase Order
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isSubmitting}
                data-testid="purchase-orders-create-close"
                className="p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {createSuccess && (
                <div
                  role="status"
                  data-testid="purchase-orders-create-success"
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {createSuccess}
                </div>
              )}
              {createError && (
                <div
                  role="alert"
                  data-testid="purchase-orders-create-error"
                  className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {createError}
                </div>
              )}

              <p
                className="text-[10px] text-slate-500 font-semibold"
                data-testid="purchase-orders-create-branch"
              >
                Branch:{' '}
                <span className="text-slate-700">
                  {currentBranchId ? shortId(currentBranchId, 'unknown') : '—'}
                </span>{' '}
                <span className="text-slate-400">
                  (derived from your auth session; not editable)
                </span>
              </p>

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Supplier <span className="text-rose-500">*</span>
                </span>
                {suppliersLoading ? (
                  <p
                    data-testid="purchase-orders-create-supplier-loading"
                    className="mt-1 text-[10px] text-slate-400"
                  >
                    Loading suppliers…
                  </p>
                ) : suppliersError ? (
                  <p
                    role="alert"
                    data-testid="purchase-orders-create-supplier-error"
                    className="mt-1 text-[10px] text-rose-600"
                  >
                    {suppliersError}
                  </p>
                ) : (
                  <select
                    value={createForm.supplierId}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        supplierId: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    data-testid="purchase-orders-create-supplier"
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Approved Purchase Request{' '}
                  <span className="text-rose-500">*</span>
                </span>
                {approvedRequestsLoading ? (
                  <p
                    data-testid="purchase-orders-create-pr-loading"
                    className="mt-1 text-[10px] text-slate-400"
                  >
                    Loading approved purchase requests…
                  </p>
                ) : approvedRequestsError ? (
                  <p
                    role="alert"
                    data-testid="purchase-orders-create-pr-error"
                    className="mt-1 text-[10px] text-rose-600"
                  >
                    {approvedRequestsError}
                  </p>
                ) : (
                  <select
                    value={createForm.purchaseRequestId}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        purchaseRequestId: e.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    data-testid="purchase-orders-create-pr"
                    className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select an approved PR</option>
                    {approvedRequests.map((r) => (
                      <option key={r.id} value={r.id}>
                        {shortId(r.id, 'PR')} ·{' '}
                        {(r.items?.length ?? 0)} item
                        {(r.items?.length ?? 0) === 1 ? '' : 's'}
                        {r.reason ? ` · ${r.reason}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {approvedRequests.length === 0 &&
                !approvedRequestsLoading &&
                !approvedRequestsError ? (
                  <p
                    className="mt-1 text-[10px] text-amber-700"
                    data-testid="purchase-orders-create-pr-empty"
                  >
                    No approved purchase requests are available. Approve a
                    purchase request before creating a PO.
                  </p>
                ) : null}
              </label>

              <p className="text-[10px] text-slate-400 font-medium">
                The PO will atomically claim the selected PR (APPROVED → ORDERED)
                and generate a new order number on the server.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isSubmitting}
                className="btn bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isSubmitting}
                data-testid="purchase-orders-create-submit"
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating…' : 'Create Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceiveModal && receiveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Receive Purchase Order
                </h3>
              </div>
              <button
                type="button"
                onClick={closeReceiveModal}
                disabled={busyOrderId !== null}
                data-testid="purchase-orders-receive-close"
                className="p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {receiveError && (
                <div
                  role="alert"
                  data-testid="purchase-orders-receive-error"
                  className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {receiveError}
                </div>
              )}

              <p
                className="text-[10px] text-slate-700 font-bold"
                data-testid="purchase-orders-receive-target"
              >
                {receiveTarget.poNumber} · {receiveTarget.supplier}
              </p>

              <label className="block text-xs">
                <span className="font-bold text-slate-700">
                  Receiving notes (optional)
                </span>
                <textarea
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  disabled={busyOrderId !== null}
                  data-testid="purchase-orders-receive-notes"
                  rows={3}
                  placeholder="e.g. partial delivery, damaged carton, etc."
                  className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <p className="text-[10px] text-slate-500 font-medium">
                The server will atomically claim this PO (SENT → RECEIVED)
                and write a receiving record + audit event.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeReceiveModal}
                disabled={busyOrderId !== null}
                className="btn bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReceive()}
                disabled={busyOrderId !== null}
                data-testid="purchase-orders-receive-submit"
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {busyOrderId ? 'Receiving…' : 'Mark as Received'}
              </button>
            </div>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default PurchaseOrdersPage;
