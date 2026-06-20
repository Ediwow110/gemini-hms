import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PlusCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { useUser } from "../../hooks/use-user";
import { PatientNoteForm } from "../notes/PatientNoteForm";
import { HmsDashboardShell, HmsDataUnavailable, HmsAuditFooter } from "../../components/hms-dashboard";

export const PatientProfile = () => {
  const navigate = useNavigate();
  const { id: patientId } = useParams<{ id: string }>();
  const user = useUser();
  const [activeTab, setActiveTab] = React.useState("Overview");

  const tabs = ["Overview", "Orders", "Billing", "Lab Results", "Documents", "Timeline", "Notes"];

  return (
    <HmsDashboardShell
      widthTier="full"
      footer={
        <HmsAuditFooter
          dataSource="Live API — /api/v1/patients/:id (currently partial: Notes tab is live-wired; Demographics / Orders / Billing / Lab / Documents / Timeline are not yet wired in this build)"
        />
      }
    >
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Body-level sandbox notice: Demographics/Overview section is NOT live-wired in this
                build. Prior versions of this file rendered a hardcoded `John Doe, 45, M, Regular,
                $50` for any patient id, which presented fabricated identity as real. That has been
                replaced with the honest-stub pattern used across this repo. The Notes tab is
                genuinely live via PatientNoteForm. */}
            <div
              role="status"
              data-testid="patient-profile-shell-notice"
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start shadow-sm mb-4"
            >
              <div className="p-2 bg-amber-100 rounded-xl shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" aria-hidden="true" />
              </div>
              <div>
                <h4
                  data-testid="patient-profile-shell-title"
                  className="text-sm font-black text-amber-900 tracking-tight"
                >
                  Patient profile — Demographics tab is not live-wired in this build
                </h4>
                <p
                  data-testid="patient-profile-shell-body"
                  className="text-xs text-amber-800 font-medium leading-relaxed mt-1"
                >
                  Demographics, Orders, Billing, Lab Results, Documents, and Timeline panels do not
                  fetch from the HMS backend in this release. Showing any fabricated identity
                  (e.g. hardcoded name or balance) would be materially misleading. The patient id
                  from the URL is <span className="font-mono">{patientId ?? '(none)'}</span>; real
                  data for that record is not yet wired to this page. Only the Notes tab below is
                  live-wired in this build.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 ml-4 mt-2">
            <button onClick={() => navigate('/patients')} className="btn btn-secondary flex items-center gap-2 px-5 py-2.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={() => navigate('/orders/new')} className="btn btn-primary flex items-center gap-2 px-5 py-2.5 shadow-md shadow-indigo-200">
              <PlusCircle className="h-4 w-4" /> Create Order
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <nav className="flex space-x-1 px-4 pt-1 border-b border-slate-200 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 px-4 text-sm font-semibold whitespace-nowrap transition-all duration-200 relative rounded-t-lg ${
                  activeTab === tab
                    ? "text-indigo-600 bg-indigo-50/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
                )}
              </button>
            ))}
          </nav>
          <div className="p-6">
            {activeTab === "Overview" ? (
              <div className="space-y-6 animate-fade-in" data-testid="patient-profile-overview">
                <HmsDataUnavailable
                  sectionName="Patient Demographics"
                  expectedApi="GET /api/v1/patients/:id"
                  expectedPhase="next release — currently being wired"
                />
              </div>
            ) : activeTab === "Notes" ? (
              <div className="animate-fade-in">
                <PatientNoteForm
                  currentUserId={user?.id ?? ""}
                  patientId={patientId ?? "unknown"}
                />
              </div>
            ) : (
              <div className="py-16 text-center animate-fade-in">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-slate-400 text-lg">📋</span>
                </div>
                <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} data available yet.</p>
                <p className="text-xs text-slate-400 mt-1">Data will appear here once records are created.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </HmsDashboardShell>
  );
};
