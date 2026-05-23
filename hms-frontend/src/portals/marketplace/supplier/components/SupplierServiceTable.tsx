import React from 'react';
import { Wrench, Clock, MapPin, MoreVertical, User, Settings } from 'lucide-react';

export const SupplierServiceTable: React.FC = () => {
  const services = [
    { id: '1', name: 'Annual Preventive Maintenance', type: 'MAINTENANCE', price: 45000, duration: '4-6 Hrs', area: 'Metro Manila', skills: 'Biomedical Tech', equipment: 'Calibration Kit' },
    { id: '2', name: 'Radiology Calibration', type: 'CALIBRATION', price: 25000, duration: '3 Hrs', area: 'Luzon Wide', skills: 'Radiology Specialist', equipment: 'Dosimeter' },
    { id: '3', name: 'Emergency Repair - 24/7 SLA', type: 'REPAIR', price: 15000, duration: 'Varies', area: 'National', skills: 'Field Engineer', equipment: 'Diagnostic Tools' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Price</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Coverage</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Skills</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipment</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {services.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black text-slate-800">{s.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-[9px] font-black text-indigo-500 uppercase tracking-tight">{s.type}</td>
              <td className="px-6 py-4 text-xs font-black text-slate-900">₱{s.price.toLocaleString()}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                  <Clock className="h-3 w-3" /> {s.duration}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                  <MapPin className="h-3 w-3" /> {s.area}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                  <User className="h-3 w-3" /> {s.skills}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                  <Settings className="h-3 w-3" /> {s.equipment}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><MoreVertical className="h-3.5 w-3.5" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierServiceTable;
