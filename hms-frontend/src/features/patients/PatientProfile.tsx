import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PlusCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { useUser } from "../../hooks/use-user";
import { PatientNoteForm } from "../notes/PatientNoteForm";
import { HmsDashboardShell, HmsAuditFooter, HmsLoadingSkeleton } from "../../components/hms-dashboard";
import { doctorService } from "../../services/doctor.service";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInYears } from "date-fns";

export const PatientProfile = () => {
  const navigate = useNavigate();
  const { id: patientId } = useParams<{ id: string }>();
  const user = useUser();
  const [activeTab, setActiveTab] = React.useState("Overview");

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => doctorService.getPatient(patientId!),
    enabled: !!patientId,
    retry: false,
  });

  const tabs = ["Overview", "Orders", "Billing", "Lab Results", "Documents", "Timeline", "Notes"];

  const age = patient ? differenceInYears(new Date(), new Date(patient.dob)) : null;

  return (
    <HmsDashboardShell
      widthTier="full"
      footer={
        <HmsAuditFooter
          dataSource="Live API — /api/v1/patients/:id"
        />
      }
    >
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {error && (
              <div
                role="alert"
                data-testid="patient-profile-error"
                className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 items-start shadow-sm mb-4"
              >
                <div className="p-2 bg-rose-100 rounded-xl shrink-0">
                  <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-900 tracking-tight">
                    Could not load patient data
                  </h4>
                  <p className="text-xs text-rose-800 font-medium leading-relaxed mt-1">
                    {error instanceof Error ? error.message : "An unexpected error occurred."}
                  </p>
                </div>
              </div>
            )}
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
              isLoading ? (
                <div data-testid="patient-profile-loading">
                  <HmsLoadingSkeleton rows={4} />
                </div>
              ) : patient ? (
                <div className="space-y-6 animate-fade-in" data-testid="patient-profile-overview">
                  <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-indigo-900 mb-4">Patient Demographics</h2>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Number</dt>
                        <dd className="text-sm font-bold text-slate-900 mt-0.5">{patient.patientNumber}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</dt>
                        <dd className="text-sm font-bold text-slate-900 mt-0.5">{patient.status}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</dt>
                        <dd className="text-sm font-bold text-slate-900 mt-0.5">{patient.lastName}, {patient.firstName}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age</dt>
                        <dd className="text-sm font-bold text-slate-900 mt-0.5">{age !== null ? `${age} years` : '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date of Birth</dt>
                        <dd className="text-sm font-bold text-slate-900 mt-0.5">{format(new Date(patient.dob), 'MMM dd, yyyy')}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Record Since</dt>
                        <dd className="text-sm font-bold text-slate-900 mt-0.5">{format(new Date(patient.createdAt), 'MMM dd, yyyy')}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : null
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
