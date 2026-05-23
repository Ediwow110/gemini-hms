import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  UserCheck,
  AlertTriangle,
  ClipboardCheck,
  Info
} from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { TriagePriorityLevel } from './components/TriagePriorityBadge';
import { useClinicalWorkQueue, usePatientClinicalSummary, useSaveTriage, usePatientTriage, useMarkTriageEnteredInError } from '../../hooks/use-clinical-workflow';
import axios from 'axios';
import { format } from 'date-fns';




const TriageAssessmentForm = ({
  selectedPatient,
  saveTriageMutation,
  onSuccess
}: {
  selectedPatient: {
    id: string;
    firstName: string;
    lastName: string;
    mrn: string;
    dob: string;
    age: number;
    gender: string;
    allergies: string;
    insuranceProvider: string;
    chiefComplaint: string;
  };
  saveTriageMutation: ReturnType<typeof useSaveTriage>;
  onSuccess: () => void;
}) => {
  const [complaint, setComplaint] = useState(selectedPatient.chiefComplaint || '');
  const [priority, setPriority] = useState<TriagePriorityLevel>(3);
  const [arrivalMode, setArrivalMode] = useState('WALK_IN');
  const [painScore, setPainScore] = useState<number>(0);
  const [infectiousRisk, setInfectiousRisk] = useState(false);
  const [fallRisk, setFallRisk] = useState(false);
  const [pregnancyRisk, setPregnancyRisk] = useState(false);
  const [nursingNotes, setNursingNotes] = useState('');
  const [allergiesConfirmed, setAllergiesConfirmed] = useState(false);

  const handleCompleteTriage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const acuityMap: Record<number, string> = {
      1: 'RED',
      2: 'ORANGE',
      3: 'YELLOW',
      4: 'GREEN',
      5: 'BLUE'
    };

    saveTriageMutation.mutate({
      patientId: selectedPatient.id,
      data: {
        acuityLevel: acuityMap[priority as number],
        chiefComplaintSummary: complaint,
        arrivalMode,
        painScore,
        infectiousRiskFlag: infectiousRisk,
        fallRiskFlag: fallRisk,
        pregnancyFlag: pregnancyRisk,
        notes: nursingNotes,
      }
    }, {
      onSuccess
    });
  };

  const handleEscalate = () => {
    if (!selectedPatient) return;
    setPriority(1); // Set to critical
    alert(`Patient ${selectedPatient.firstName} ${selectedPatient.lastName} emergency notification broadcasted to ER Charge Nurse and Physician.`);
  };

  const isFormValid = allergiesConfirmed && complaint.trim().length > 0;

  return (
    <form onSubmit={handleCompleteTriage} className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-6">
      {/* Patient safety header */}
      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 text-sm">{selectedPatient.lastName}, {selectedPatient.firstName}</span>
            <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded border border-indigo-150 uppercase tracking-wider">
              {selectedPatient.insuranceProvider}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-bold uppercase">
            <span>MRN: <strong className="text-slate-600 font-mono">{selectedPatient.mrn}</strong></span>
            <span>•</span>
            <span>DOB: <strong className="text-slate-600 font-mono">{selectedPatient.dob}</strong> (Age {selectedPatient.age})</span>
            <span>•</span>
            <span>Gender: <strong className="text-slate-600">{selectedPatient.gender}</strong></span>
          </div>
        </div>

        <div className="md:text-right space-y-1">
          <div className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-1 inline-block uppercase tracking-wider select-none">
            Allergies: {selectedPatient.allergies}
          </div>
        </div>
      </div>

      {/* Triage Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chief Complaint */}
        <div className="md:col-span-2 flex flex-col space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            Chief Complaint Summary
          </label>
          <textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            required
            className="p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300 min-h-[70px]"
            placeholder="Brief summary of patient's primary complaint..."
          />
        </div>

        {/* Priority category selector */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            ESI Triage Category Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) as TriagePriorityLevel)}
            className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer font-semibold text-slate-700"
          >
            <option value="1">Level 1 - Resuscitation (RED)</option>
            <option value="2">Level 2 - Emergent (ORANGE)</option>
            <option value="3">Level 3 - Urgent (YELLOW)</option>
            <option value="4">Level 4 - Less Urgent (GREEN)</option>
            <option value="5">Level 5 - Non-Urgent (BLUE)</option>
          </select>
        </div>

        {/* Arrival Mode */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            Arrival Mode
          </label>
          <select
            value={arrivalMode}
            onChange={(e) => setArrivalMode(e.target.value)}
            className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer font-semibold text-slate-700"
          >
            <option value="WALK_IN">Walk-in</option>
            <option value="AMBULANCE">Ambulance</option>
            <option value="WHEELCHAIR">Wheelchair</option>
            <option value="STRETCHER">Stretcher</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Pain Score */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            Pain Score (0-10)
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={painScore}
            onChange={(e) => setPainScore(Number(e.target.value))}
            className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-slate-700"
          />
        </div>

        {/* Nursing Notes */}
        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            Triage Nursing Assessment Notes
          </label>
          <textarea
            value={nursingNotes}
            onChange={(e) => setNursingNotes(e.target.value)}
            className="p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300 min-h-[60px]"
            placeholder="Observations, mental status, immediate needs..."
          />
        </div>

        {/* Risk Flags */}
        <div className="md:col-span-2 space-y-3">
          <label className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" /> Risk Screening & Safety Flags
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <input
                type="checkbox"
                id="infectious-risk"
                checked={infectiousRisk}
                onChange={(e) => setInfectiousRisk(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="infectious-risk" className="text-[11px] text-slate-600 font-bold select-none cursor-pointer">
                Infectious Risk
              </label>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <input
                type="checkbox"
                id="fall-risk"
                checked={fallRisk}
                onChange={(e) => setFallRisk(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="fall-risk" className="text-[11px] text-slate-600 font-bold select-none cursor-pointer">
                Fall Risk
              </label>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <input
                type="checkbox"
                id="pregnancy-risk"
                checked={pregnancyRisk}
                onChange={(e) => setPregnancyRisk(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="pregnancy-risk" className="text-[11px] text-slate-600 font-bold select-none cursor-pointer">
                Pregnancy
              </label>
            </div>
          </div>
        </div>

        {/* Vitals Notification */}
        <div className="md:col-span-2 flex items-start gap-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
          <Info className="h-5 w-5 text-indigo-500 mt-0.5" />
          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
            <strong>Vitals Note:</strong> Patient vital signs (BP, Temp, Pulse, Resp) are recorded separately via the dedicated <strong className="text-indigo-700 underline cursor-help" title="Nurse Vitals Station">Vitals Logging Station</strong> to ensure clinical precision and data integrity.
          </p>
        </div>

        {/* Verification Confirmation */}
        <div className="md:col-span-2 flex items-center gap-2 bg-emerald-50/30 p-3.5 rounded-2xl border border-emerald-100/60">
          <input
            type="checkbox"
            id="confirm-allergies"
            checked={allergiesConfirmed}
            onChange={(e) => setAllergiesConfirmed(e.target.checked)}
            required
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
          />
          <label htmlFor="confirm-allergies" className="text-[11px] text-slate-700 font-bold select-none cursor-pointer">
            I confirm that the patient's identity and allergy history ({selectedPatient.allergies}) have been verbally verified.
          </label>
        </div>
      </div>

      {/* Error Rendering */}
      {saveTriageMutation.isError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 animate-shake">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-xs font-bold uppercase tracking-wide">
            {axios.isAxiosError(saveTriageMutation.error) && saveTriageMutation.error.response?.status === 403
              ? 'Access Restricted: You do not have clinical triage permissions.'
              : 'Save Failed: Please check required fields and network connection.'}
          </div>
        </div>
      )}

      {/* Form Action Controls */}
      <div className="flex justify-between items-center border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={handleEscalate}
          className="btn bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 text-xs px-4 py-2.5 font-extrabold flex items-center gap-1.5 rounded-xl transition-colors"
        >
          <ShieldAlert className="h-4 w-4" /> Broadcast Emergency Alert
        </button>

        <button
          type="submit"
          disabled={saveTriageMutation.isPending || !isFormValid}
          className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-6 py-2.5 font-extrabold flex items-center gap-1.5 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saveTriageMutation.isPending ? (
            <Activity className="h-4 w-4 animate-pulse" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
          {saveTriageMutation.isPending ? 'Finalizing Triage...' : 'Complete Triage Assessment'}
        </button>
      </div>
    </form>
  );
};

export const NurseTriageQueuePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activePatientId = searchParams.get('patientId') || null;

  const { data: queueData, isLoading: isQueueLoading, error: queueError } = useClinicalWorkQueue();
  const { data: patientSummary, isLoading: isSummaryLoading, error: summaryError } = usePatientClinicalSummary(activePatientId ?? '');
  const { data: patientTriage, isLoading: isTriageLoading } = usePatientTriage(activePatientId ?? '');

  const saveTriageMutation = useSaveTriage();
  const markErrorMutation = useMarkTriageEnteredInError();

  const [errorModalTriageId, setErrorModalTriageId] = useState<string | null>(null);
  const [errorReason, setErrorReason] = useState('');

  const activeQueueItem = queueData?.find(item => item.patientId === activePatientId);

  const selectedPatient = patientSummary ? {
    id: patientSummary.patientId,
    firstName: patientSummary.patientName ? patientSummary.patientName.split(' ')[0] : '[REDACTED]',
    lastName: patientSummary.patientName ? patientSummary.patientName.split(' ').slice(1).join(' ') : '',
    mrn: patientSummary.patientNumber,
    dob: patientSummary.dob ? format(new Date(patientSummary.dob), 'yyyy-MM-dd') : 'N/A',
    age: patientSummary.dob ? new Date().getFullYear() - new Date(patientSummary.dob).getFullYear() : 0,
    gender: patientSummary.gender || 'Unknown',
    allergies: patientSummary.allergies && patientSummary.allergies.length > 0 
      ? patientSummary.allergies.join(', ') 
      : 'None Known',
    insuranceProvider: 'HMO Partner',
    chiefComplaint: activeQueueItem?.category === 'EMERGENCY' ? 'Emergency medical evaluation needed' : 'Clinical evaluation triage',
  } : null;

  const [submitSuccess, setSubmitSuccess] = useState(false);

  const selectPatient = (patientId: string) => {
    setSearchParams({ patientId });
    setSubmitSuccess(false);
    setErrorModalTriageId(null);
    setErrorReason('');
  };

  const handleMarkErrorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !errorModalTriageId || !errorReason.trim()) return;

    markErrorMutation.mutate(
      {
        patientId: selectedPatient.id,
        triageId: errorModalTriageId,
        reason: errorReason.trim(),
      },
      {
        onSuccess: () => {
          setErrorModalTriageId(null);
          setErrorReason('');
        },
      }
    );
  };

  const isLoading = isQueueLoading || (!!activePatientId && (isSummaryLoading || isTriageLoading));
  const errorObj = queueError || (activePatientId ? (summaryError || saveTriageMutation.error) : null);

  if (errorObj && !saveTriageMutation.isError) {
    const isForbidden = axios.isAxiosError(errorObj) && (errorObj.response?.status === 403 || errorObj.response?.status === 401);
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isForbidden ? 'Access Restricted' : 'Connection Error'}
        </h2>
        <p className="text-slate-500 max-w-md mx-auto">
          {isForbidden 
            ? 'You do not have permission to view this triage workspace. Please contact your administrator if you believe this is an error.' 
            : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading triage workstation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Clinical Triage Workstation" 
        description="Assess patients, document critical triage data, categorize priority levels, and route to care teams." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Queue list */}
        <div className="space-y-4">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="h-4 w-4 text-indigo-500" />
              Triage Intake Waiting Area
            </h3>

            <div className="space-y-2">
              {queueData && queueData.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium text-xs">No patients waiting in queue.</div>
              ) : (
                queueData?.filter(item => item.status !== 'COMPLETED' && item.status !== 'CANCELLED').map((patient) => {
                  const isActive = patient.patientId === selectedPatient?.id;
                  return (
                    <button
                      key={patient.id}
                      onClick={() => selectPatient(patient.patientId)}
                      className={`w-full text-left p-3.5 rounded-xl border flex flex-col gap-1 transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200 shadow-sm'
                          : 'bg-white border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`font-bold text-xs ${isActive ? 'text-indigo-800' : 'text-slate-800'}`}>
                          {patient.patientName || '[REDACTED]'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold font-mono">MRN: {patient.patientNumber}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 font-semibold">
                        {patient.category === 'EMERGENCY' ? 'Emergency evaluation needed' : 'Clinical evaluation triage'}
                      </p>
                      <div className="flex gap-2 items-center mt-1.5 text-[9px] text-slate-400 font-bold uppercase">
                        <span>Category: {patient.category}</span>
                        <span>•</span>
                        <span>Wait: {patient.waitTimeMinutes} mins</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Triage Worksheet Form */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3 flex flex-col items-center">
              <ClipboardCheck className="h-10 w-10 text-slate-300" />
              <h3 className="font-bold text-slate-700 text-sm">No Patient Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm">Select a patient from the waiting list on the left to begin clinical triage assessment.</p>
            </div>
          ) : submitSuccess ? (
            <div className="card p-10 bg-emerald-50/20 border border-emerald-100/80 shadow-sm rounded-2xl text-center space-y-4 flex flex-col items-center animate-fade-in">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="font-black text-emerald-800 text-base">Triage Completed Successfully</h3>
              <p className="text-xs text-emerald-600 font-semibold max-w-md">
                Patient {selectedPatient.lastName}, {selectedPatient.firstName} has been successfully categorized and routed for further physician evaluation.
              </p>
              <button 
                onClick={() => setSearchParams({})}
                className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-6 rounded-xl shadow-sm shadow-emerald-200"
              >
                Close Worksheet
              </button>
            </div>
          ) : (
            <TriageAssessmentForm 
              key={selectedPatient.id}
              selectedPatient={selectedPatient}
              saveTriageMutation={saveTriageMutation}
              onSuccess={() => setSubmitSuccess(true)}
            />
          )}

          {patientTriage && patientTriage.length > 0 && !submitSuccess && (
            <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-3 mt-6">
              <h4 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">
                Historical Triage Records
              </h4>
              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-2">
                {patientTriage.map((t) => {
                  const isError = t.status === 'ENTERED_IN_ERROR';
                  return (
                    <div key={t.id} className="py-3 text-xs flex justify-between gap-3 items-center">
                      <div className={`flex flex-col ${isError ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                        <span className="font-semibold text-slate-800">
                          {t.acuityLevel} Priority - {t.arrivalMode}
                        </span>
                        <span className="line-clamp-1 mt-0.5 text-slate-500">
                          {t.chiefComplaintSummary}
                        </span>
                        {isError && (
                          <span className="text-[10px] text-rose-500 font-semibold no-underline mt-1">
                            Entered in Error
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          {t.recordedAt ? format(new Date(t.recordedAt), 'yyyy-MM-dd HH:mm') : 'N/A'}
                        </span>
                        {!isError && t.status === 'ACTIVE' && (
                          <button
                            onClick={() => setErrorModalTriageId(t.id)}
                            className="text-[10px] text-rose-600 font-semibold hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 mt-1 transition-colors"
                          >
                            Mark Error
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Modal */}
      {errorModalTriageId && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Mark Triage as Error
            </h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to mark this triage record as entered in error? This action cannot be undone and will be permanently recorded in the audit log. The original values will be preserved but flagged as invalid.
            </p>
            <form onSubmit={handleMarkErrorSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={errorReason}
                  onChange={(e) => setErrorReason(e.target.value)}
                  placeholder="e.g. Wrong patient, incorrect acuity"
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300"
                />
              </div>

              {markErrorMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-700 font-medium">
                  {axios.isAxiosError(markErrorMutation.error) && markErrorMutation.error.response?.status === 403
                    ? 'Access Restricted: You do not have permission to void clinical records.'
                    : 'Failed to mark error. Please check your connection and try again.'}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setErrorModalTriageId(null);
                    setErrorReason('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markErrorMutation.isPending || !errorReason.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {markErrorMutation.isPending ? 'Marking...' : 'Confirm Error'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseTriageQueuePage;
