import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { Badge } from "../../components/ui/badge";
import { PlusCircle, Package, AlertTriangle, AlertOctagon, Clock } from "lucide-react";
import { RequirePermission } from "../../components/ui/RequirePermission";

const MOCK_STOCK = [
  { id: "S001", name: "CBC Reagent", cat: "Lab", branch: "Main", batch: "B2026-01", qty: 5, reorder: 10, expiry: "2026-12-31", status: "Low" },
  { id: "S002", name: "Urine Container", cat: "Consumable", branch: "Main", batch: "B2026-02", qty: 150, reorder: 50, expiry: "2027-01-01", status: "In Stock" },
  { id: "S003", name: "Rapid Test Kit", cat: "Lab", branch: "Main", batch: "B2026-03", qty: 0, reorder: 20, expiry: "2026-06-15", status: "Critical" },
];

const STATS = [
  { label: "Total Items", val: "45", icon: Package, color: "from-indigo-500 to-violet-500 shadow-indigo-200/50" },
  { label: "Low Stock", val: "12", icon: AlertTriangle, color: "from-amber-500 to-orange-500 shadow-amber-200/50" },
  { label: "Critical", val: "3", icon: AlertOctagon, color: "from-rose-500 to-pink-500 shadow-rose-200/50" },
  { label: "Expiring Soon", val: "5", icon: Clock, color: "from-violet-500 to-purple-500 shadow-violet-200/50" },
];

export const Inventory = () => {
  const navigate = useNavigate();
  const statusBadge = (status: string) => {
    const styles = {
      "Critical": "bg-rose-50 text-rose-700 border border-rose-200/60",
      "Low": "bg-amber-50 text-amber-700 border border-amber-200/60",
      "In Stock": "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    };
    const dots = { "Critical": "bg-rose-500", "Low": "bg-amber-500", "In Stock": "bg-emerald-500" };
    return (
      <Badge className={styles[status as keyof typeof styles] || "bg-slate-100"}>
        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${dots[status as keyof typeof dots] || "bg-slate-400"}`} />
        {status}
      </Badge>
    );
  };

  const lowStockAlerts = MOCK_STOCK.filter(i => i.qty <= i.reorder);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex justify-between items-center">
        <PageHeader title="Inventory & Stock" description="Monitor stock levels, batches, and movements." />
        <RequirePermission permission="inventory.adjust.request">
          <button onClick={() => navigate('/inventory/receiving')} className="btn btn-primary flex items-center gap-2 px-5 py-2.5">
            <PlusCircle className="h-4 w-4" />
            Receive Stock
          </button>
        </RequirePermission>
      </div>
      
      <RequirePermission permission="inventory.item.view">
        {lowStockAlerts.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-4 items-start shadow-sm shadow-rose-100 animate-slide-up">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-rose-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Low-Stock Action Required</h3>
              <p className="text-sm text-rose-600 mt-1">
                There are {lowStockAlerts.length} item(s) currently below their designated reorder levels. Please create purchase orders immediately to avoid operational disruption.
              </p>
            </div>
            <button className="btn btn-danger py-2 bg-rose-600 hover:bg-rose-700 border-none shadow-sm shadow-rose-200/50">
              Review Items
            </button>
          </div>
        )}
      </RequirePermission>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`card-hover p-5 text-center animate-slide-up stagger-${i + 1}`}>
              <div className={`mx-auto w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} shadow-md flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.val}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Batch</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_STOCK.map((item) => (
              <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors duration-150 cursor-pointer group">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.cat}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 font-mono text-xs">{item.batch}</td>
                <td className={`px-6 py-4 font-bold ${item.qty <= item.reorder ? 'text-rose-600' : 'text-slate-900'}`}>{item.qty}</td>
                <td className="px-6 py-4 text-slate-600 text-xs">{item.expiry}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    {statusBadge(item.status)}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <Link to={`/inventory/${item.id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
