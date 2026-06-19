import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { Badge } from "../../components/ui/badge";
import { PlusCircle, Package, AlertTriangle, AlertOctagon } from "lucide-react";
import { RequirePermission } from "../../components/ui/RequirePermission";
import { useInventoryCatalog } from "../../hooks/use-inventory";
import { HmsLoadingSkeleton, HmsEmptyState } from "../../components/hms-dashboard";
import type { InventoryCatalogItem } from "../../services/inventory.service";

const computeStatus = (item: InventoryCatalogItem): "Critical" | "Low" | "In Stock" => {
  if (item.stock === 0) return "Critical";
  if (item.stock <= item.reorderLevel) return "Low";
  return "In Stock";
};

export const Inventory = () => {
  const navigate = useNavigate();
  const { data: items, isLoading, error } = useInventoryCatalog();

  const statusBadge = (label: string) => {
    const styles: Record<string, string> = {
      Critical: "bg-rose-50 text-rose-700 border border-rose-200/60",
      Low: "bg-amber-50 text-amber-700 border border-amber-200/60",
      "In Stock": "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    };
    const dots: Record<string, string> = {
      Critical: "bg-rose-500",
      Low: "bg-amber-500",
      "In Stock": "bg-emerald-500",
    };
    return (
      <Badge className={styles[label] || "bg-slate-100"}>
        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${dots[label] || "bg-slate-400"}`} />
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader title="Inventory & Stock" description="Monitor stock levels, units, and movements." />
        <HmsLoadingSkeleton variant="kpi" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader title="Inventory & Stock" description="Monitor stock levels, units, and movements." />
        <div
          role="alert"
          data-testid="inventory-error"
          className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800"
        >
          <p className="font-bold mb-1">Failed to load inventory catalog</p>
          <p>The server did not return the inventory catalog. Please retry or contact your administrator.</p>
        </div>
      </div>
    );
  }

  const list = items ?? [];
  const totalItems = list.length;
  const lowStockCount = list.filter((i) => i.stock > 0 && i.stock <= i.reorderLevel).length;
  const criticalCount = list.filter((i) => i.stock === 0).length;
  const lowStockItems = list.filter((i) => i.stock <= i.reorderLevel);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex justify-between items-center">
        <PageHeader title="Inventory & Stock" description="Monitor stock levels, units, and movements." />
        <RequirePermission permission="inventory.stock.receive">
          <button
            onClick={() => navigate("/inventory/receiving")}
            className="btn btn-primary flex items-center gap-2 px-5 py-2.5"
          >
            <PlusCircle className="h-4 w-4" />
            Receive Stock
          </button>
        </RequirePermission>
      </div>

      {list.length === 0 ? (
        <HmsEmptyState
          title="No inventory items found"
          description="There are no inventory items in this branch yet."
        />
      ) : (
        <>
          {lowStockItems.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-4 items-start shadow-sm shadow-rose-100 animate-slide-up">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-rose-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Low-Stock Action Required</h3>
                <p className="text-sm text-rose-600 mt-1">
                  There are {lowStockItems.length} item(s) currently below their designated reorder levels. Please create purchase orders immediately to avoid operational disruption.
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="card-hover p-5 text-center animate-slide-up stagger-1">
              <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md flex items-center justify-center mb-3">
                <Package className="h-5 w-5 text-white" />
              </div>
              <p
                data-testid="inventory-stat-total"
                className="text-2xl font-extrabold text-slate-900"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {totalItems}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Items</p>
            </div>
            <div className="card-hover p-5 text-center animate-slide-up stagger-2">
              <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md flex items-center justify-center mb-3">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <p
                data-testid="inventory-stat-low"
                className="text-2xl font-extrabold text-slate-900"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {lowStockCount}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Low Stock</p>
            </div>
            <div className="card-hover p-5 text-center animate-slide-up stagger-3">
              <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-md flex items-center justify-center mb-3">
                <AlertOctagon className="h-5 w-5 text-white" />
              </div>
              <p
                data-testid="inventory-stat-critical"
                className="text-2xl font-extrabold text-slate-900"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {criticalCount}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Critical</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((item) => {
                  const label = computeStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors duration-150 cursor-pointer group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.category}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{item.sku || "—"}</td>
                      <td
                        className={`px-6 py-4 font-bold ${
                          item.stock <= item.reorderLevel ? "text-rose-600" : "text-slate-900"
                        }`}
                      >
                        {item.stock}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{item.unit}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">{statusBadge(label)}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/inventory/${item.id}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
