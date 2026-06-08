import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import FieldServiceShellNotice from './components/FieldServiceShellNotice';
import ServiceWorklogPanel from './components/ServiceWorklogPanel';
import { useFieldServiceServiceTicket } from '../../hooks/use-field-service';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton } from '../../components/hms-dashboard';

export const ServiceTicketWorklogPage: React.FC = () => {
  const { data: ticket, isLoading } = useFieldServiceServiceTicket();

  return (
    <HmsDashboardShell>
      <div className="space-y-6">
        <HmsPageHeader
          title="Service Ticket Worklog"
          description="Record maintenance activities and repair diagnosis"
          badge="Sandbox"
        />

        <FieldServiceShellNotice />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <HmsLoadingSkeleton variant="panel" />
            ) : (
              <>
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                        <AlertCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Ticket: {ticket?.id}</h3>
                        <p className="text-xs font-bold text-rose-600 uppercase">{ticket?.priority} PRIORITY &middot; {ticket?.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Reported</p>
                      <p className="text-xs font-bold text-slate-700">{ticket?.issue}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Details</p>
                    <p className="text-xs font-black text-slate-800">{ticket?.asset}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase">SN: {ticket?.serialNumber} &middot; Floor 4 Radiology</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase">SLA Milestone Alert</h4>
                    <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                      Initial response completed. Resolution deadline in 4.5 hours to maintain Platinum SLA.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <aside>
            <ServiceWorklogPanel />
            <button className="w-full mt-4 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200 uppercase text-xs">
              Resolve Ticket (Shell)
            </button>
          </aside>
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default ServiceTicketWorklogPage;
