import React from 'react';
import {
  Pill, 
  CreditCard, 
  MessageSquare, 
  Heart,
  ShieldCheck,
  Bell,
  Calendar,
  FileText,
  UserCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PatientHomeCard from './components/PatientHomeCard';
import AppointmentSummaryCard from './components/AppointmentSummaryCard';
import ReleasedResultCard from './components/ReleasedResultCard';
import PatientPortalShellNotice from './components/PatientPortalShellNotice';
import { AnalyticsMetricCard } from '../../components/analytics';
import { usePatientProfile, usePatientLabResults, usePatientPrescriptions } from '../../hooks/use-patient-portal';
import { HmsPageHeader } from '../../components/hms-page';
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from '../../components/hms-dashboard';

export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = usePatientProfile();
  const { results, loading: resultsLoading } = usePatientLabResults();
  const { prescriptions, loading: rxLoading } = usePatientPrescriptions();

  const rawResults = Array.isArray(results) ? results : [];
  const rawPrescriptions = Array.isArray(prescriptions) ? prescriptions : [];

  const displayResults = rawResults.slice(0, 3).map(r => ({
    id: r.id,
    testName: `Lab Result #${r.id.substring(0, 8)}`,
    dateReleased: r.lockedAt ? new Date(r.lockedAt).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString(),
    doctorName: 'Attending Physician',
    status: 'NORMAL' as const,
    isReleased: true,
    doctorNotes: r.remarks || '',
  }));

  const displayPrescriptions = rawPrescriptions.slice(0, 3).map(p => ({
    id: p.id,
    medication: p.medicationName,
    dosage: p.dosage,
    frequency: p.frequency,
    prescribedBy: 'Attending Physician',
    expiryDate: '',
    remainingRefills: p.status === 'ACTIVE' ? 1 : 0,
  }));

  const patientActions = [
    { title: 'Upcoming Appointment', value: 'Book', description: 'Schedule or review visits', icon: Calendar, severity: 'info' as const, href: '/patient/appointments' },
    { title: 'Latest Lab Result', value: resultsLoading ? '…' : displayResults.length, description: 'Released results only', icon: ShieldCheck, severity: 'success' as const, href: '/patient/lab-results' },
    { title: 'Active Prescriptions', value: rxLoading ? '…' : displayPrescriptions.length, description: 'Current medication list', icon: Pill, severity: 'info' as const, href: '/patient/prescriptions' },
    { title: 'Outstanding Balance', value: 'View', description: 'Invoices and receipts', icon: CreditCard, severity: 'warning' as const, href: '/patient/billing' },
    { title: 'Record Requests', value: 'Open', description: 'Documents and exports', icon: FileText, severity: 'info' as const, href: '/patient/medical-records' },
  ];

  const isPatientLoading = profileLoading || resultsLoading || rxLoading;

  return (
    <HmsDashboardShell widthTier="standard">
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title={profileLoading ? 'Loading...' : `Hello, ${profile?.firstName || 'Welcome Back'}`}
          description="Access your medical records, appointments, and care team"
          actions={
            <div className="flex items-center gap-3">
              <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors relative shadow-sm">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" />
              </button>
              <button
                onClick={() => navigate('/patient/profile')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md"
              >
                My Profile
              </button>
            </div>
          }
        />

        <PatientPortalShellNotice />

        {isPatientLoading ? (
          <HmsLoadingSkeleton />
        ) : patientActions.length > 0 ? (
          <div className="grid grid-cols-10 gap-6">
            {patientActions.map(action => (
              <div key={action.title} className="col-span-10 sm:col-span-5 xl:col-span-2">
                <AnalyticsMetricCard {...action} />
              </div>
            ))}
          </div>
        ) : (
          <HmsEmptyState title="No portal actions available" description="Your care-team actions will appear here when records are available." />
        )}

        {/* Quick Actions Section */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { label: 'Book Visit', icon: Calendar, path: '/patient/appointments' },
              { label: 'Get Records', icon: FileText, path: '/patient/medical-records' },
              { label: 'Messages', icon: MessageSquare, path: '/patient/messages' },
              { label: 'Lab Results', icon: ShieldCheck, path: '/patient/lab-results' },
              { label: 'Prescriptions', icon: Pill, path: '/patient/prescriptions' },
              { label: 'Billing', icon: CreditCard, path: '/patient/billing' },
              { label: 'Profile', icon: UserCircle, path: '/patient/profile' },
            ].map((item) => (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-xl transition-all group"
              >
                <item.icon className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 mb-1.5" />
                <span className="text-[10px] font-black text-slate-600 group-hover:text-indigo-700">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column (8/12 cols desktop, 12 cols tablet/mobile) */}
          <div className="col-span-12 xl:col-span-8 space-y-6">
            {/* Appointments */}
            <AppointmentSummaryCard appointments={[]} />

            {/* Recent Lab Results */}
            {resultsLoading ? (
              <div className="card bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 text-center text-xs text-slate-400">
                Loading lab results...
              </div>
            ) : displayResults.length > 0 ? (
              <ReleasedResultCard results={displayResults} />
            ) : null}

            {/* Active Prescriptions */}
            {!rxLoading && displayPrescriptions.length > 0 && (
              <PatientHomeCard
                icon={Pill}
                title="Active Prescriptions"
                value={displayPrescriptions.length}
                description="View your active medications"
                actionLabel="View All"
                onClick={() => navigate('/patient/prescriptions')}
              />
            )}
          </div>

          {/* Right Column (4/12 cols desktop, 12 cols tablet/mobile) */}
          <div className="col-span-12 xl:col-span-4 space-y-6">
            <PatientHomeCard title="Quick Info" icon={Heart} value={profile?.patientNumber || '...'} description={`Status: ${profile?.status || '...'}`} />
          </div>
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default PatientDashboard;

