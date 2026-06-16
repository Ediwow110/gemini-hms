import { useParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { AlertTriangle, FlaskConical } from "lucide-react";

export const InventoryDetail = () => {
  const { id } = useParams();

  const breadcrumbs = [
    { label: "Inventory", to: "/inventory" },
    { label: id ? `Item ${id.slice(0, 8)}` : "Unknown Item", current: true }
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title={id ? `Item ${id.slice(0, 8)}` : "Inventory Item"}
        description="Detail view for inventory item."
        backFallback="/inventory"
        backLabel="Back to Inventory"
        breadcrumbs={breadcrumbs}
      />
      
      <div className="card p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-bold mb-1">Inventory item detail endpoint not yet available.</p>
          <p>
            The backend exposes catalog listing (<code className="font-mono text-[11px]">GET /api/v1/inventory/catalog</code>),
            stock logs, low-stock alerts, and mutation endpoints, but no single-item
            detail endpoint (<code className="font-mono text-[11px]">GET /api/v1/inventory/items/:id</code>).
            This detail page will be wired once the backend endpoint is added.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
            <FlaskConical className="h-4 w-4" />
            <span>No mock data is being displayed. Item identity is preserved in the URL but the detail cannot be rendered yet.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
