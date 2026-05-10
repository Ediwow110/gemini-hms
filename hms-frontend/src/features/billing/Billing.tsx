import { useState } from "react";
import { PatientIdentityHeader } from "../../components/ui/patient-identity-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { PageHeader } from "../../components/ui/page-header";
import { Search, CreditCard, Banknote, Smartphone } from "lucide-react";

export const Billing = () => {
  const [patient, setPatient] = useState<{ id: string; name: string; age: number; gender: string; category: string; balance: number } | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "P001") {
      setPatient({ id: "P001", name: "John Doe", age: 45, gender: "M", category: "Regular", balance: 50 });
    }
  };

  const paymentMethods = [
    { id: "cash", label: "Cash", icon: Banknote, color: "emerald" },
    { id: "card", label: "Card", icon: CreditCard, color: "indigo" },
    { id: "gcash", label: "GCash", icon: Smartphone, color: "blue" },
  ];
  const [selectedMethod, setSelectedMethod] = useState("cash");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Billing & Payment" description="Manage invoices and process payments." />
      
      <div className="card p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Search Patient or Invoice</label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className="input w-full pl-10" onChange={handleSearch} placeholder="Search by name, ID, or invoice number..." />
        </div>
      </div>

      {patient && (
        <>
          <PatientIdentityHeader patient={patient} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 animate-slide-up stagger-1">
              <h2 className="font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Invoice Summary</h2>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Invoice #</span>
                  <span className="font-semibold text-slate-900">INV-2026-001</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status</span>
                  <StatusBadge status="Unpaid" />
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-slate-900 font-bold text-base">Balance Due</span>
                  <span className="text-rose-600 font-extrabold text-2xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    ₱{patient.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6 animate-slide-up stagger-2">
              <h2 className="font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Add Payment</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(m => {
                      const Icon = m.icon;
                      const active = selectedMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethod(m.id)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                            active 
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100" 
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Amount</label>
                  <input className="input text-lg font-bold" placeholder="0.00" type="number" step="0.01" />
                </div>
                <button onClick={() => alert("Payment Processed Successfully!")} className="btn btn-success w-full mt-2 py-3">Process Payment</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
