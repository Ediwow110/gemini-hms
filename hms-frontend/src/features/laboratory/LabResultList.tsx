import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { Search } from "lucide-react";

export const LabResultList = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex justify-between items-center">
        <PageHeader title="Laboratory Queue" description="Manage incoming specimens and pending results." />
      </div>

      <div className="card p-5 animate-slide-up stagger-1">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="input w-full pl-10" placeholder="Search by Order ID, Patient Name, or Barcode..." />
          </div>
          <select className="input max-w-[200px]">
            <option>All Statuses</option>
            <option>Pending Collection</option>
            <option>Processing</option>
            <option>Pending Approval</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden animate-slide-up stagger-2">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Test</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-indigo-50/30 transition-colors cursor-pointer group" onClick={() => navigate('/lab/results/1/encode')}>
              <td className="px-6 py-4 font-mono font-bold text-indigo-600">ORD-2026-001</td>
              <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-indigo-700">John Doe</td>
              <td className="px-6 py-4 text-slate-600">Complete Blood Count</td>
              <td className="px-6 py-4"><span className="text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded">STAT</span></td>
              <td className="px-6 py-4 text-center">
                <StatusBadge status="Processing" />
              </td>
            </tr>
            <tr className="hover:bg-indigo-50/30 transition-colors cursor-pointer group" onClick={() => navigate('/lab/results/2/approval')}>
              <td className="px-6 py-4 font-mono font-bold text-indigo-600">ORD-2026-002</td>
              <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-indigo-700">Alice Smith</td>
              <td className="px-6 py-4 text-slate-600">Urinalysis</td>
              <td className="px-6 py-4"><span className="text-slate-500 font-medium text-xs">Routine</span></td>
              <td className="px-6 py-4 text-center">
                <StatusBadge status="Pending Approval" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
