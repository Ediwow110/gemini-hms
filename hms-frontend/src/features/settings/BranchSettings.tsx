import { useState } from "react";
import { SectionCard, FormField } from "../../components/ui/section-card";
import { Building2, MapPin, Clock, Phone, Plus, Power } from "lucide-react";

interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  hoursOpen: string;
  hoursClose: string;
  isActive: boolean;
}

const mockBranches: Branch[] = [
  {
    id: "1", code: "MAIN", name: "Main Hospital", address: "123 Health Ave, Medical City",
    phone: "+63 2 8123 4567", email: "main@hmscore.ph",
    hoursOpen: "06:00", hoursClose: "22:00", isActive: true,
  },
  {
    id: "2", code: "SAT", name: "Satellite Clinic – North", address: "456 Wellness Blvd, North District",
    phone: "+63 2 8765 4321", email: "north@hmscore.ph",
    hoursOpen: "08:00", hoursClose: "17:00", isActive: true,
  },
  {
    id: "3", code: "SOUTH", name: "South Outpatient Center", address: "789 Care St, South City",
    phone: "+63 2 8999 0000", email: "south@hmscore.ph",
    hoursOpen: "07:00", hoursClose: "19:00", isActive: false,
  },
];

export const BranchSettings = () => {
  const [branches] = useState(mockBranches);
  const [selected, setSelected] = useState<Branch | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionCard title="Branch Management">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500">
            Manage hospital branches. Branches cannot be permanently deleted — only deactivated.
          </p>
          <button className="btn btn-primary px-4 py-2 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Branch
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full table-premium">
            <thead>
              <tr>
                <th>Code</th>
                <th>Branch Name</th>
                <th>Contact</th>
                <th>Hours</th>
                <th>Status</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="cursor-pointer" onClick={() => setSelected(b)}>
                  <td className="font-mono text-xs font-semibold text-indigo-600">{b.code}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">{b.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {b.phone}
                    </div>
                  </td>
                  <td>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {b.hoursOpen} – {b.hoursClose}
                    </div>
                  </td>
                  <td>
                    {b.isActive ? (
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

      {/* Detail / Edit Panel */}
      {selected && (
        <SectionCard title={`Edit Branch: ${selected.name}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Branch Code" required>
              <input className="input font-mono" defaultValue={selected.code} />
            </FormField>
            <FormField label="Branch Name" required>
              <input className="input" defaultValue={selected.name} />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Address">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 mt-3" />
                  <textarea className="input min-h-[70px] py-3 flex-1" defaultValue={selected.address} />
                </div>
              </FormField>
            </div>
            <FormField label="Phone">
              <input className="input" defaultValue={selected.phone} />
            </FormField>
            <FormField label="Email">
              <input className="input" type="email" defaultValue={selected.email} />
            </FormField>
            <FormField label="Opening Time" required>
              <input className="input" type="time" defaultValue={selected.hoursOpen} />
            </FormField>
            <FormField label="Closing Time" required>
              <input className="input" type="time" defaultValue={selected.hoursClose} />
            </FormField>
            <FormField label="Status">
              <select className="input" defaultValue={selected.isActive ? "active" : "inactive"}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setSelected(null)}>Cancel</button>
            <button className="btn btn-primary px-6 py-2 text-sm">Save Changes</button>
          </div>
        </SectionCard>
      )}
    </div>
  );
};
