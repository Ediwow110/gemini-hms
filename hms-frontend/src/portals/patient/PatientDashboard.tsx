import React from 'react';
import {
  Calendar,
  CreditCard,
  FileText,
  Heart,
  MessageSquare,
  Pill,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnalyticsMetricCard } from '../../components/analytics';
import { HmsPageHeader } from '../../components/hms-page';
import {
  HmsAuditFooter,
  HmsDashboardShell,
  HmsDataSourceBadge,
  HmsDataUnavailable,
  HmsEmptyState,
  HmsLoadingSkeleton,
  HmsQuickActions,
  HmsToolbar,
} from '../../components/hms-dashboard';
import {
  usePatientInvoices,
  usePatientLabResults,
  usePatientPrescriptions,
  usePatientProfile,
} from '../../hooks/use-patient-portal';
import PatientHomeCard from './components/PatientHomeCard';
import ReleasedResultCard from './components/ReleasedResultCard';

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = usePatientProfile();
  const {
    results,
    loading: resultsLoading,
    error: resultsError,
    refetch: refetchResults,
  } = usePatientLabResults();
  const {
    prescriptions,
    loading: prescriptionsLoading,
    error: prescriptionsError,
    refetch: refetchPrescriptions,
  } = usePatientPrescriptions();
  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = usePatientInvoices();

  const safeResults = Array.isArray(results) ? results : [];
  const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  const displayResults = safeResults.slice(0, 3).map((result) => ({
    id: result.id,
    testName: `Lab Result #${result.id.substring(0, 8)}`,
    dateReleased: result.lockedAt
      ? new Date(result.lockedAt).toLocaleDateString()
      : new Date(result.createdAt).toLocaleDateString(),
    doctorName: 'Care team',
    status: 'NORMAL' as const,
    isReleased: true,
    doctorNotes: result.remarks || '',
  }));

  const activePrescriptions = safePrescriptions.filter(
    (prescription) => prescription.status === 'ACTIVE',
  );
  const outstandingBalance = safeInvoices.reduce((sum, invoice) => {
    const total = Number(invoice.totalAmount ?? 0);
    const paid = Number(invoice.paidAmount ?? 0);
    return sum + Math.max(0, total - paid);
  }, 0);

  const loading =
    profileLoading || resultsLoading || prescriptionsLoading || invoicesLoading;
  const error =
    profileError || resultsError || prescriptionsError || invoicesError;

  const refresh = async () => {
    await Promise.all([
      refetchProfile(),
      refetchResults(),
      refetchPrescriptions(),
      refetchInvoices(),
    ]);
  };

  return (
    <HmsDashboardShell
      widthTier="standard"
      toolbar={
        <HmsToolbar
          role="Patient Portal"
          onRefresh={() => void refresh()}
          refreshing={loading}
        />
      }
      footer={<HmsAuditFooter dataSource="Patient portal APIs" />}
    >
      <HmsPageHeader
        eyebrow="My care"
        title={profileLoading ? 'Loading your portal…' : `Hello, ${profile?.firstName || 'welcome'}`}
        description="Your next care steps, released results, prescriptions and billing information."
        actions={
          <>
            <HmsDataSourceBadge mode="live" />
            <button
              type="button"
              onClick={() => navigate('/patient/profile')}
              className="min-h-10 rounded-md bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              My profile
            </button>
          </>
        }
      />

      {error && (
        <div className="rounded-md border border-amber-500 bg-amber-50 p-4 text-xs text-amber-800">
          Some portal information could not be loaded. Use Refresh to try again.
        </div>
      )}

      {loading ? (
        <HmsLoadingSkeleton variant="kpi" />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-5">
          <AnalyticsMetricCard
            title="Released lab results"
            value={safeResults.length}
            description="Results available to view"
            icon={ShieldCheck}
            severity="success"
            href="/patient/lab-results"
          />
          <AnalyticsMetricCard
            title="Active prescriptions"
            value={activePrescriptions.length}
            description="Current medications"
            icon={Pill}
            severity="info"
            href="/patient/prescriptions"
          />
          <AnalyticsMetricCard
            title="Outstanding balance"
            value={peso(outstandingBalance)}
            description="Invoices and receipts"
            icon={CreditCard}
            severity={outstandingBalance > 0 ? 'warning' : 'success'}
            href="/patient/billing"
          />
          <AnalyticsMetricCard
            title="Record requests"
            value="Open"
            description="Documents and exports"
            icon={FileText}
            severity="info"
            href="/patient/medical-records"
          />
        </div>
      )}

      <HmsQuickActions
        title="Common actions"
        actions={[
          { id: 'appointments', label: 'Appointments', icon: <Calendar className="h-4 w-4" />, href: '/patient/appointments' },
          { id: 'records', label: 'Medical records', icon: <FileText className="h-4 w-4" />, href: '/patient/medical-records' },
          { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" />, href: '/patient/messages' },
          { id: 'results', label: 'Lab results', icon: <ShieldCheck className="h-4 w-4" />, href: '/patient/lab-results' },
          { id: 'prescriptions', label: 'Prescriptions', icon: <Pill className="h-4 w-4" />, href: '/patient/prescriptions' },
          { id: 'billing', label: 'Billing', icon: <CreditCard className="h-4 w-4" />, href: '/patient/billing' },
          { id: 'profile', label: 'Profile', icon: <UserCircle className="h-4 w-4" />, href: '/patient/profile' },
        ]}
      />

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 space-y-5 xl:col-span-8">
          <HmsDataUnavailable
            sectionName="Upcoming appointments"
            expectedApi="Patient appointment schedule"
            expectedPhase="No appointment summary endpoint is connected to this dashboard"
          />

          {resultsLoading ? (
            <HmsLoadingSkeleton variant="table" />
          ) : displayResults.length > 0 ? (
            <ReleasedResultCard results={displayResults} />
          ) : (
            <HmsEmptyState
              title="No released lab results"
              description="Released results from your care team will appear here."
            />
          )}
        </div>

        <div className="col-span-12 space-y-5 xl:col-span-4">
          <PatientHomeCard
            title="Patient information"
            icon={Heart}
            value={profile?.patientNumber || 'Unavailable'}
            description={`Status: ${profile?.status || 'Unavailable'}`}
          />
          {!prescriptionsLoading && activePrescriptions.length > 0 ? (
            <PatientHomeCard
              icon={Pill}
              title="Active prescriptions"
              value={activePrescriptions.length}
              description="Review dosage and refill information"
              actionLabel="View prescriptions"
              onClick={() => navigate('/patient/prescriptions')}
            />
          ) : (
            <HmsEmptyState
              title="No active prescriptions"
              description="Current medications will appear here when prescribed."
            />
          )}
        </div>
      </div>
    </HmsDashboardShell>
  );
};

export default PatientDashboard;
