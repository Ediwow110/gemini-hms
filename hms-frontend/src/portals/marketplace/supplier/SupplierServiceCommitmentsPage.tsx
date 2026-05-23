import React from 'react';
import { Wrench, Calendar, MapPin, ChevronRight } from 'lucide-react';
import SupplierShellNotice from './components/SupplierShellNotice';

export const SupplierServiceCommitmentsPage: React.FC = () => {
  const tickets = [
    { id: 'SVC-2026-0042', asset: 'GE Voluson E10', type: 'INSTALLATION', facility: 'Metro Central', schedule: 'May 26, 2026', status: 'SCHEDULED' },
    { id: 'SVC-2026-0039', asset: 'Roche cobas c 311', type: 'MAINTENANCE', facility: 'St. Jude Medical', schedule: 'May 24, 2026', status: 'IN_TRANSIT' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Field Service Desk</h2>
        <p className="text-xs text-slate-500 font-medium">Technician scheduling and service SLA monitoring</p>
      </div>

      <SupplierShellNotice />

      <div className="space-y-4">
        {tickets.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">{t.asset}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{t.id} · {t.type}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-8 lg:text-right">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Facility</p>
                <div className="flex items-center gap-1.5 lg:justify-end">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs font-black text-slate-700">{t.facility}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Schedule</p>
                <div className="flex items-center gap-1.5 lg:justify-end">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs font-black text-slate-700">{t.schedule}</p>
                </div>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                t.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}>
                {t.status.replace('_', ' ')}
              </span>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplierServiceCommitmentsPage;
