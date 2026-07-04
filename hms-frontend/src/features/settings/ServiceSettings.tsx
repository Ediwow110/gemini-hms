import { useState } from "react";
import { SectionCard } from "../../components/ui/section-card";
import { HmsDashboardShell, HmsAuditFooter } from "../../components/hms-dashboard";
import { Stethoscope, Plus, AlertTriangle, Package, AlertCircle } from "lucide-react";

interface Service {
  id: string;
  name: string;
  category: string;
  department: string;
  price: number;
  isActive: boolean;
  branches: string[];
}

const mockServices: Service[] = [
  { id: "1", name: "Complete Blood Count (CBC)", category: "Laboratory", department: "Laboratory", price: 350, isActive: true, branches: ["Main Hospital", "Satellite Clinic – North"] },
  { id: "2", name: "Urinalysis", category: "Laboratory", department: "Laboratory", price: 150, isActive: true, branches: ["Main Hospital"] },
  { id: "3", name: "Chest X-Ray (PA)", category: "Radiology", department: "Radiology", price: 800, isActive: true, branches: ["Main Hospital"] },
  { id: "4", name: "General Consultation", category: "Consultation", department: "OPD", price: 500, isActive: true, branches: ["Main Hospital", "Satellite Clinic – North"] },
  { id: "5", name: "ECG (12-Lead)", category: "Cardiology", department: "OPD", price: 600, isActive: false, branches: ["Main Hospital"] },
];

export const ServiceSettings = () => {
  const [services] = useState(mockServices);
  const [showPriceWarning, setShowPriceWarning] = useState(false);

  return (
    <HmsDashboardShell
      widthTier="full"
      footer={<HmsAuditFooter dataSource="Service catalog (UI prototype - not persisted)" />}
    >
      <div className="space-y-6 animate-fade-in">
        <div
          role="status"
          data-testid="service-settings-notice"
          className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex gap-3 items-center"
        >
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
          <p className="text-xs font-semibold text-amber-800">
            <span className="font-black uppercase tracking-wide mr-1">Sandbox Notice:</span>
            Service & Package Settings is a prototype admin view. The medical service catalog and pricing are fabricated demo examples — no real billing catalog is connected.
          </p>
        </div>
        <SectionCard title="Services & Packages">
          <div className="flex items-center justify-between mb-4 mt-4">
            <p className="text-xs text-slate-500">
              Define medical services and their pricing. Price changes apply only to future orders.
            </p>
            <div className="flex gap-2">
              <button className="btn btn-secondary px-4 py-2 text-xs gap-1.5">
                <Package className="h-3.5 w-3.5" /> Package Builder
              </button>
              <button className="btn btn-primary px-4 py-2 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Service
              </button>
            </div>
          </div>

          {/* Price edit warning */}
          {showPriceWarning && (
            <div className="flex items-start gap-3 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl animate-scale-in">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Price Change Warning</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Changing a service price will only affect new orders. Historical orders, invoices, and receipts will retain the price at the time of the transaction.
                </p>
              </div>
              <button className="text-amber-500 hover:text-amber-700 ml-auto" onClick={() => setShowPriceWarning(false)}>✕</button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full table-premium">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Price</th>
                  <th>Branches</th>
                  <th>Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">{s.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s.category}</span>
                    </td>
                    <td className="text-xs text-slate-500">{s.department}</td>
                    <td>
                      <button
                        className="font-mono text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                        onClick={() => setShowPriceWarning(true)}
                      >
                        ₱{s.price.toLocaleString()}
                      </button>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {s.branches.map((b) => (
                          <span key={b} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{b}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {s.isActive ? (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-ghost px-2 py-1 text-xs rounded-lg">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </HmsDashboardShell>
  );
};
