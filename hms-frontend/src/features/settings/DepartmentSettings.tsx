import { useState } from "react";
import { SectionCard } from "../../components/ui/section-card";
import { HmsDashboardShell, HmsAuditFooter } from "../../components/hms-dashboard";
import { Layers, Plus, Power, Building2 } from "lucide-react";

interface Department {
  id: string;
  code: string;
  name: string;
  branch: string;
  isActive: boolean;
}

const mockDepts: Department[] = [
  { id: "1", code: "ER", name: "Emergency Room", branch: "Main Hospital", isActive: true },
  { id: "2", code: "OPD", name: "Outpatient Department", branch: "Main Hospital", isActive: true },
  { id: "3", code: "LAB", name: "Laboratory", branch: "Main Hospital", isActive: true },
  { id: "4", code: "RAD", name: "Radiology", branch: "Main Hospital", isActive: true },
  { id: "5", code: "PHAR", name: "Pharmacy", branch: "Main Hospital", isActive: true },
  { id: "6", code: "OPD-N", name: "Outpatient Department", branch: "Satellite Clinic – North", isActive: true },
  { id: "7", code: "LAB-S", name: "Laboratory", branch: "South Outpatient Center", isActive: false },
];

export const DepartmentSettings = () => {
  const [depts] = useState(mockDepts);

  return (
    <HmsDashboardShell
      widthTier="full"
      footer={<HmsAuditFooter dataSource="Department configuration (UI prototype - not persisted)" />}
    >
      <div className="space-y-6 animate-fade-in">
        <SectionCard title="Department Management">
          <div className="flex items-center justify-between mb-4 mt-4">
            <p className="text-xs text-slate-500">
              Departments are assigned to branches. Deactivate instead of deleting to preserve historical references.
            </p>
            <button className="btn btn-primary px-4 py-2 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Department
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full table-premium">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {depts.map((d) => (
                  <tr key={d.id}>
                    <td className="font-mono text-xs font-semibold text-indigo-600">{d.code}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">{d.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 className="h-3 w-3" /> {d.branch}
                      </div>
                    </td>
                    <td>
                      {d.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <Power className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Power className="h-3 w-3" /> Inactive
                        </span>
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
