import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  UserCheck,
  AlertTriangle,
  ClipboardCheck,
  Info,
  History
} from 'lucide-react';
import { TriagePriorityLevel } from './components/TriagePriorityBadge';
import { 
  useClinicalWorkQueue, 
  usePatientClinicalSummary, 
  useSaveTriage, 
  usePatientTriage, 
  useMarkTriageEnteredInError 
} from '../../hooks/use-clinical-workflow';
import { useUser } from '../../hooks/use-user';
import { HmsDashboardShell, HmsToolbar, HmsAuditFooter } from '../../components/hms-dashboard';
import { HmsPageHeader, HmsSafetyBar, HmsFormContainer } from '../../components/hms-page';
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
    <div className="space-y-3">
      <HmsSafetyBar
        patientName={`${selectedPatient.lastName}, ${selectedPatient.firstName}`}
        mrn={selectedPatient.mrn}
        dob={selectedPatient.dob}
        age={selectedPatient.age}
        gender={selectedPatient.gender}
        allergies={selectedPatient.allergies}
        insurance={selectedPatient.insuranceProvider}
      />

      <HmsFormContainer
        title="Triage Assessment Form"
        description="Verify patient identity, assess acuity tier, arrival, pain profile, and safety alert screening."
        onSubmit={handleCompleteTriage}
        columns={2}
        error={
          saveTriageMutation.isError
            ? axios.isAxiosError(saveTriageMutation.error) && saveTriageMutation.error.response?.status === 403
              ? 'Access Restricted: You do not have clinical triage permissions.'
              : 'Save Failed: Please check required fields and network connection.'
            : null
        }
        actions={
          <>
            <button
              type="button"
              onClick={handleEscalate}
              className="px-3 py-1.5 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold flex items-center gap-1.5 rounded-lg transition-colors"
            >
              <ShieldAlert className="h-3.5 w-3.5" /> Broadcast Emergency Alert
            </button>

            <button
              type="submit"
              disabled={saveTriageMutation.isPending || !isFormValid}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-755 text-white text-[11px] font-bold flex items-center gap-1.5 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saveTriageMutation.isPending ? (
                <Activity className="h-3.5 w-3.5 animate-pulse" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              {saveTriageMutation.isPending ? 'Finalizing Triage...' : 'Complete Triage Assessment'}
            </button>
          </>
        }
      >
        {/* Chief Complaint */}
        <div className="md:col-span-2 flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
            Chief Complaint Summary <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            required
            className="p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans min-h-[60px]"
            placeholder="Brief summary of patient's primary complaint..."
          />
        </div>

        {/* Priority category selector */}
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
            ESI Triage Category Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) as TriagePriorityLevel)}
            className="p-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-semibold text-slate-700 font-sans"
          >
            <option value="1">Level 1 - Resuscitation (RED)</option>
            <option value="2">Level 2 - Emergent (ORANGE)</option>
            <option value="3">Level 3 - Urgent (YELLOW)</option>
            <option value="4">Level 4 - Less Urgent (GREEN)</option>
            <option value="5">Level 5 - Non-Urgent (BLUE)</option>
          </select>
        </div>

        {/* Arrival Mode */}
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
            Arrival Mode
          </label>
          <select
            value={arrivalMode}
            onChange={(e) => setArrivalMode(e.target.value)}
            className="p-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-semibold text-slate-700 font-sans"
          >
            <option value="WALK_IN">Walk-in</option>
            <option value="AMBULANCE">Ambulance</option>
            <option value="WHEELCHAIR">Wheelchair</option>
            <option value="STRETCHER">Stretcher</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Pain Score */}
        <div className="flex flex-col space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
            Pain Score (0-10)
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={painScore}
            onChange={(e) => setPainScore(Number(e.target.value))}
            className="p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700 font-sans"
          />
        </div>

        {/* Nursing Notes */}
        <div className="flex flex-col space-y-1 md:col-span-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">
            Triage Nursing Assessment Notes
          </label>
          <textarea
            value={nursingNotes}
            onChange={(e) => setNursingNotes(e.target.value)}
            className="p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans min-h-[60px]"
            placeholder="Observations, mental status, immediate needs..."
          />
        </div>

        {/* Risk Flags */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 font-sans">
            <ShieldAlert className="h-3.5 w-3.5 text-blue-500" /> Risk Screening & Safety Flags
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
              <input
                type="checkbox"
                id="infectious-risk"
                checked={infectiousRisk}
                onChange={(e) => setInfectiousRisk(e.target.checked)}
                className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="infectious-risk" className="text-[11px] text-slate-700 font-bold select-none cursor-pointer font-sans">
                Infectious Risk
              </label>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
              <input
                type="checkbox"
                id="fall-risk"
                checked={fallRisk}
                onChange={(e) => setFallRisk(e.target.checked)}
                className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="fall-risk" className="text-[11px] text-slate-700 font-bold select-none cursor-pointer font-sans">
                Fall Risk
              </label>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
              <input
                type="checkbox"
                id="pregnancy-risk"
                checked={pregnancyRisk}
                onChange={(e) => setPregnancyRisk(e.target.checked)}
                className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="pregnancy-risk" className="text-[11px] text-slate-700 font-bold select-none cursor-pointer font-sans">
                Pregnancy
              </label>
            </div>
          </div>
        </div>

        {/* Vitals Notification */}
        <div className="md:col-span-2 flex items-start gap-2 bg-blue-50/40 p-2.5 rounded-lg border border-blue-100/60">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-650 font-medium leading-relaxed font-sans">
            <strong>Vitals Note:</strong> Patient vital signs (BP, Temp, Pulse, Resp) are recorded separately via the dedicated <strong className="text-blue-700 underline cursor-help" title="Nurse Vitals Station">Vitals Logging Station</strong> to ensure clinical precision and data integrity.
          </p>
        </div>

        {/* Verification Confirmation */}
        <div className="md:col-span-2 flex items-center gap-2 bg-emerald-50/30 p-2.5 rounded-lg border border-emerald-100/50">
          <input
            type="checkbox"
            id="confirm-allergies"
            checked={allergiesConfirmed}
            onChange={(e) => setAllergiesConfirmed(e.target.checked)}
            required
            className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
          />
          <label htmlFor="confirm-allergies" className="text-[11px] text-slate-700 font-bold select-none cursor-pointer font-sans">
            I confirm that the patient's identity and allergy history ({selectedPatient.allergies}) have been verbally verified.
          </label>
        </div>
      </HmsFormContainer>
    </div>
  );
};

export const NurseTriageQueuePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activePatientId = searchParams.get('patientId') || null;
  const user = useUser();

  const { data: queueData, isLoading: isQueueLoading, error: queueError, refetch: refetchQueue, dataUpdatedAt } = useClinicalWorkQueue();
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
    insuranceProvider: 'Unavailable',
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

  const content = () => {
    if (errorObj && !saveTriageMutation.isError) {
      const isForbidden = axios.isAxiosError(errorObj) && (errorObj.response?.status === 403 || errorObj.response?.status === 401);
      return (
        <div className="p-6 text-center bg-white border border-slate-200 rounded-lg shadow-sm space-y-3">
          <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">
            {isForbidden ? 'Access Restricted' : 'Connection Error'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans leading-relaxed">
            {isForbidden 
              ? 'You do not have permission to view this triage workspace. Please contact your administrator if you believe this is an error.' 
              : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
          </p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-lg shadow-sm space-y-3">
          <div className="animate-spin mx-auto w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          <p className="text-xs text-slate-500 font-medium tracking-wide animate-pulse font-sans">Loading clinical intake workstation...</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Left Column: High-density waiting list queue */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase flex items-center gap-1.5 font-sans">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              Triage Intake Waiting Area
            </h3>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-lg font-sans">
              {queueData?.filter(item => item.status !== 'COMPLETED' && item.status !== 'CANCELLED').length || 0} Waiting
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider font-sans">Patient / MRN</th>
                  <th scope="col" className="px-3 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider font-sans">Priority</th>
                  <th scope="col" className="px-3 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Wait</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {queueData && queueData.filter(item => item.status !== 'COMPLETED' && item.status !== 'CANCELLED').length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-slate-400 font-medium text-xs font-sans">
                      No patients waiting in queue.
                    </td>
                  </tr>
                ) : (
                  queueData?.filter(item => item.status !== 'COMPLETED' && item.status !== 'CANCELLED').map((patient) => {
                    const isActive = patient.patientId === selectedPatient?.id;
                    return (
                      <tr
                        key={patient.id}
                        onClick={() => selectPatient(patient.patientId)}
                        className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                          isActive ? 'bg-blue-50/40 hover:bg-blue-50/50' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-xs">
                          <div className="font-bold text-slate-800 font-sans">{patient.patientName || '[REDACTED]'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">MRN: {patient.patientNumber}</div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase font-sans ${
                            patient.category === 'EMERGENCY' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {patient.category}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-slate-650">
                          {patient.waitTimeMinutes}m
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Triage Worksheet Form */}
        <div className="lg:col-span-2 space-y-3">
          {!selectedPatient ? (
            <div className="bg-white border border-slate-200 p-8 rounded-lg shadow-sm text-center space-y-2 flex flex-col items-center">
              <ClipboardCheck className="h-8 w-8 text-slate-350" />
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider font-sans">No Patient Selected</h3>
              <p className="text-[11px] text-slate-400 max-w-xs font-sans">Select a patient from the waiting list on the left to begin clinical triage assessment.</p>
            </div>
          ) : submitSuccess ? (
            <div className="bg-emerald-50/30 border border-emerald-100 p-8 rounded-lg shadow-sm text-center space-y-3 flex flex-col items-center animate-fade-in">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-emerald-800 text-sm uppercase tracking-wider font-sans">Triage Completed Successfully</h3>
              <p className="text-xs text-emerald-700 font-medium max-w-sm font-sans leading-relaxed">
                Patient {selectedPatient.lastName}, {selectedPatient.firstName} has been successfully categorized and routed for further physician evaluation.
              </p>
              <button 
                onClick={() => setSearchParams({})}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors font-sans"
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

          {/* Historic triages using high-contrast error styling */}
          {patientTriage && patientTriage.length > 0 && !submitSuccess && (
            <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm space-y-2.5">
              <h4 className="font-bold text-slate-800 text-[10px] tracking-wider uppercase border-b border-slate-100 pb-1.5 flex items-center gap-1 font-sans">
                <History className="h-3.5 w-3.5 text-slate-550" /> Historical Triage Records
              </h4>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                {patientTriage.map((t) => {
                  const isError = t.status === 'ENTERED_IN_ERROR';
                  return (
                    <div 
                      key={t.id} 
                      className={`p-2.5 text-xs rounded-lg mb-1 flex justify-between gap-3 items-center border transition-all ${
                        isError 
                          ? 'border-rose-200 bg-rose-50/30 border-l-4 border-l-rose-500' 
                          : 'border-slate-100 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className={`font-bold font-sans ${isError ? 'text-slate-400 line-through' : 'text-slate-850'}`}>
                          {t.acuityLevel} Priority • {t.arrivalMode}
                        </span>
                        <span className={`line-clamp-2 mt-0.5 font-sans ${isError ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                          {t.chiefComplaintSummary}
                        </span>
                        {isError && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-bold uppercase mt-1 font-sans">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Entered in Error</span>
                            {t.notes && <span className="font-normal text-slate-500 normal-case ml-1">({t.notes})</span>}
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
                            className="text-[10px] text-rose-600 font-bold hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-150 mt-1 transition-colors font-sans"
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
    );
  };

  return (
    <HmsDashboardShell
      toolbar={
        <HmsToolbar 
          branchName={user?.branchId || undefined} 
          role={user?.roles?.join(', ') || 'Nurse Operator'} 
          lastRefreshed={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined} 
          onRefresh={() => {
            refetchQueue();
          }}
        />
      }
      footer={
        <HmsAuditFooter 
          lastRefreshed={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined} 
          dataSource="Intake Work Queue API" 
          version="v2.1" 
        />
      }
    >
      <HmsPageHeader 
        title="Clinical Triage Workstation" 
        description="Assess patients, document critical triage data, categorize priority levels, and route to care teams." 
      />
      {content()}

      {/* Error Modal */}
      {errorModalTriageId && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm shadow-md border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Mark Triage as Error
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Are you sure you want to mark this triage record as entered in error? This action cannot be undone and will be permanently recorded in the audit log. The original values will be preserved but flagged as invalid.
            </p>
            <form onSubmit={handleMarkErrorSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 font-sans">Reason</label>
                <input
                  type="text"
                  required
                  value={errorReason}
                  onChange={(e) => setErrorReason(e.target.value)}
                  placeholder="e.g. Wrong patient, incorrect acuity"
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                />
              </div>

              {markErrorMutation.isError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-700 font-bold uppercase font-sans">
                  {axios.isAxiosError(markErrorMutation.error) && markErrorMutation.error.response?.status === 403
                    ? 'Access Restricted: You do not have permission to void clinical records.'
                    : 'Failed to mark error. Please check your connection and try again.'}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorModalTriageId(null);
                    setErrorReason('');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markErrorMutation.isPending || !errorReason.trim()}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans"
                >
                  {markErrorMutation.isPending ? 'Marking...' : 'Confirm Error'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HmsDashboardShell>
  );
};

export default NurseTriageQueuePage;
