import React, { useState, useEffect } from "react";
import { Truck, Plus, Search, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { fieldServiceService, ShipmentDto } from "../../../services/field-service.service";
import { HmsLoadingSkeleton, HmsEmptyState } from "../../../components/hms-dashboard";


export const DeliveryJobsAdminView: React.FC = () => {
  const [shipments, setShipments] = useState<ShipmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerOrderId: "",
    address: "",
    technicianId: "",
  });

  const fetchShipments = async () => {
    setIsLoading(true);
    try {
      const data = await fieldServiceService.getShipments();
      setShipments(data);
      setError(null);
    } catch (err) {
      setError("Failed to load shipment data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fieldServiceService.createDeliveryJob(formData);
      setIsModalOpen(false);
      setFormData({ customerOrderId: "", address: "", technicianId: "" });
      await fetchShipments();
    } catch (err) {
      alert("Failed to create delivery job.");
    }
  };

  const handleUpdateStatus = async (id: string, status: ShipmentDto["status"]) => {
    setUpdatingId(id);
    try {
      await fieldServiceService.updateShipmentStatus(id, status);
      await fetchShipments();
    } catch (err) {
      alert("Failed to update shipment status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Administrative Shipment Control</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
        >
          <Plus className="h-3 w-3" />
          Dispatch New Job
        </button>
      </div>

      {isLoading ? (
        <HmsLoadingSkeleton variant="table" rows={5} />
      ) : error ? (
        <div className="p-12 text-center bg-white border border-rose-100 rounded-3xl text-rose-500 flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      ) : shipments.length === 0 ? (
        <HmsEmptyState title="No shipments found" description="There are currently no shipments in the system." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking / Order</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrier</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.trackingNumber || `SHIP-${s.id.substring(0, 4)}`}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Order: {s.salesOrder.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-slate-600">{s.carrier || "Internal Logistics"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase border ${
                      s.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      s.status === "SHIPPED" || s.status === "IN_TRANSIT" ? "bg-blue-100 text-blue-700 border-blue-200" :
                      "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={s.status}
                      onChange={(e) => handleUpdateStatus(s.id, e.target.value as ShipmentDto["status"])}
                      disabled={updatingId === s.id}
                      className="bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="SHIPPED">Shipped</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="DELIVERED">Delivered</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Dispatch New Shipment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Order ID</label>
                <input
                  required
                  type="text"
                  value={formData.customerOrderId}
                  onChange={(e) => setFormData({ ...formData, customerOrderId: e.target.value })}
                  placeholder="ORD-XXXX"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Address</label>
                <input
                  required
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Health St, Medical District"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Technician ID</label>
                <input
                  required
                  type="text"
                  value={formData.technicianId}
                  onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                  placeholder="TECH-XXXX"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-indigo-700 transition-colors shadow-md"
                >
                  Dispatch Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryJobsAdminView;
