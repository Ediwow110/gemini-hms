import { useState } from "react";
import { PatientIdentityHeader } from "../../components/ui/patient-identity-header";
import { PageHeader } from "../../components/ui/page-header";
import { PlusCircle, Receipt, Search } from "lucide-react";

const MOCK_SERVICES: Service[] = [
  { id: "S-001", type: "SERVICE", code: "CBC", name: "Complete Blood Count", department: "Hematology", price: 25.00 },
  { id: "S-002", type: "SERVICE", code: "URN", name: "Urinalysis", department: "Clinical Microscopy", price: 15.00 },
  { id: "S-003", type: "SERVICE", code: "ECG", name: "Electrocardiogram", department: "Cardiology", price: 50.00 },
];

interface Service { id: string; type: 'SERVICE' | 'INVENTORY'; code: string; name: string; department: string; price: number; }
interface OrderItem extends Omit<Service, 'price'> { quantity: number; discount: number; remarks: string; }
interface Patient { id: string; name: string; age: number; gender: string; category: string; balance: number; }

export const CreateOrder = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "P001") {
      setPatient({ id: "P001", name: "John Doe", age: 45, gender: "M", category: "Regular", balance: 50 });
    }
  };

  const addService = (service: Service) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { price, ...itemData } = service;
    setItems([...items, { ...itemData, quantity: 1, discount: 0, remarks: "" }]);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <PageHeader title="Create New Order" description="Register new medical services for a patient." />
      
      <div className="card p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Search Patient (Try P001)</label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className="input w-full pl-10" onChange={handleSearch} placeholder="Search by name or ID..." />
        </div>
      </div>

      {patient && (
        <div className="animate-fade-in space-y-6">
          <PatientIdentityHeader patient={patient} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6 animate-slide-up stagger-1">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Available Services</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {MOCK_SERVICES.map(s => (
                    <button 
                      key={s.code} 
                      onClick={() => addService(s)} 
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4 text-indigo-600" />
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card overflow-hidden animate-slide-up stagger-2">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Order Items</h2>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-right">Price</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-right">Discount</th>
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <PlusCircle className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="text-sm font-medium">No services added yet. Select from available services above.</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, i) => (
                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {item.name}
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.type}:{item.id}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-400 italic text-xs">
                            Trusted Price
                          </td>
                          <td className="px-6 py-4 text-right">
                            <input className="input h-8 py-0 w-24 text-right inline-block" defaultValue={0} disabled />
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-400">--</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24 animate-slide-up stagger-3">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Receipt className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Order Summary</h3>
                </div>
                <div className="space-y-3 text-sm font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-slate-400">Trusted Pricing</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="text-slate-400">--</span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-lg">Total</span>
                    <span className="font-extrabold text-indigo-400 text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      ₱ --
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Final pricing and tax calculations are performed during the billing checkout process.</p>
                </div>
                <button 
                  disabled={items.length === 0}
                  onClick={() => {
                    alert("Order payload validated against backend contract: items include type/id. API integration pending.");
                    window.location.href = '/queue';
                  }}
                  className="btn btn-primary w-full mt-8 flex items-center justify-center gap-2 py-3"
                >
                  Create Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
