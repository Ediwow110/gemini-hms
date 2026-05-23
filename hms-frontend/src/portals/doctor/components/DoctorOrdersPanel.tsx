import { useState } from 'react';
import { ShoppingCart, Plus, Clock, CheckCircle, AlertCircle, X, Ban } from 'lucide-react';
import { usePatientOrders, useCreateClinicalOrder, useCancelClinicalOrder, useLabTestDefinitions } from '../../../hooks/use-clinical-workflow';
import axios from 'axios';

interface DoctorOrdersPanelProps {
  patientId: string;
  encounterId?: string;
  isLocked: boolean;
}

export const DoctorOrdersPanel = ({ patientId, encounterId, isLocked }: DoctorOrdersPanelProps) => {
  const { data: orders, isLoading: isLoadingOrders, error: ordersError } = usePatientOrders(patientId);
  const { data: labTests } = useLabTestDefinitions();
  const createOrderMutation = useCreateClinicalOrder();
  const cancelOrderMutation = useCancelClinicalOrder();

  const [orderType, setOrderType] = useState<'LAB' | 'IMAGING' | 'PROCEDURE' | 'SERVICE'>('LAB');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT'>('ROUTINE');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemsInput, setItemsInput] = useState<{ itemName: string; catalogCode?: string }[]>([]);
  const [newItemInput, setNewItemInput] = useState('');
  const [selectedLabTest, setSelectedLabTest] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleAddItem = () => {
    if (orderType === 'LAB' && selectedLabTest && selectedLabTest !== 'CUSTOM') {
      const test = labTests?.find(t => t.code === selectedLabTest);
      if (test) {
        if (itemsInput.some(i => i.catalogCode === test.code)) {
          setValidationError('Test already added');
          return;
        }
        setItemsInput([...itemsInput, { itemName: test.name, catalogCode: test.code }]);
        setSelectedLabTest('');
        setValidationError(null);
        return;
      }
    }

    const trimmed = newItemInput.trim();
    if (!trimmed) return;
    if (trimmed.length > 200) {
      setValidationError('Item name must be at most 200 characters');
      return;
    }
    setItemsInput([...itemsInput, { itemName: trimmed }]);
    setNewItemInput('');
    setValidationError(null);
  };

  const handleRemoveItem = (index: number) => {
    setItemsInput(itemsInput.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!encounterId) {
      setValidationError('No active encounter available');
      return;
    }

    if (itemsInput.length === 0 && !itemName.trim()) {
      setValidationError('At least one order item is required');
      return;
    }

    const items = itemsInput.length > 0
      ? itemsInput
      : [{ itemName: itemName.trim() }];

    try {
      await createOrderMutation.mutateAsync({
        patientId,
        encounterId,
        data: {
          orderType,
          priority,
          clinicalIndication: clinicalIndication.trim() || undefined,
          items,
        },
      });

      setOrderType('LAB');
      setPriority('ROUTINE');
      setClinicalIndication('');
      setItemName('');
      setItemsInput([]);
      setNewItemInput('');
    } catch {
      // Error state handled via mutation state
    }
  };

  const isForbidden = axios.isAxiosError(ordersError) &&
    (ordersError.response?.status === 403 || ordersError.response?.status === 401);

  if (ordersError && isForbidden) {
    return (
      <div data-patient-id={patientId} className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 text-rose-700">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs font-bold">Access Restricted</span>
        </div>
        <p className="text-xs text-slate-500">
          You do not have permission to view orders for this patient.
        </p>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div data-patient-id={patientId} className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3 text-rose-700">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs font-bold">Connection Error</span>
        </div>
        <p className="text-xs text-slate-500">
          Failed to load orders. Please verify your connection and try again.
        </p>
      </div>
    );
  }

  const isCreatePending = createOrderMutation.isPending;
  const createSuccess = createOrderMutation.isSuccess;

  return (
    <div data-patient-id={patientId} className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-indigo-500" />
          Diagnostic & Lab Orders
        </h3>
        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
          {orders?.length || 0} Active
        </span>
      </div>

      {/* Create Order Form */}
      {!isLocked && encounterId && (
        <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="order-type" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Order Type</label>
              <select
                id="order-type"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as typeof orderType)}
                className="w-full px-2 py-1.5 mt-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
              >
                <option value="LAB">Lab</option>
                <option value="IMAGING">Imaging</option>
                <option value="PROCEDURE">Procedure</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full px-2 py-1.5 mt-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="clinical-indication" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Clinical Indication</label>
            <input
              id="clinical-indication"
              type="text"
              value={clinicalIndication}
              onChange={(e) => setClinicalIndication(e.target.value)}
              placeholder="e.g. Suspected infection, routine monitoring..."
              maxLength={500}
              className="w-full px-3 py-1.5 mt-1 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Order Items</label>
            <div className="flex gap-2 mt-1">
              {orderType === 'LAB' && (
                <select
                  aria-label="Select lab test"
                  value={selectedLabTest}
                  onChange={(e) => setSelectedLabTest(e.target.value)}
                  disabled={isCreatePending}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 disabled:opacity-50"
                >
                  <option value="" disabled>Select a Lab Test...</option>
                  {labTests?.map((t) => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                  <option value="CUSTOM">Custom Test (Legacy Unlinked)</option>
                </select>
              )}
              {(orderType !== 'LAB' || selectedLabTest === 'CUSTOM') && (
                <input
                  type="text"
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
                  placeholder="Type test/procedure name..."
                  maxLength={200}
                  disabled={isCreatePending}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 disabled:opacity-50"
                />
              )}
              <button
                type="button"
                onClick={handleAddItem}
                aria-label="Add order item"
                disabled={isCreatePending || (orderType === 'LAB' && selectedLabTest !== 'CUSTOM' ? !selectedLabTest : !newItemInput.trim())}
                className="btn bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs px-2.5 py-1.5 rounded-lg font-bold disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>

            </div>
            {itemsInput.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {itemsInput.map((item, index) => (
                  <span key={index} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full">
                    {item.itemName}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={isCreatePending}
                      className="text-indigo-400 hover:text-rose-600 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="text-xs text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5" />
              {validationError}
            </div>
          )}

          {/* Mutation Error */}
          {createOrderMutation.isError && !validationError && (
            <div className="text-xs text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5" />
              Failed to create order. Please try again.
            </div>
          )}

          {/* Success State */}
          {createSuccess && (
            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg">
              <CheckCircle className="h-3.5 w-3.5" />
              Order created successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={isCreatePending || (itemsInput.length === 0 && !itemName.trim())}
            className="w-full btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded-lg font-extrabold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isCreatePending ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Order
              </>
            )}
          </button>
        </form>
      )}

      {/* No encounter message */}
      {!encounterId && !isLocked && (
        <div className="text-center py-4 text-slate-400 text-xs font-semibold bg-slate-50 rounded-xl">
          Open an encounter to place orders.
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {isLoadingOrders ? (
          <div className="text-center py-6 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
            <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Loading orders...
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-semibold">
            No diagnostic orders placed for this patient.
          </div>
        ) : (
          orders.map(order => {
            const isCancellable = ['DRAFT', 'PENDING', 'REQUESTED'].includes(order.status);
            return (
              <div
                key={order.id}
                className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-800">{order.orderNumber}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold">
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">{order.orderType || 'GENERAL'}</span>
                    <span>•</span>
                    <span>{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCancellable && !isLocked && (
                    <button
                      type="button"
                      onClick={() => { setCancelTarget(order.id); setCancelReason(''); setCancelError(null); }}
                      disabled={cancelOrderMutation.isPending}
                      className="text-[9px] font-extrabold px-2 py-0.5 rounded-md border bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Ban className="h-2.5 w-2.5" />
                      Cancel
                    </button>
                  )}
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                    order.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : order.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    <Clock className="h-2.5 w-2.5" />
                    {order.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-sm mx-4 space-y-4">
            <h4 className="font-bold text-sm text-slate-800">Cancel Order</h4>
            <p className="text-xs text-slate-500">
              This action will mark the order as <strong>CANCELLED</strong>. The original order and item history will be preserved.
            </p>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => { setCancelReason(e.target.value); setCancelError(null); }}
                maxLength={300}
                placeholder="Enter cancellation reason..."
                className="w-full px-3 py-1.5 mt-1 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 min-h-[60px] resize-none"
              />
              {cancelError && (
                <p className="text-xs text-rose-600 font-bold mt-1">{cancelError}</p>
              )}
            </div>
            {cancelOrderMutation.isError && (
              <div className="text-xs text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5" />
                Failed to cancel order. Please try again.
              </div>
            )}
            {cancelOrderMutation.isSuccess && (
              <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg">
                <CheckCircle className="h-3.5 w-3.5" />
                Order cancelled successfully.
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setCancelTarget(null); setCancelReason(''); setCancelError(null); cancelOrderMutation.reset(); }}
                disabled={cancelOrderMutation.isPending}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!cancelReason.trim()) {
                    setCancelError('Cancellation reason is required.');
                    return;
                  }
                  if (!encounterId || !cancelTarget) return;
                  setCancelError(null);
                  try {
                    await cancelOrderMutation.mutateAsync({
                      patientId,
                      encounterId,
                      orderId: cancelTarget,
                      data: { reason: cancelReason.trim() },
                    });
                  } catch {
                    // Error handled via mutation state
                  }
                }}
                disabled={cancelOrderMutation.isPending || !cancelReason.trim()}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
              >
                {cancelOrderMutation.isPending ? (
                  <span className="flex items-center gap-1">
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cancelling...
                  </span>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
