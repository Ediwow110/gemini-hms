import React from 'react';
import { Box, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import { useFieldServiceHandoverChecklist } from '../../hooks/use-field-service';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton } from '../../components/hms-dashboard';

export const MobileHandoverChecklistPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: checklist, isLoading } = useFieldServiceHandoverChecklist();

  return (
    <HmsDashboardShell maxWidth="full">
      <div className="space-y-6 max-w-2xl mx-auto pb-20">
        <HmsPageHeader
          title="Handover Checklist"
          description={`Job: ${checklist?.jobId ?? '...'}`}
          badge="Sandbox"
          onBack={() => navigate(-1)}
        />

        <FieldServiceShellNotice />

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
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default MobileHandoverChecklistPage;
