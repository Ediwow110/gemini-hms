import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  PurchaseRequestQueue,
  type PurchaseRequest as PresentationalRequest,
} from './components/PurchaseRequestQueue';
import {
  FilePlus,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Trash2,
} from 'lucide-react';
import { HmsDashboardShell } from '../../components/hms-dashboard';
import { HmsPageHeader } from '../../components/hms-page';
import { useAuth } from '../../hooks/use-user';
import {
  procurementService,
  type PurchaseRequest,
  type CreatePurchaseRequestPayload,
  type PurchaseRequestItem,
} from '../../services/procurement.service';

interface CreateItemRow {
  sku: string;
  quantity: string;
  unitPrice: string;
}

const initialItemRow: CreateItemRow = { sku: '', quantity: '1', unitPrice: '0' };

const initialItems: CreateItemRow[] = [{ ...initialItemRow }];

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

const firstItemSummary = (items: PurchaseRequestItem[]): string => {
  if (!items || items.length === 0) return 'No items';
  const first = items[0];
  const count = items.length;
  const qty = first.quantity ?? 0;
  if (count === 1) {
    return `${first.sku} · qty ${qty}`;
  }
  return `${count} items · first: ${first.sku} · qty ${qty}`;
};

const mapRequest = (
  req: PurchaseRequest,
  currentUserId: string | null,
  currentUserIsSuperAdmin: boolean,
): PresentationalRequest => {
  const isOwnRequest = currentUserId != null && req.requestedById === currentUserId;
  const canApproveByStatus =
    req.status === 'SUBMITTED' || req.status === 'PENDING';
  const canApprove =
    canApproveByStatus && (currentUserIsSuperAdmin || !isOwnRequest);

  let approverBlockedReason: string | undefined;
  if (!canApproveByStatus) {
    approverBlockedReason = `Cannot approve a request with status ${req.status}`;
  } else if (isOwnRequest && !currentUserIsSuperAdmin) {
    approverBlockedReason = 'You cannot approve your own request';
  }

  return {
    id: req.id,
    item: firstItemSummary(req.items ?? []),
    itemCount: (req.items ?? []).length,
    requestedBy: `Requester ${shortId(req.requestedById, '—')}`,
    branch: `Branch ${shortId(req.branchId, '—')}`,
    status: req.status,
    date: formatDate(req.createdAt),
    canApprove,
    approverBlockedReason,
  };
};

export const PurchaseRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const currentUserIsSuperAdmin = Boolean(
    user?.roles?.includes('Super Admin'),
  );
  const currentBranchId = user?.branchId ?? null;

  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createItems, setCreateItems] = useState<CreateItemRow[]>(initialItems);
  const [createReason, setCreateReason] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await procurementService.listPurchaseRequests();
      setRequests(list);
    } catch (err: unknown) {
      setFetchError(extractApiError(err, 'Failed to load purchase requests.'));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const presentational = useMemo(
    () =>
      requests.map((r) =>
        mapRequest(r, currentUserId, currentUserIsSuperAdmin),
      ),
    [requests, currentUserId, currentUserIsSuperAdmin],
  );

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'SUBMITTED' || r.status === 'PENDING').length,
    [requests],
  );
  const approvedCount = useMemo(
    () => requests.filter((r) => r.status === 'APPROVED').length,
    [requests],
  );
  const rejectedCount = useMemo(
    () => requests.filter((r) => r.status === 'REJECTED').length,
    [requests],
  );
  const orderedCount = useMemo(
    () => requests.filter((r) => r.status === 'ORDERED').length,
    [requests],
  );

  const handleApprove = async (req: PresentationalRequest) => {
    setBusyRequestId(req.id);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await procurementService.approvePurchaseRequest(req.id);
      setActionSuccess(
        `Purchase request ${shortId(updated.id, 'PR')} approved.`,
      );
      await fetchRequests();
    } catch (err: unknown) {
      setActionError(
        extractApiError(err, 'Failed to approve purchase request.'),
      );
    } finally {
      setBusyRequestId(null);
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateItems([{ ...initialItemRow }]);
    setCreateReason('');
    setCreateError(null);
    setCreateSuccess(null);
  };

  const closeCreateModal = () => {
    if (isSubmitting) return;
    setShowCreateModal(false);
    setCreateItems([{ ...initialItemRow }]);
    setCreateReason('');
    setCreateError(null);
    setCreateSuccess(null);
  };

  const addItemRow = () => {
    setCreateItems((rows) => [...rows, { ...initialItemRow }]);
  };

  const removeItemRow = (index: number) => {
    setCreateItems((rows) => {
      if (rows.length === 1) return rows;
      return rows.filter((_, i) => i !== index);
    });
  };

  const updateItemRow = (
    index: number,
    field: keyof CreateItemRow,
    value: string,
  ) => {
    setCreateItems((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const validateCreateForm = (): string | null => {
    if (!currentBranchId) {
      return 'No branch context is available for your account. Cannot create a purchase request.';
    }
    if (createItems.length === 0) {
      return 'Add at least one item to the request.';
    }
    for (let i = 0; i < createItems.length; i += 1) {
      const row = createItems[i];
      if (!row.sku.trim()) {
        return `Item ${i + 1}: SKU is required.`;
      }
      const qty = Number(row.quantity);
      if (!Number.isFinite(qty) || qty < 1) {
        return `Item ${i + 1}: quantity must be at least 1.`;
      }
      const price = Number(row.unitPrice);
      if (!Number.isFinite(price) || price < 0) {
        return `Item ${i + 1}: unit price must be 0 or greater.`;
      }
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
      const items: PurchaseRequestItem[] = createItems.map((row) => ({
        sku: row.sku.trim(),
        quantity: Number(row.quantity),
        unitPrice: Number(row.unitPrice),
      }));
      const payload: CreatePurchaseRequestPayload = {
        branchId: currentBranchId,
        items,
        ...(createReason.trim() ? { reason: createReason.trim() } : {}),
      };
      const created = await procurementService.createPurchaseRequest(payload);
      setCreateSuccess(
        `Purchase request ${shortId(created.id, 'PR')} created.`,
      );
      setCreateItems([{ ...initialItemRow }]);
      setCreateReason('');
      await fetchRequests();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      setCreateError(
        extractApiError(err, 'Failed to create purchase request.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <HmsDashboardShell widthTier="full">
      <HmsPageHeader
        title="Internal Purchase Requests"
        description="Review and approve department requisitions for stock and equipment"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchRequests()}
              disabled={loading}
              data-testid="purchase-requests-refresh"
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              title="Refresh purchase requests"
            >
              <RefreshCw
                className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              data-testid="purchase-requests-create"
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 transition-all"
            >
              <Plus className="h-4 w-4" /> Create Requisition
            </button>
          </div>
        }
      />

      {actionSuccess && (
        <div
          role="status"
          data-testid="purchase-requests-action-success"
          className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-800 font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          data-testid="purchase-requests-action-error"
          className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-800 font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          {actionError}
        </div>
      )}

      {fetchError && (
        <div
          role="alert"
          data-testid="purchase-requests-fetch-error"
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
              data-testid="purchase-requests-loading"
              className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-500 text-xs"
            >
              Loading purchase requests…
            </div>
          ) : presentational.length === 0 ? (
            <div
              data-testid="purchase-requests-empty"
              className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center text-slate-400 text-xs"
            >
              No purchase requests yet. Use <strong>Create Requisition</strong> to add one.
            </div>
          ) : (
            <PurchaseRequestQueue
              requests={presentational}
              onApprove={handleApprove}
              busyRequestId={busyRequestId}
            />
          )}

          {requests.length > 0 ? (
            <div
              data-testid="purchase-requests-summary"
              className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Pending
                </p>
                <p className="text-lg font-black text-amber-600" data-testid="purchase-requests-stat-pending">
                  {pendingCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Approved
                </p>
                <p className="text-lg font-black text-emerald-600" data-testid="purchase-requests-stat-approved">
                  {approvedCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Rejected
                </p>
                <p className="text-lg font-black text-rose-600" data-testid="purchase-requests-stat-rejected">
                  {rejectedCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Ordered
                </p>
                <p className="text-lg font-black text-indigo-600" data-testid="purchase-requests-stat-ordered">
                  {orderedCount}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FilePlus className="h-4 w-4 text-indigo-500" />
              Budget Verification
            </h4>
            <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
              <p className="text-[10px] text-slate-400 font-medium">
                Budget commitment data is not yet available from the current backend release.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Current Q2 Dept Budget</span>
                <span className="text-slate-300" data-testid="budget-no-data">
                  —
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-500">Committed (Pending)</span>
                <span className="text-slate-300">—</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Approval Policy</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Requests over ₱50,000 require CFO approval. Urgent medical supplies may bypass standard quote cycles if a pre-accredited vendor is used.
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
                  Create Requisition
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isSubmitting}
                data-testid="purchase-requests-create-close"
                className="p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {createSuccess && (
                <div
                  role="status"
                  data-testid="purchase-requests-create-success"
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {createSuccess}
                </div>
              )}
              {createError && (
                <div
                  role="alert"
                  data-testid="purchase-requests-create-error"
                  className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {createError}
                </div>
              )}

              <p
                className="text-[10px] text-slate-500 font-semibold"
                data-testid="purchase-requests-create-branch"
              >
                Branch:{' '}
                <span className="text-slate-700">
                  {currentBranchId ? shortId(currentBranchId, 'unknown') : '—'}
                </span>{' '}
                <span className="text-slate-400">
                  (derived from your auth session; not editable)
                </span>
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Items <span className="text-rose-500">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    disabled={isSubmitting}
                    data-testid="purchase-requests-add-item"
                    className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer disabled:opacity-50"
                  >
                    + Add item
                  </button>
                </div>

                {createItems.map((row, index) => (
                  <div
                    key={`row-${index}`}
                    className="grid grid-cols-12 gap-2 items-start"
                    data-testid={`purchase-requests-item-row-${index}`}
                  >
                    <label className="col-span-5 text-[10px] font-bold text-slate-600">
                      SKU
                      <input
                        type="text"
                        value={row.sku}
                        onChange={(e) =>
                          updateItemRow(index, 'sku', e.target.value)
                        }
                        disabled={isSubmitting}
                        data-testid={`purchase-requests-item-sku-${index}`}
                        placeholder="e.g. CBC-REAGENT-500"
                        className="mt-1 w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </label>
                    <label className="col-span-2 text-[10px] font-bold text-slate-600">
                      Qty
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) =>
                          updateItemRow(index, 'quantity', e.target.value)
                        }
                        disabled={isSubmitting}
                        data-testid={`purchase-requests-item-qty-${index}`}
                        className="mt-1 w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </label>
                    <label className="col-span-4 text-[10px] font-bold text-slate-600">
                      Unit price
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.unitPrice}
                        onChange={(e) =>
                          updateItemRow(index, 'unitPrice', e.target.value)
                        }
                        disabled={isSubmitting}
                        data-testid={`purchase-requests-item-price-${index}`}
                        className="mt-1 w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </label>
                    <div className="col-span-1 flex items-end justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        disabled={isSubmitting || createItems.length === 1}
                        data-testid={`purchase-requests-item-remove-${index}`}
                        title={
                          createItems.length === 1
                            ? 'At least one item is required'
                            : 'Remove item'
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <label className="block text-xs">
                <span className="font-bold text-slate-700">Reason (optional)</span>
                <textarea
                  value={createReason}
                  onChange={(e) => setCreateReason(e.target.value)}
                  disabled={isSubmitting}
                  data-testid="purchase-requests-create-reason"
                  rows={2}
                  placeholder="Brief context for this requisition"
                  className="mt-1 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
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
                data-testid="purchase-requests-create-submit"
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Requisition'}
              </button>
            </div>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default PurchaseRequestsPage;
