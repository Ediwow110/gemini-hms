import { PlusCircle, Search } from "lucide-react";
import { PageHeader } from "../../components/ui/page-header";
import { ReportExportButton } from "../../components/analytics/ReportExportButton";
import { StatusBadge } from "../../components/ui/status-badge";
import { HmsDashboardShell, HmsAuditFooter } from "../../components/hms-dashboard";
import { useNavigate } from "react-router-dom";

export const PatientList = () => {
  const navigate = useNavigate();
  const mockPatients = [
    { id: "P001", name: "John Doe", age: 45, gender: "M", category: "Outpatient", balance: 0, status: "Active" },
    { id: "P002", name: "Jane Smith", age: 32, gender: "F", category: "Inpatient", balance: 150, status: "Unpaid" },
  ];


  return (
    <HmsDashboardShell
      widthTier="full"
      footer={<HmsAuditFooter dataSource="Mock patient list (sandbox)" />}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <PageHeader title="Patients (Mock)" description="Manage and view all registered patients." />
          <div className="flex gap-2">
            <ReportExportButton label="Export patient CSV" sensitive requiresReason />
            <button onClick={() => navigate('/patients/new')} className="btn btn-primary flex items-center gap-2 px-5 py-2.5">
              <PlusCircle className="h-4 w-4" />
              Register Patient
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800" data-testid="patient-list-sandbox-notice">
          <strong>Sandbox Notice:</strong> The patient rows, balances, and statuses shown below are mock placeholder data, not real patient records. The names &ldquo;John Doe&rdquo; and &ldquo;Jane Smith&rdquo; are intentionally fake. The live patient registration flow is at the <strong>Register Patient</strong> button above, which navigates to the nurse intake page. The export button is disabled until a governed backend export endpoint with reason capture and audit logging exists.
        </div>

        {/* Search & Filter */}
        <div className="card p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300"
            />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockPatients.map((p) => {
                const initials = p.name.split(" ").map(n => n[0]).join("");
                return (
                  <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors duration-150 cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:from-indigo-100 group-hover:to-violet-100 group-hover:text-indigo-700 transition-all duration-200">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.id} · {p.age}Y · {p.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200/60">
                        {p.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-bold ${p.balance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      ₱{p.balance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <StatusBadge status={p.status} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </HmsDashboardShell>
  );
};
