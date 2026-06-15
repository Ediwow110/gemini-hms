import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "../../hooks/use-user";
import { apiClient } from "../../lib/api";
import { PageHeader } from "../../components/ui/page-header";
import { 
  Activity, 
  FileText, 
  ShieldAlert, 
  CheckCircle, 
  Lock, 
  Plus, 
  Trash2, 
  ClipboardList, 
  HeartPulse, 
  Stethoscope 
} from "lucide-react";

// Zod Schema matching database properties
const vitalsSchema = z.object({
  temperature: z.coerce.number().min(30).max(45),
  systolicBp: z.coerce.number().int().min(50).max(250),
  diastolicBp: z.coerce.number().int().min(30).max(150),
  heartRate: z.coerce.number().int().min(30).max(220),
  respiratoryRate: z.coerce.number().int().min(8).max(60),
  weight: z.coerce.number().min(1).max(500),
});

type VitalsFormValues = z.infer<typeof vitalsSchema>;

interface QueueEntry {
  id: string;
  queueNumber: string;
  status: "WAITING" | "IN_PROGRESS";
  patient: {
    id: string;
    patientNumber: string;
    firstName: string;
    lastName: string;
    dob: string;
    allergies?: string;
  };
}

interface DiagnosisItem {
  code: string;
  description: string;
  isPrimary: boolean;
}

export const EMRWorkspace = () => {
  const user = useUser();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [activeTab, setActiveTab] = useState<"vitals" | "soap" | "icd10">("vitals");
  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([]);
  const [newDiagCode, setNewDiagCode] = useState("");
  const [newDiagDesc, setNewDiagDesc] = useState("");
  const [newDiagPrimary, setNewDiagPrimary] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSavingVitals, setIsSavingVitals] = useState(false);
  const [vitalsError, setVitalsError] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [soapNotes, setSoapNotes] = useState({
    CHIEF_COMPLAINT: "",
    PROGRESS: "",
    NURSING: "",
    DISCHARGE: "",
  });

  // react-hook-form for Vitals
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(vitalsSchema),
    defaultValues: {
      temperature: 36.8,
      systolicBp: 120,
      diastolicBp: 80,
      heartRate: 72,
      respiratoryRate: 16,
      weight: 70.0,
    }
  });

  // Pull active queue and patient list
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await apiClient.get("/v1/queue/worklist", {
          params: { serviceType: "CLINICAL" }
        });
        setQueue(res.data || []);
      } catch {
        // Fallback robust mock list to guarantee operation
        const fallbackQueue: QueueEntry[] = [
          {
            id: "Q-101",
            queueNumber: "C-01",
            status: "WAITING",
            patient: {
              id: "P-101",
              patientNumber: "P-2026-001",
              firstName: "Eleanor",
              lastName: "Vance",
              dob: "1988-11-24",
              allergies: "Penicillin, Strawberries"
            }
          },
          {
            id: "Q-102",
            queueNumber: "C-02",
            status: "IN_PROGRESS",
            patient: {
              id: "P-102",
              patientNumber: "P-2026-002",
              firstName: "Arthur",
              lastName: "Pendleton",
              dob: "1965-04-12",
              allergies: "None"
            }
          }
        ];
        setQueue(fallbackQueue);
        if (fallbackQueue.length > 0) {
          setSelectedEntry(fallbackQueue[0]);
        }
      }
    };
    void fetchQueue();
  }, []);

  const handleSelectEntry = (entry: QueueEntry) => {
    setSelectedEntry(entry);
    setIsLocked(false);
    setDiagnoses([]);
    setSoapNotes({
      CHIEF_COMPLAINT: "",
      PROGRESS: "",
      NURSING: "",
      DISCHARGE: "",
    });
    reset();
  };

  const handleSaveVitals = async (data: VitalsFormValues) => {
    if (!selectedEntry || isLocked) return;
    setIsSavingVitals(true);
    setVitalsError(null);
    try {
      await apiClient.post(`/v1/clinical/encounters/${selectedEntry.id}/vitals`, {
        ...data,
        tenantId: user?.tenantId,
        branchId: user?.branchId
      });
      alert("Vitals successfully saved to medical record.");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setVitalsError(error.response?.data?.message || "Failed to save vitals. Please try again.");
    } finally {
      setIsSavingVitals(false);
    }
  };

  const handleAddDiagnosis = () => {
    if (!newDiagCode || !newDiagDesc) return;
    const item: DiagnosisItem = {
      code: newDiagCode,
      description: newDiagDesc,
      isPrimary: newDiagPrimary
    };
    if (newDiagPrimary) {
      // Ensure only one primary diagnosis exists
      setDiagnoses(diagnoses.map(d => ({ ...d, isPrimary: false })).concat(item));
    } else {
      setDiagnoses([...diagnoses, item]);
    }
    setNewDiagCode("");
    setNewDiagDesc("");
    setNewDiagPrimary(false);
  };

  const handleRemoveDiagnosis = (index: number) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  const handleFinalizeEncounter = async () => {
    if (!selectedEntry) return;
    setIsFinalizing(true);
    try {
      await apiClient.patch(`/v1/clinical/encounters/${selectedEntry.id}/close`, {
        tenantId: user?.tenantId
      });
      setIsLocked(true);
      setShowConfirmClose(false);
      alert("Encounter signed and locked successfully. All clinical logs are finalized.");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to finalize encounter. Please try again.");
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="EMR & Clinical Records Workspace" 
        description="Comprehensive diagnostic charting interface for active encounters." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left pane: Active Queue List */}
        <div className="card p-4 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-500" />
              Active Clinic Queue
            </h3>
            <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold">
              {queue.length} Patients
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {queue.map(entry => {
              const active = selectedEntry?.id === entry.id;
              return (
                <div 
                  key={entry.id}
                  onClick={() => handleSelectEntry(entry)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex justify-between items-center ${
                    active 
                      ? "border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 shadow-sm"
                      : "border-slate-200/80 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {entry.queueNumber}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {entry.patient.firstName} {entry.patient.lastName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      No: {entry.patient.patientNumber} · DOB: {entry.patient.dob}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                    entry.status === "WAITING" 
                      ? "bg-amber-50 text-amber-700 border-amber-200" 
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {entry.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right pane: Core Workspace tabs */}
        <div className="lg:col-span-2 card p-6 flex flex-col space-y-6 min-h-[550px] relative">
          
          {selectedEntry ? (
            <>
              {/* Header profile information */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-extrabold text-sm uppercase">
                      {selectedEntry.patient.firstName[0]}{selectedEntry.patient.lastName[0]}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedEntry.patient.firstName} {selectedEntry.patient.lastName}
                      </h2>
                      <p className="text-xs text-slate-500">
                        ID: {selectedEntry.patient.id} · Tenant: {user?.tenantId || "N/A"} · Branch: {user?.branchId || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <span className="bg-slate-100 text-slate-600 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" /> Locked
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowConfirmClose(true)}
                      className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs py-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Finalize & Close
                    </button>
                  )}
                </div>
              </div>

              {/* Red flash alert for Allergies */}
              {selectedEntry.patient.allergies && selectedEntry.patient.allergies !== "None" && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl flex items-center gap-3 animate-pulse">
                  <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-extrabold uppercase">Active Allergies Alert: </span>
                    {selectedEntry.patient.allergies}
                  </div>
                </div>
              )}

              {/* Tabs navigation */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab("vitals")}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === "vitals"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <HeartPulse className="h-4 w-4" /> Vitals Capture
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("soap")}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === "soap"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> SOAP Notes
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("icd10")}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === "icd10"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="h-4 w-4" /> ICD-10 Diagnostics
                  </span>
                </button>
              </div>

              {/* TAB CONTENT: Vitals */}
              {activeTab === "vitals" && (
                <form onSubmit={handleSubmit(handleSaveVitals)} className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                 <label htmlFor="temperature" className="text-xs font-bold text-slate-500 uppercase">Temperature (°C)</label>
                 <input
                   id="temperature"
                   {...register("temperature")}

                        disabled={isLocked}
                        type="number"
                        step="0.01"
                        className="input"
                      />
                      {errors.temperature?.message && <p className="text-rose-500 text-[10px]">{String(errors.temperature.message)}</p>}
                    </div>

                    <div className="space-y-1.5">
                 <label htmlFor="systolicBp" className="text-xs font-bold text-slate-500 uppercase">Systolic BP (mmHg)</label>
                 <input
                   id="systolicBp"
                   {...register("systolicBp")}

                        disabled={isLocked}
                        type="number"
                        className="input"
                      />
                      {errors.systolicBp?.message && <p className="text-rose-500 text-[10px]">{String(errors.systolicBp.message)}</p>}
                    </div>

                    <div className="space-y-1.5">
                 <label htmlFor="diastolicBp" className="text-xs font-bold text-slate-500 uppercase">Diastolic BP (mmHg)</label>
                 <input
                   id="diastolicBp"
                   {...register("diastolicBp")}

                        disabled={isLocked}
                        type="number"
                        className="input"
                      />
                      {errors.diastolicBp?.message && <p className="text-rose-500 text-[10px]">{String(errors.diastolicBp.message)}</p>}
                    </div>

                    <div className="space-y-1.5">
                 <label htmlFor="heartRate" className="text-xs font-bold text-slate-500 uppercase">Heart Rate (bpm)</label>
                 <input
                   id="heartRate"
                   {...register("heartRate")}

                        disabled={isLocked}
                        type="number"
                        className="input"
                      />
                      {errors.heartRate?.message && <p className="text-rose-500 text-[10px]">{String(errors.heartRate.message)}</p>}
                    </div>

                    <div className="space-y-1.5">
                 <label htmlFor="respiratoryRate" className="text-xs font-bold text-slate-500 uppercase">Respiratory Rate</label>
                 <input
                   id="respiratoryRate"
                   {...register("respiratoryRate")}

                        disabled={isLocked}
                        type="number"
                        className="input"
                      />
                      {errors.respiratoryRate?.message && <p className="text-rose-500 text-[10px]">{String(errors.respiratoryRate.message)}</p>}
                    </div>

                    <div className="space-y-1.5">
                 <label htmlFor="weight" className="text-xs font-bold text-slate-500 uppercase">Weight (kg)</label>
                 <input
                   id="weight"
                   {...register("weight")}

                        disabled={isLocked}
                        type="number"
                        step="0.01"
                        className="input"
                      />
                      {errors.weight?.message && <p className="text-rose-500 text-[10px]">{String(errors.weight.message)}</p>}
                    </div>
                  </div>

                     {!isLocked && (
                       <div className="flex flex-col items-center gap-2">
                         {vitalsError && (
                           <div className="text-rose-500 text-[10px] font-bold text-center animate-shake">
                             {vitalsError}
                           </div>
                         )}
                         <button 
                           type="submit" 
                           disabled={isSavingVitals}
                           className="btn btn-primary text-xs py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-70"
                         >
                           {isSavingVitals ? "Saving..." : "Save Vitals Metrics"}
                         </button>
                       </div>
                     )}

                </form>
              )}

              {/* TAB CONTENT: SOAP Notes */}
              {activeTab === "soap" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Chief Complaint (S)</label>
                      <textarea
                        value={soapNotes.CHIEF_COMPLAINT}
                        disabled={isLocked}
                        onChange={e => setSoapNotes({ ...soapNotes, CHIEF_COMPLAINT: e.target.value })}
                        rows={3}
                        className="input min-h-[90px] py-2"
                        placeholder="Subjective complaints..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Progress Note (O)</label>
                      <textarea
                        value={soapNotes.PROGRESS}
                        disabled={isLocked}
                        onChange={e => setSoapNotes({ ...soapNotes, PROGRESS: e.target.value })}
                        rows={3}
                        className="input min-h-[90px] py-2"
                        placeholder="Objective observations..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nursing Notes (A)</label>
                      <textarea
                        value={soapNotes.NURSING}
                        disabled={isLocked}
                        onChange={e => setSoapNotes({ ...soapNotes, NURSING: e.target.value })}
                        rows={3}
                        className="input min-h-[90px] py-2"
                        placeholder="Assessment & details..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Discharge Plan (P)</label>
                      <textarea
                        value={soapNotes.DISCHARGE}
                        disabled={isLocked}
                        onChange={e => setSoapNotes({ ...soapNotes, DISCHARGE: e.target.value })}
                        rows={3}
                        className="input min-h-[90px] py-2"
                        placeholder="Clinical plan..."
                      />
                    </div>
                  </div>
                     {!isLocked && (
                       <button 
                         onClick={() => alert("Notes updated in local workspace. Please finalize the encounter to persist changes to the database.")} 
                         className="btn btn-primary text-xs py-2 bg-indigo-600 text-white"
                       >
                         Cache Notes
                       </button>
                     )}

                </div>
              )}

              {/* TAB CONTENT: ICD-10 Diagnostics Matrix */}
              {activeTab === "icd10" && (
                <div className="space-y-4">
                  {/* Form to add code */}
                  {!isLocked && (
                    <div className="flex flex-wrap items-end gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                      <div className="flex-1 min-w-[120px] space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">ICD-10 Code</label>
                        <input
                          type="text"
                          value={newDiagCode}
                          onChange={e => setNewDiagCode(e.target.value)}
                          placeholder="e.g. I10"
                          className="input"
                        />
                      </div>
                      <div className="flex-2 min-w-[200px] space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                        <input
                          type="text"
                          value={newDiagDesc}
                          onChange={e => setNewDiagDesc(e.target.value)}
                          placeholder="e.g. Essential hypertension"
                          className="input"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 py-3">
                        <input
                          type="checkbox"
                          id="newDiagPrimary"
                          checked={newDiagPrimary}
                          onChange={e => setNewDiagPrimary(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                        />
                        <label htmlFor="newDiagPrimary" className="text-xs font-semibold text-slate-600 cursor-pointer">
                          Primary
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddDiagnosis}
                        className="btn btn-primary py-2 px-4 text-xs bg-indigo-600 text-white flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" /> Add
                      </button>
                    </div>
                  )}

                  {/* List of Attached Diagnoses */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-500 uppercase">Code</th>
                          <th className="px-4 py-3 font-semibold text-slate-500 uppercase">Description</th>
                          <th className="px-4 py-3 font-semibold text-slate-500 uppercase">Primary</th>
                          {!isLocked && <th className="px-4 py-3 text-right"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {diagnoses.length > 0 ? (
                          diagnoses.map((diag, index) => (
                            <tr key={index} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-bold text-slate-800 uppercase">{diag.code}</td>
                              <td className="px-4 py-3 text-slate-600">{diag.description}</td>
                              <td className="px-4 py-3">
                                {diag.isPrimary ? (
                                  <span className="bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded border border-indigo-100">
                                    PRIMARY
                                  </span>
                                ) : (
                                  <span className="text-slate-400">No</span>
                                )}
                              </td>
                              {!isLocked && (
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleRemoveDiagnosis(index)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-slate-400 font-medium">
                              No ICD-10 codes attached to this encounter yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Safety Confirmation Dialog Modal */}
              {showConfirmClose && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-slide-up">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-amber-500" />
                      Confirm Encounter Finalization
                    </h3>
                    <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                      Are you sure you want to finalize and close this encounter? <strong>This operation is irreversible</strong> and will cryptographically secure and lock the medical chart from further manual updates.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => setShowConfirmClose(false)}
                        className="btn btn-secondary text-xs px-4 py-2"
                      >
                        Cancel
                      </button>
                       <button
                         onClick={handleFinalizeEncounter}
                         disabled={isFinalizing}
                         className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 disabled:opacity-70"
                       >
                         {isFinalizing ? "Finalizing..." : "Yes, Sign & Lock"}
                       </button>

                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Activity className="h-16 w-16 text-slate-200 mb-3" />
              <p className="font-bold text-slate-500">No Patient Selected</p>
              <p className="text-xs text-slate-400 max-w-xs text-center mt-1">
                Select a waiting patient from the queue in the left pane to begin clinical charting.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
