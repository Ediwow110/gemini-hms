import { useState, useEffect } from "react";
import { PatientIdentityHeader } from "../../components/ui/patient-identity-header";
import { PageHeader } from "../../components/ui/page-header";
import { PlusCircle, Receipt, Search, Save } from "lucide-react";
import { apiClient } from "../../lib/api";
import { logger } from "../../lib/logger";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../hooks/use-user";

interface Service { id: string; type: 'SERVICE' | 'INVENTORY'; code: string; name: string; department: string; price: number; }
interface OrderItem {
  itemId: string;
  itemType: 'SERVICE' | 'INVENTORY';
  name: string;
  quantity: number;
  discount: number;
  remarks: string;
  unitPrice: number;
}
interface Patient { id: string; name: string; age: number; gender: string; category: string; balance: number; }

export const CreateOrder = () => {
  const navigate = useNavigate();
  const user = useUser();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      setServicesError(null);
      try {
        const res = await apiClient.get('/v1/catalog');
        setServices(res.data);
      } catch (err) {
        logger.error("Failed to fetch services:", err);
        setServicesError('Failed to load services catalog. Please retry.');
        setServices([]);
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length < 2) {
      setPatient(null);
      return;
    }

    try {
      const res = await apiClient.get('/v1/patients', { params: { search: value } });
      if (res.data && res.data.length > 0) {
        const p = res.data[0];
        setPatient({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          age: p.age,
          gender: p.gender,
          category: p.category || "Regular",
          balance: p.balance || 0,
        });
      } else {
        setPatient(null);
      }
    } catch (err) {
      logger.error("Patient search failed:", err);
      setPatient(null);
    }
  };

  const handleRetryServices = () => {
    void (async () => {
      setIsLoadingServices(true);
      setServicesError(null);
      try {
        const res = await apiClient.get('/v1/catalog');
        setServices(res.data);
      } catch (err) {
        logger.error("Failed to fetch services:", err);
        setServicesError('Failed to load services catalog. Please retry.');
        setServices([]);
      } finally {
        setIsLoadingServices(false);
      }
    })();
  };

  const addService = (service: Service) => {
    setItems([...items, {
      itemId: service.id,
      itemType: service.type,
      name: service.name,
      quantity: 1,
      discount: 0,
      remarks: "",
      unitPrice: service.price
    }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleSubmit = async () => {
    if (!patient) {
      setError("Please search and select a patient first.");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one service to the order.");
      return;
    }
    if (!user?.branchId) {
      setError("Branch context is missing. Please ensure you are assigned to a branch.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post('/v1/orders', {
        patientId: patient.id,
        branchId: user.branchId,
        items: items.map(item => ({
          itemType: item.itemType,
          itemId: item.itemId,
          quantity: item.quantity,
        })),
      });
      navigate('/queue');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to create order. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        {servicesError && (
          <div role="alert" className="mt-2 text-xs text-rose-600">
            {servicesError} <button type="button" onClick={handleRetryServices} className="underline ml-1">Retry</button>
          </div>
        )}
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
                  {isLoadingServices ? (
                    <div className="text-xs text-slate-400 animate-pulse">Loading services...</div>
                  ) : (
                    services.map(s => (
                      <button
                        key={s.id}
                        onClick={() => addService(s)}
                        className="btn btn-secondary flex items-center gap-2"
                      >
                        <PlusCircle className="h-4 w-4 text-indigo-600" />
                        {s.name}
                      </button>
                    ))
                  )}
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
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.itemType}:{item.itemId}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600 font-mono text-xs">
                            ₱{item.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number"
                                className="input h-8 py-0 w-16 text-right"
                                value={item.quantity}
                                onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                                min="1"
                              />
                              <input
                                type="number"
                                className="input h-8 py-0 w-16 text-right"
                                value={item.discount}
                                onChange={(e) => updateItem(i, 'discount', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                            ₱{(item.unitPrice * item.quantity - item.discount).toFixed(2)}
                          </td>
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
                    <span className="text-slate-900 font-mono">
                      ₱{items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="text-rose-500 font-mono">
                      -₱{items.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-lg">Total</span>
                    <span className="font-extrabold text-indigo-600 text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      ₱{items.reduce((sum, item) => sum + (item.unitPrice * item.quantity - item.discount), 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Final pricing and tax calculations are performed during the billing checkout process.</p>
                </div>
                {error && (
                  <div className="text-rose-500 text-xs font-semibold text-center mb-4 animate-shake">
                    {error}
                  </div>
                )}
                <button
                  disabled={items.length === 0 || isLoading}
                  onClick={handleSubmit}
                  className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
