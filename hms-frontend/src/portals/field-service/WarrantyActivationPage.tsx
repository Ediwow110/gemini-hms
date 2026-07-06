import React from 'react';
import { useUser } from '../../hooks/use-user';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import WarrantyActivationCard from './components/WarrantyActivationCard';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter } from '../../components/hms-dashboard';

export const WarrantyActivationPage: React.FC = () => {
  const user = useUser();
  const isAdmin = !!user && (user.roles.includes("Super Admin") || user.roles.includes("Branch Admin"));

  return (
    <HmsDashboardShell>
      <div className="space-y-6">
        <HmsPageHeader
          title="Warranty Activation"
          description={isAdmin ? "Digital Warranty Registry (Read-Only Management)" : "Register digital warranty for newly commissioned assets"}
          badge={isAdmin ? "Admin" : "Sandbox"}
        />

        <FieldServiceShellNotice />

        {isAdmin ? (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Asset ID</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Serial Number</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Activation Date</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { id: 'AST-901', sn: 'SN-2024-X1', date: '2024-05-12', status: 'Active' },
                  { id: 'AST-905', sn: 'SN-2024-Y2', date: '2024-06-01', status: 'Active' },
                  { id: 'AST-912', sn: 'SN-2024-Z3', date: '2024-06-15', status: 'Pending' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{row.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.sn}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${row.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WarrantyActivationCard />
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Activation Guide</h4>
              <ul className="space-y-3">
                {[
                  'Ensure serial number is visible in photos',
                  'Verify handover document is signed by client',
                  'Installation report must be uploaded',
                  'Warranty period starts from date of commissioning'
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-xs font-medium text-slate-600 leading-relaxed">
                    <span className="h-5 w-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default WarrantyActivationPage;
