import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus, Truck } from "lucide-react";
import {
  fieldServiceService,
  type EligibleTechnicianDto,
  type ShipmentDto,
} from "../../../services/field-service.service";
import { HmsEmptyState, HmsLoadingSkeleton } from "../../../components/hms-dashboard";

const extractApiError = (error: unknown, fallback: string): string => {
  const apiError = error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const message = apiError.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  return message || apiError.message || fallback;
};

const shipmentLabel = (shipment: ShipmentDto): string => {
  const requestTitle = shipment.salesOrder.quote?.rfq?.title;
  const branchName = shipment.salesOrder.quote?.rfq?.branch?.name;
  const tracking = shipment.trackingNumber || `SHIP-${shipment.id.slice(0, 8)}`;
  return [tracking, requestTitle, branchName].filter(Boolean).join(" · ");
};

interface DeliveryJobsAdminViewProps {
  canAssignJobs: boolean;
  canUpdateShipment: boolean;
}

export const DeliveryJobsAdminView: React.FC<DeliveryJobsAdminViewProps> = ({
  canAssignJobs,
  canUpdateShipment,
}) => {
  const [shipments, setShipments] = useState<ShipmentDto[]>([]);
  const [technicians, setTechnicians] = useState<EligibleTechnicianDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    shipmentId: "",
    assignedUserId: "",
    notes: "",
  });

  const assignableShipments = useMemo(
    () =>
      shipments.filter((shipment) => {
        if (["DELIVERED", "CANCELLED"].includes(shipment.status)) return false;
        return !(shipment.deliveryJobs || []).some((job) =>
          ["ASSIGNED", "IN_PROGRESS"].includes(job.status),
        );
      }),
    [shipments],
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [shipmentRows, technicianRows] = await Promise.all([
        fieldServiceService.getShipments(),
        canAssignJobs
          ? fieldServiceService.getEligibleTechnicians()
          : Promise.resolve([]),
      ]);
      setShipments(shipmentRows);
      setTechnicians(technicianRows);
    } catch (error) {
      setLoadError(extractApiError(error, "Failed to load branch shipment data."));
    } finally {
      setIsLoading(false);
    }
  }, [canAssignJobs]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setMutationError(null);
    setFormData({
      shipmentId: assignableShipments[0]?.id || "",
      assignedUserId: technicians[0]?.id || "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleCreateJob = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.shipmentId || !formData.assignedUserId || isCreating) return;

    setIsCreating(true);
    setMutationError(null);
    try {
      await fieldServiceService.createDeliveryJob({
        shipmentId: formData.shipmentId,
        assignedUserId: formData.assignedUserId,
        notes: formData.notes.trim() || undefined,
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (error) {
      setMutationError(extractApiError(error, "Failed to dispatch delivery job."));
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: ShipmentDto["status"],
  ) => {
    setUpdatingId(id);
    setMutationError(null);
    try {
      await fieldServiceService.updateShipmentStatus(id, status);
      await fetchData();
    } catch (error) {
      setMutationError(extractApiError(error, "Failed to update shipment status."));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Branch Shipment Control
          </h3>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            Dispatch jobs only to eligible technicians in the selected branch.
          </p>
        </div>
        {canAssignJobs && (
          <button
            onClick={openCreateModal}
            disabled={assignableShipments.length === 0 || technicians.length === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            Dispatch New Job
          </button>
        )}
      </div>

      {mutationError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
          {mutationError}
        </div>
      )}

      {isLoading ? (
        <HmsLoadingSkeleton variant="table" rows={5} />
      ) : loadError ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-rose-100 bg-white p-12 text-center text-rose-500">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-bold">{loadError}</p>
          <button onClick={() => void fetchData()} className="text-xs font-black underline">
            Retry
          </button>
        </div>
      ) : shipments.length === 0 ? (
        <HmsEmptyState
          title="No shipments found"
          description="There are no shipments for the selected branch."
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tracking / Request</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Branch</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Technician</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shipments.map((shipment) => {
                const activeJob = (shipment.deliveryJobs || []).find((job) =>
                  ["ASSIGNED", "IN_PROGRESS"].includes(job.status),
                );
                return (
                  <tr key={shipment.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight text-slate-800">
                            {shipment.trackingNumber || `SHIP-${shipment.id.slice(0, 8)}`}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {shipment.salesOrder.quote?.rfq?.title || `Order ${shipment.salesOrder.id.slice(0, 8)}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">
                      {shipment.salesOrder.quote?.rfq?.branch?.name || "Selected branch"}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">
                      {activeJob?.assignedUser?.email || "Unassigned"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                        {shipment.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canUpdateShipment ? (
                        <select
                          value={shipment.status}
                          onChange={(event) =>
                            void handleUpdateStatus(
                              shipment.id,
                              event.target.value as ShipmentDto["status"],
                            )
                          }
                          disabled={updatingId === shipment.id}
                          aria-label={`Update ${shipmentLabel(shipment)} status`}
                          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-black uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="IN_TRANSIT">In Transit</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">
                          Read only
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {canAssignJobs && !isLoading && !loadError && technicians.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
          No active Field Technician is assigned to this branch. Create or update an operational user before dispatching.
        </div>
      )}

      {canAssignJobs && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateJob} className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Dispatch Delivery Job</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close dispatch dialog">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shipment</span>
                <select
                  required
                  value={formData.shipmentId}
                  onChange={(event) => setFormData((current) => ({ ...current, shipmentId: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {assignableShipments.map((shipment) => (
                    <option key={shipment.id} value={shipment.id}>{shipmentLabel(shipment)}</option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Field Technician</span>
                <select
                  required
                  value={formData.assignedUserId}
                  onChange={(event) => setFormData((current) => ({ ...current, assignedUserId: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>{technician.email}</option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dispatch Notes (optional)</span>
                <textarea
                  value={formData.notes}
                  onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {mutationError && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                  {mutationError}
                </p>
              )}
            </div>
            <div className="flex gap-3 border-t border-slate-100 p-6">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isCreating} className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-xs font-black uppercase text-slate-600 hover:bg-slate-200 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={isCreating || !formData.shipmentId || !formData.assignedUserId} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase text-white shadow-md hover:bg-indigo-700 disabled:opacity-50">
                {isCreating ? "Dispatching…" : "Dispatch Job"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DeliveryJobsAdminView;
