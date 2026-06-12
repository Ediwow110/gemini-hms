import React from 'react';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { Calendar, AlertTriangle } from 'lucide-react';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsEmptyState } from '../../components/hms-dashboard';

export const PatientAppointmentsPage: React.FC = () => {
  return (
    <HmsDashboardShell widthTier="standard">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="My Appointments"
          description="Schedule and manage your visits"
        />

        <PatientPortalShellNotice />

        {/* WIP Banner */}
        <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Appointments (WIP)</h5>
            <p className="font-medium mt-0.5">
              Appointment scheduling and management is not yet available. Please contact your clinic directly to book, reschedule, or cancel visits.
            </p>
          </div>
        </div>

        {/* Empty state placeholder */}
        <HmsEmptyState 
          icon={<Calendar className="h-10 w-10" />} 
          title="No appointments available" 
          description="Online appointment booking is currently under development. Please call or visit the clinic reception desk to schedule an appointment." 
          action={
            <button
              disabled
              title="Book Appointment (WIP - Coming Soon)"
              aria-label="Book Appointment (WIP - Coming Soon)"
              className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold cursor-not-allowed opacity-50 shadow-sm"
            >
              Book Appointment (WIP)
            </button>
          }
        />
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default PatientAppointmentsPage;
