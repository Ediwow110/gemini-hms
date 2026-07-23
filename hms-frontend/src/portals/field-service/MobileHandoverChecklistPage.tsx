import React from 'react';
import { Box, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/use-user';
import { useFieldServiceHandoverLogs } from '../../hooks/use-field-service';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import { useFieldServiceHandoverChecklist } from '../../hooks/use-field-service';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton } from '../../components/hms-dashboard';

export const MobileHandoverChecklistPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useUser();
  const { data: logs } = useFieldServiceHandoverLogs();
  const { data: checklist, isLoading } = useFieldServiceHandoverChecklist();
  const isAdmin = Boolean(
    user?.permissions.includes('field_service.job.assign'),
  );

  return (
    <HmsDashboardShell widthTier="full">
      <div className="space-y-6 max-w-2xl mx-auto pb-20">
        <HmsPageHeader
          title="Handover Checklist"
          description={isAdmin ? "Handover Audit Log" : `Job: ${checklist?.jobId ?? '...'}`}
          badge={isAdmin ? "Admin" : "Sandbox"}
          onBack={() => navigate(-1)}
        />

        <FieldServiceShellNotice />

        {isAdmin ? (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Job ID</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Customer</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Asset</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Completion</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Sign-Off</th>
                  <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs?.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{row.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.customer}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.asset}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${row.progress === '100%' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {row.progress}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.signOff}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            {isLoading ? (
              <HmsLoadingSkeleton variant="panel" />
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <Box className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">{checklist?.asset}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">SN: {checklist?.serialNumber}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {checklist?.tasks.map((task) => (
                    <label key={task} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-300 transition-all group">
                      <input type="checkbox" className="h-5 w-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{task}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pb-8">
              <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg uppercase text-xs flex items-center justify-center gap-2">
                <ClipboardCheck className="h-5 w-5" /> Sign Handover (Shell)
              </button>
            </div>
          </>
        )}
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default MobileHandoverChecklistPage;
