import React from "react";
import { useNavigate } from "react-router-dom";
import FieldServiceShellNotice from "./components/FieldServiceShellNotice";
import FieldServiceScopeFilter from "./components/FieldServiceScopeFilter";
import TechnicianJobCard from "./components/TechnicianJobCard";
import RouteSummaryPanel from "./components/RouteSummaryPanel";
import OfflineSyncStatusCard from "./components/OfflineSyncStatusCard";
import { useFieldServiceJobs } from "../../hooks/use-field-service";
import { HmsPageHeader } from "../../components/hms-page";
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton, HmsEmptyState } from "../../components/hms-dashboard";
import { CheckCircle2, Clock, Loader2, Truck, WifiOff } from "lucide-react";
import { AnalyticsMetricCard, InsightPanel } from "../../components/analytics";
import {
  VolumeAreaChart,
  StatusDonutChart,
  ComparisonBarChart
} from "../../components/analytics/charts";
import { useUser } from "../../hooks/use-user";

const MOCK_COMPLETION_TIMELINE = [
  { label: "Mon", value: 8 },
  { label: "Tue", value: 12 },
  { label: "Wed", value: 10 },
  { label: "Thu", value: 15 },
  { label: "Fri", value: 14 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 5 },
];

const MOCK_SLA_AGING = [
  { label: "< 2h", value: 12 },
  { label: "2-4h", value: 8 },
  { label: "4-8h", value: 4 },
  { label: "8h+", value: 2 },
];

const MOCK_HANDOVER_STATUS = [
  { label: "Synced", value: 18, color: "#10b981" },
  { label: "Pending", value: 3, color: "#f59e0b" },
  { label: "Failed", value: 1, color: "#e11d48" },
];

export const FieldServiceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useUser();
  const { data: jobsData, isLoading, error } = useFieldServiceJobs();

  const deliveries = jobsData?.deliveries ?? [];
  const installations = jobsData?.installations ?? [];
  const allJobs = [...deliveries, ...installations];
  const inProgress = allJobs.filter(j => j.status === "IN_PROGRESS").length;
  const completed = allJobs.filter(j => j.status === "COMPLETED").length;

  const isAdmin = user.roles.includes("Super Admin") || user.roles.includes("Branch Admin");

  return (
    <HmsDashboardShell>
      <div className="space-y-6 pb-12">
        <HmsPageHeader
          title="Field Service Dashboard"
          description="Logistics monitoring and field technician operations"
          actions={
            <div className="flex items-center gap-3">
              <FieldServiceScopeFilter />
              {!isAdmin && (
                <button
                  onClick={() => navigate("/field-service/schedule")}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                >
                  My Schedule
                </button>
              )}
            </div>
          }
        />

        <FieldServiceShellNotice />

        {isLoading ? (
          <HmsLoadingSkeleton variant="kpi" />
        ) : error ? (
          <div className="p-10 text-center text-sm font-bold text-rose-500">
            Failed to load field service jobs.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsMetricCard title="Jobs Today" value={String(allJobs.length).padStart(2, "0")} icon={Truck} description="Live technician job assignments" severity="info" href="/field-service/schedule" />
            <AnalyticsMetricCard title="In Progress" value={String(inProgress).padStart(2, "0")} icon={Clock} description="Jobs currently underway" severity="warning" href="/field-service/deliveries" />
            <AnalyticsMetricCard title="Completed" value={String(completed).padStart(2, "0")} icon={CheckCircle2} description="Completed field work" severity="success" href="/field-service/proof-of-delivery" />
            <AnalyticsMetricCard title="Offline Sync" value="WIP" icon={WifiOff} description="Queued handovers and offline evidence" severity="warning" href="/field-service/offline-sync" />
          </div>
        )}

        <InsightPanel insights={[{ title: "Field dashboard stays route-first", description: "Technician jobs and route/offline readiness remain more important than executive charts for mobile users.", severity: "info", actionLabel: "Open Schedule", actionTo: "/field-service/schedule" }]} title="Field service insights" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
            <h3 className="mb-4 text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
              <span>Job Completion Timeline</span>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">DEMO</span>
            </h3>
            <div className="h-[calc(100%-3rem)]">
              <VolumeAreaChart
                data={MOCK_COMPLETION_TIMELINE}
                title="Job Completion"
                valueLabel="Completed"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
            <h3 className="mb-4 text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
              <span>SLA Response / Aging</span>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">DEMO</span>
            </h3>
            <div className="h-[calc(100%-3rem)]">
              <ComparisonBarChart
                data={MOCK_SLA_AGING}
                title="SLA Aging"
                valueLabel="Jobs Count"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-72">
            <h3 className="mb-4 text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
              <span>Handover Sync Posture</span>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">DEMO</span>
            </h3>
            <div className="h-[calc(100%-3rem)]">
              <StatusDonutChart
                data={MOCK_HANDOVER_STATUS}
                title="Handover Status"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
              {isAdmin ? "Global Job Queue" : "Upcoming Job Queue"}
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Could not load job queue.</p>
              </div>
            ) : allJobs.length === 0 ? (
              <HmsEmptyState title="No active jobs" description="No active jobs assigned." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliveries.map((j) => (
                  <TechnicianJobCard
                    key={j.id}
                    id={`DEL-${j.id}`}
                    type="DELIVERY"
                    customer={j.customer}
                    address={j.address}
                    time="SLA: Immediate"
                    status={j.status}
                    onAction={() => navigate("/field-service/deliveries")}
                  />
                ))}
                {installations.map((j) => (
                  <TechnicianJobCard
                    key={j.id}
                    id={`INS-${j.id}`}
                    type="INSTALLATION"
                    customer={j.customer}
                    address={j.address}
                    time="SLA: Next Day"
                    status={j.status}
                    onAction={() => navigate("/field-service/installations")}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <RouteSummaryPanel />
            <OfflineSyncStatusCard />
          </div>
        </div>
      </div>
      <HmsAuditFooter />
    </HmsDashboardShell>
  );
};

export default FieldServiceDashboard;
