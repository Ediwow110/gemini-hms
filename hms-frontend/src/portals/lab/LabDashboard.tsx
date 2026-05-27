import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  FlaskConical, 
  CheckSquare, 
  FileCheck2, 
  ShieldAlert, 
  AlertTriangle,
  Send, 
  Inbox,
  ArrowRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { ChartCard, InsightPanel, StatusDonutChart, TrendLineChart } from '../../components/analytics';
import { labInsights, labStatusBreakdown, labTrendData } from '../../data/analytics/clinicalAnalytics.mock';
import { SpecimenWorkQueue } from './components/SpecimenWorkQueue';
import { CriticalResultPanel } from './components/CriticalResultPanel';
import { TurnaroundTimeCard } from './components/TurnaroundTimeCard';
import { usePendingSpecimens, useCriticalResults, useTurnaroundMetrics } from '../../hooks/use-lab';
import { format } from 'date-fns';

export const LabDashboard = () => {
  const navigate = useNavigate();

  // ──── Real API Hooks ────
  const { specimens: pendingSpecimens, isLoading: loadingSpecimens, error: errorSpecimens } = usePendingSpecimens();
  const { criticalResults: openCriticalResults, isLoading: loadingCritical, error: errorCritical } = useCriticalResults('OPEN');
  const { data: tatData, isLoading: loadingTat, error: errorTat } = useTurnaroundMetrics();

  const isLoading = loadingSpecimens || loadingCritical || loadingTat;
  const hasError = errorSpecimens || errorCritical || errorTat;

  // ──── Derived Metrics ────
  const pendingCount = pendingSpecimens.length;
  const criticalOpenCount = openCriticalResults.length;
  const totalResults = tatData?.totalResults ?? 0;
  const releasedCount = tatData?.releasedCount ?? 0;
  const pendingResultsCount = tatData?.pendingCount ?? 0;

  const avgSpecToRelease = tatData?.metrics
    ?.find(m => m.field === 'specimenToRelease')?.averageMinutes ?? null;

  const missingTimestampCount = tatData?.metrics
    ?.reduce((sum, m) => sum + m.missingTimestampCount, 0) ?? 0;

  // ──── Map pending specimens to SpecimenItem format ────
  const specimenItems = pendingSpecimens.map(s => ({
    id: s.id,
    patientName: s.patientName,
    mrn: s.patientMrn,
    specimenType: s.specimenType,
    container: '—',
    testName: s.testNames?.join(', ') || s.specimenType,
    collectedTime: s.collectedAt ? format(new Date(s.collectedAt), 'hh:mm a') : '—',
    status: s.status === 'RECEIVED' ? 'Received' as const : 'Collected' as const,
    urgency: 'Routine' as const,
  }));

  // ──── Map critical results to CriticalResultItem format ────
  const criticalItems = openCriticalResults.map(r => ({
    id: r.id,
    patientName: r.patientName,
    mrn: r.patientMrn,
    testName: r.testNames?.join(', ') || 'Lab Result',
    parameterName: '',
    value: 'Critical',
    refRange: '',
    physicianName: '',
    physicianPhone: '',
    reportedAt: r.encodedAt ? format(new Date(r.encodedAt), 'MMM dd, hh:mm a') : 'Unknown',
    isNotified: false,
  }));

  // ──── TAT cards from real data ────
  const tatCards = tatData?.metrics
    ?.filter(m => m.count > 0)
    ?.map(m => ({
      testName: m.label,
      targetMinutes: 0,
      averageMinutes: m.averageMinutes || 0,
      complianceRate: 1,
      totalTests: m.count,
      overdueCount: 0,
    })) ?? [];

  // ──── Loading State ────
  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <Loader2 className="mx-auto w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading Lab Dashboard...</p>
      </div>
    );
  }

  // ──── Error State ────
  if (hasError) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Failed to load lab dashboard data. Please check your network connection or try again later.
        </p>
      </div>
    );
  }

  // ──── Metrics Cards ────
  const metricsCards = [
    { label: 'Pending Specimens', count: pendingCount, icon: FlaskConical, color: 'text-amber-600 bg-amber-50 border-amber-105', route: '/lab/specimens' },
    { label: 'Total Lab Results', count: totalResults, icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-105', route: '/lab/encoding' },
    { label: 'Released Results', count: releasedCount, icon: Send, color: 'text-emerald-600 bg-emerald-50 border-emerald-105', route: '/lab/release' },
    { label: 'In Progress', count: pendingResultsCount, icon: CheckSquare, color: 'text-violet-600 bg-violet-50 border-violet-105', route: '/lab/encoding' },
    { label: 'Open Critical', count: criticalOpenCount, icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 border-rose-105', route: '/lab/critical-results' },
    { label: 'Avg TAT (Spec→Rel)', count: avgSpecToRelease !== null ? `${avgSpecToRelease}m` : '—', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50 border-indigo-105', route: '/lab/turnaround' },
    { label: 'Missing Timestamps', count: missingTimestampCount, icon: AlertTriangle, color: 'text-slate-600 bg-slate-50 border-slate-105', route: '/lab/turnaround' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* WIP Banner */}
      <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex gap-3 text-xs text-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Laboratory Dashboard (Partial — Real Metrics)</h5>
          <p className="font-medium mt-0.5">
            Dashboard metrics come from real lab APIs (pending specimens, critical results, turnaround). Specimen tracking, result workflow pages, and release are Real. Full LIS analytics, SLA breach detection, trend forecasting, and analyzer integration remain out of scope.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader 
          title="Laboratory Dashboard" 
          description="Lab technician workspace for tracking specimens, encoding diagnostics, validating assays, and releasing clinical results." 
        />
      </div>

      {/* Grid: High-level KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {metricsCards.map((m, index) => {
          const Icon = m.icon;
          return (
            <button
              key={index}
              onClick={() => navigate(m.route)}
              className="card p-4 flex flex-col justify-between gap-4 bg-white border border-slate-200/80 shadow-sm rounded-2xl hover:shadow-md hover:border-indigo-200 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl border ${m.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-lg font-black text-slate-800">{m.count}</span>
              </div>
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 leading-tight">{m.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard title="Turnaround time trend" description="Sandbox trend overlaid with live TAT summaries when APIs are expanded." height={280}>
          <TrendLineChart data={labTrendData} title="Lab turnaround time trend" valueLabel="Orders" secondaryLabel="Completed" />
        </ChartCard>
        <ChartCard title="Pending vs completed status" description="Decision chart for validation/release queue pressure." height={280}>
          <StatusDonutChart data={labStatusBreakdown} title="Lab status breakdown" />
        </ChartCard>
        <InsightPanel insights={labInsights} title="Lab operations alerts" />
      </div>

      {/* Grid Layout: Main queue, alerts, and quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Specimen Worklist & Critical Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {specimenItems.length > 0 ? (
            <SpecimenWorkQueue specimens={specimenItems} limit={5} />
          ) : (
            <div className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
              <p className="text-xs text-slate-400 font-semibold">No pending specimens to display.</p>
            </div>
          )}
          
          {criticalItems.length > 0 ? (
            <CriticalResultPanel items={criticalItems} />
          ) : (
            <div className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center">
              <p className="text-xs text-slate-400 font-semibold">No open critical results.</p>
            </div>
          )}
        </div>

        {/* Right Column: Turnaround time & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4 rounded-2xl">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase border-b border-slate-100 pb-3">
              Laboratory Actions
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <button 
                onClick={() => navigate('/lab/orders')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-indigo-500" />
                  View Lab Orders Queue
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => navigate('/lab/specimens')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-indigo-500" />
                  Specimen Receiving Desk
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => navigate('/lab/encoding')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Result Entry & Encoding
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => navigate('/lab/validation')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-indigo-500" />
                  Verification & Validation
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>

              <button 
                onClick={() => navigate('/lab/release')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl text-left text-xs font-semibold text-slate-700 group transition-all"
              >
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-indigo-500" />
                  Release Final Results
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Turnaround time widget */}
          {tatCards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  TAT Metrics
                </h3>
                <button
                  onClick={() => navigate('/lab/turnaround')}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Details
                </button>
              </div>

              <div className="space-y-3.5">
                {tatCards.map((tat, idx) => (
                  <TurnaroundTimeCard key={idx} data={tat} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabDashboard;
