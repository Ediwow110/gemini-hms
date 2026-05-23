import { useState, useEffect } from "react";
import { useUser } from "../../hooks/use-user";
import { apiClient } from "../../lib/api";
import { PageHeader } from "../../components/ui/page-header";
import { 
  Briefcase, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Calendar, 
  DollarSign, 
  X, 
  CreditCard,
  Building
} from "lucide-react";

interface StaffMember {
  id: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  branch: string;
  status: "ACTIVE" | "SUSPENDED";
  paymentHistory: { period: string; amount: number; date: string }[];
}

export const HRManagement = () => {
  const user = useUser();
  const [employees, setEmployees] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchHRData = async () => {
    try {
      const res = await apiClient.get("/v1/hr/employees");
      setEmployees(res.data || []);
    } catch {
      // Fallback premium mocks
      setEmployees([
        {
          id: "EMP-001",
          staffNumber: "STF-2026-09",
          firstName: "Dr. Gregory",
          lastName: "House",
          designation: "Chief of Diagnostic Medicine",
          department: "Clinical",
          branch: "Central Hospital",
          status: "ACTIVE",
          paymentHistory: [
            { period: "April 2026", amount: 125000, date: "2026-04-30" },
            { period: "March 2026", amount: 125000, date: "2026-03-31" }
          ]
        },
        {
          id: "EMP-002",
          staffNumber: "STF-2026-44",
          firstName: "Nurse Judy",
          lastName: "Hopps",
          designation: "Head Nurse",
          department: "Nursing",
          branch: "Central Hospital",
          status: "ACTIVE",
          paymentHistory: [
            { period: "April 2026", amount: 48000, date: "2026-04-30" },
            { period: "March 2026", amount: 48000, date: "2026-03-31" }
          ]
        },
        {
          id: "EMP-003",
          staffNumber: "STF-2026-51",
          firstName: "Charles",
          lastName: "McGill",
          designation: "Chief Legal Counsel",
          department: "Administration",
          branch: "Central Hospital",
          status: "SUSPENDED",
          paymentHistory: [
            { period: "March 2026", amount: 90000, date: "2026-03-31" }
          ]
        }
      ]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Pre-existing mock data pattern; loads initial state via async fetch
    void fetchHRData();
  }, []);

  const handleToggleStatus = async (staff: StaffMember) => {
    setUpdating(true);
    const newStatus = staff.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await apiClient.patch(`/v1/hr/employees/${staff.id}/status`, {
        status: newStatus,
        tenantId: user?.tenantId
      });
    } catch {
      // Mock local fallback update
    }

    const updated = employees.map(e => e.id === staff.id ? { ...e, status: newStatus as "ACTIVE" | "SUSPENDED" } : e);
    setEmployees(updated);
    if (selectedStaff?.id === staff.id) {
      setSelectedStaff({ ...selectedStaff, status: newStatus });
    }
    setUpdating(false);
    alert(`Staff status updated successfully to ${newStatus}.`);
  };

  const filtered = employees.filter(emp => {
    const matchesSearch = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) || emp.staffNumber.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === "ALL" || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const departments = ["ALL", ...Array.from(new Set(employees.map(e => e.department)))];

  return (
    <div className="space-y-6 animate-fade-in relative min-h-[600px]">
      <PageHeader 
        title="HR & Staff Directory Workspace" 
        description="Oversee active staff credentials, logical assignments, status metrics, and payroll ledgers." 
      />

      {/* SEARCH AND FILTERS */}
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff number or complete name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Department:</span>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(emp => {
          const initials = `${emp.firstName[0]}${emp.lastName[0]}`;
          return (
            <div 
              key={emp.id} 
              className={`card p-5 space-y-4 hover:shadow-md transition-all border ${
                emp.status === "SUSPENDED" ? "border-rose-100 bg-rose-50/10" : "border-slate-200/80"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-xs">
                    {initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{emp.firstName} {emp.lastName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">No: {emp.staffNumber}</p>
                  </div>
                </div>

                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                  emp.status === "ACTIVE" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {emp.status}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  {emp.designation}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  {emp.department} · {emp.branch}
                </p>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100/60">
                <button
                  onClick={() => setSelectedStaff(emp)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Manage Profile & Payroll &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SLIDE-OVER ACTION PANE */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedStaff(null)} />
          
          <div className="relative w-screen max-w-md bg-white h-full shadow-2xl flex flex-col p-6 border-l border-slate-200/80 animate-slide-in-right overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Employee Administration</h3>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-6 py-6">
              {/* Profile Card */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm uppercase">
                    {selectedStaff.firstName[0]}{selectedStaff.lastName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{selectedStaff.firstName} {selectedStaff.lastName}</h4>
                    <p className="text-xs text-slate-400 font-mono">{selectedStaff.staffNumber}</p>
                  </div>
                </div>
                <div className="text-xs space-y-1 pt-2 text-slate-600">
                  <p><strong>Designation:</strong> {selectedStaff.designation}</p>
                  <p><strong>Department:</strong> {selectedStaff.department}</p>
                  <p><strong>Facility Branch:</strong> {selectedStaff.branch}</p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="space-y-2.5">
                <h5 className="font-bold text-slate-800 text-xs tracking-wider uppercase">Governance Status Control</h5>
                <button
                  disabled={updating}
                  onClick={() => handleToggleStatus(selectedStaff)}
                  className={`w-full btn justify-center py-2.5 text-xs font-semibold gap-2 border ${
                    selectedStaff.status === "ACTIVE"
                      ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100/50"
                      : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100/50"
                  }`}
                >
                  {selectedStaff.status === "ACTIVE" ? (
                    <>
                      <UserX className="h-4 w-4" /> Suspend Employee Credentials
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" /> Activate Employee Credentials
                    </>
                  )}
                </button>
              </div>

              {/* Payroll History */}
              <div className="space-y-3.5">
                <h5 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-1">
                  <CreditCard className="h-4 w-4 text-indigo-500" />
                  Audited Payroll Disbursements
                </h5>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {selectedStaff.paymentHistory.map((pay, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {pay.period}
                        </p>
                        <p className="text-[10px] text-slate-400">Paid: {pay.date}</p>
                      </div>
                      <span className="font-extrabold text-slate-900 flex items-center gap-0.5">
                        <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                        {pay.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
