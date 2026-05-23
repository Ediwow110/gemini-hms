import { useState } from "react";
import { useUser } from "../../hooks/use-user";
import { usePrescriptionQueue, useDrugCatalog, useDispenseMedication } from "../../hooks/use-pharmacy";
import { PageHeader } from "../../components/ui/page-header";
import {
  Pill,
  AlertTriangle,
  TrendingDown,
  Truck,
  PackageCheck,
  RotateCw,
  Building,
  XCircle,
} from "lucide-react";

export const PharmacyHub = () => {
  const user = useUser();
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = usePrescriptionQueue("ACTIVE");
  const { data: stock, isLoading: stockLoading, refetch: refetchStock } = useDrugCatalog();
  const dispenseMutation = useDispenseMedication();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [dispenseQuantity, setDispenseQuantity] = useState<number>(1);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedOrder = orders?.find((o) => o.id === selectedOrderId);
  const drugItems = (stock || []).filter((item) => item.type === "DRUG");

  const getMatchingDrugs = (medicationName: string) => {
    const name = medicationName.toLowerCase();
    return drugItems.filter(
      (item) =>
        item.name.toLowerCase().includes(name) ||
        item.sku.toLowerCase().includes(name),
    );
  };

  const handleOpenDispense = (orderId: string) => {
    setErrorMessage(null);
    setSelectedOrderId(orderId);
    const order = orders?.find((o) => o.id === orderId);
    if (order) {
      const matches = getMatchingDrugs(order.medicationName);
      if (matches.length > 0) {
        setSelectedItemId(matches[0].id);
        setDispenseQuantity(1);
      } else {
        setSelectedItemId("");
        setDispenseQuantity(1);
      }
    }
    setShowDispenseModal(true);
  };

  const handleConfirmDispense = async () => {
    if (!selectedOrderId || !selectedItemId) return;

    setErrorMessage(null);
    const orderForDispense = orders?.find((o) => o.id === selectedOrderId);
    try {
      await dispenseMutation.mutateAsync({
        prescriptionId: selectedOrderId,
        data: {
          version: orderForDispense?.version ?? 0,
          inventoryItemId: selectedItemId,
          quantity: dispenseQuantity,
        },
      });
      setShowDispenseModal(false);
      setSelectedOrderId(null);
      setSelectedItemId("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to dispense medication";
      setErrorMessage(msg);
    }
  };

  const getStockForItem = (itemId: string) => {
    return stock?.find((s) => s.id === itemId);
  };

  if (ordersLoading || stockLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Pharmacy Dispensing Hub"
          description="View active prescriptions and dispense medications to patients."
        />
        <button
          onClick={() => { refetchOrders(); refetchStock(); }}
          className="btn btn-secondary flex items-center gap-1.5 text-xs py-2"
        >
          <RotateCw className="h-3.5 w-3.5" /> Reload
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
              <Pill className="h-4 w-4 text-indigo-500" />
              Active Prescriptions
            </h3>
            <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Building className="h-3 w-3" /> Branch: {user?.branchId || "N/A"}
            </span>
          </div>

          {!orders || orders.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No active prescriptions awaiting dispensing.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-500 uppercase">Patient</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 uppercase">Medication</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const matches = getMatchingDrugs(order.medicationName);
                    const hasStock = matches.some((m) => {
                      const s = getStockForItem(m.id);
                      return s && s.quantity > 0;
                    });

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{order.patientName}</p>
                          <p className="text-[10px] text-slate-400">
                            {order.patientNumber} &middot; Rx: {order.id.slice(0, 8)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-700">{order.medicationName}</p>
                          <p className="text-[10px] text-slate-500">
                            {order.dosage} &middot; {order.frequency} &middot; {order.duration}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                            PENDING
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenDispense(order.id)}
                            disabled={!hasStock}
                            className={`btn text-[10px] font-bold px-3 py-1.5 ${
                              hasStock
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            }`}
                          >
                            Dispense
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
              <Truck className="h-4 w-4 text-indigo-500" />
              Drug Stock Ledger
            </h3>
            <span className="bg-amber-50 border border-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Live Stock Levels
            </span>
          </div>

          {!stock || stock.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No drug catalog data available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-500 uppercase">Item</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 uppercase">SKU</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-right">Stock</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-right">Reorder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(stock || [])
                    .filter((item) => item.type === "DRUG")
                    .map((item) => {
                      const isLow = item.quantity < item.reorderLevel;
                      const isOut = item.quantity === 0;

                      const bgClass = isOut
                        ? "bg-rose-50/40 hover:bg-rose-50/60"
                        : isLow
                          ? "bg-amber-50/40 hover:bg-amber-50/60"
                          : "hover:bg-slate-50/50";

                      return (
                        <tr key={item.id} className={`${bgClass} transition-colors`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  isOut ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                              />
                              <p className="font-bold text-slate-800">{item.name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            {item.quantity} {item.unit}
                            {isLow && (
                              <span className="block text-[9px] text-amber-600 font-semibold flex items-center justify-end gap-0.5">
                                <TrendingDown className="h-3 w-3" /> Low Stock
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400 font-bold">
                            {item.reorderLevel}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDispenseModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-slide-up">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-indigo-600" />
                Dispense Medication
              </h3>
              <button
                onClick={() => setShowDispenseModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-800">{selectedOrder.patientName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Medication:</span>
                <span className="font-bold text-slate-800">
                  {selectedOrder.medicationName} ({selectedOrder.dosage})
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Prescribed:</span>
                <span className="font-bold text-slate-800">
                  {selectedOrder.frequency} &middot; {selectedOrder.duration}
                </span>
              </div>

              <div className="border-t pt-3 border-slate-200/60 space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Inventory Item</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select drug...</option>
                    {getMatchingDrugs(selectedOrder.medicationName).map((item) => {
                      const s = getStockForItem(item.id);
                      return (
                        <option key={item.id} value={item.id}>
                          {item.name} ({s?.quantity || 0} {item.unit} available)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Dispense Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={dispenseQuantity}
                    onChange={(e) => setDispenseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>

                {selectedItemId && (() => {
                  const s = getStockForItem(selectedItemId);
                  if (!s) return null;
                  return (
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">New Remaining:</span>
                      <span className={s.quantity - dispenseQuantity < 0 ? "text-rose-600" : "text-indigo-600"}>
                        {s.quantity - dispenseQuantity} {s.unit}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {errorMessage && (
              <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3">
                {errorMessage}
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
              Confirming will update the prescription status to DISPENSED, create a StockLog entry,
              and decrement the inventory quantity for this branch. This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={dispenseMutation.isPending}
                onClick={() => setShowDispenseModal(false)}
                className="btn btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                disabled={dispenseMutation.isPending || !selectedItemId}
                onClick={handleConfirmDispense}
                className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 flex items-center gap-1"
              >
                {dispenseMutation.isPending ? "Processing..." : "Confirm & Dispense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
