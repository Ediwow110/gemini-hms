import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Thermometer, Heart, Wind, CheckCircle2, AlertTriangle } from 'lucide-react';
import { HmsPageHeader, HmsSafetyBar, HmsFormContainer } from '../../components/hms-page';
import { HmsAuditFooter } from '../../components/hms-dashboard';
import { VitalsSummaryCard } from './components/VitalsSummaryCard';
import { useClinicalWorkQueue, usePatientClinicalSummary, usePatientVitals, useSaveVitals, useMarkVitalsEnteredInError } from '../../hooks/use-clinical-workflow';
import axios from 'axios';
import { format } from 'date-fns';

export const NurseVitalsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activePatientId = searchParams.get('patientId') || null;

  const { data: queueData, isLoading: isQueueLoading, error: queueError } = useClinicalWorkQueue();
  const { data: patientSummary, isLoading: isSummaryLoading, error: summaryError } = usePatientClinicalSummary(activePatientId ?? '');
  const { data: patientVitals, isLoading: isVitalsLoading, error: vitalsError } = usePatientVitals(activePatientId ?? '');

  const selectedPatient = patientSummary ? {
    id: patientSummary.patientId,
    name: patientSummary.patientName || '[REDACTED]',
    age: patientSummary.dob ? new Date().getFullYear() - new Date(patientSummary.dob).getFullYear() : 0,
    gender: patientSummary.gender || 'Unknown',
    mrn: patientSummary.patientNumber,
  } : null;

  // Vitals Inputs
  const [bpSystolic, setBpSystolic] = useState(120);
  const [bpDiastolic, setBpDiastolic] = useState(80);
  const [temperature, setTemperature] = useState(36.6);
  const [pulse, setPulse] = useState(72);
  const [respiration, setRespiration] = useState(16);

  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [errorModalVitalsId, setErrorModalVitalsId] = useState<string | null>(null);
  const [errorReason, setErrorReason] = useState('');

  const saveVitalsMutation = useSaveVitals();
  const markErrorMutation = useMarkVitalsEnteredInError();

  const handleSelectPatientId = (patientId: string) => {
    setSearchParams({ patientId });
    setSuccess(false);
    setValidationError(null);
    // Reset to default normal vitals
    setBpSystolic(120);
    setBpDiastolic(80);
    setTemperature(36.6);
    setPulse(72);
    setRespiration(16);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setValidationError(null);

    const hasVital = bpSystolic != null || bpDiastolic != null || temperature != null || pulse != null || respiration != null;
    if (!hasVital) {
      setValidationError('At least one vital sign value is required.');
      return;
    }

    saveVitalsMutation.mutate(
      {
        patientId: selectedPatient.id,
        data: {
          systolicBp: bpSystolic,
          diastolicBp: bpDiastolic,
          temperature,
          heartRate: pulse,
          respiratoryRate: respiration,
        },
      },
      {
        onSuccess: () => {
          setSuccess(true);
        },
        onError: () => {
          // Error is displayed through mutation state
        },
      },
    );
  };

  const handleMarkErrorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !errorModalVitalsId || !errorReason.trim()) return;

    markErrorMutation.mutate(
      {
        patientId: selectedPatient.id,
        vitalsId: errorModalVitalsId,
        reason: errorReason.trim(),
      },
      {
        onSuccess: () => {
          setErrorModalVitalsId(null);
          setErrorReason('');
        },
      }
    );
  };

  const getFormError = () => {
    if (validationError) return validationError;
    if (saveVitalsMutation.isError) {
      const err = saveVitalsMutation.error;
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        return 'Validation error: Please check vital sign values and try again.';
      }
      if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 401)) {
        return 'Access Restricted: You do not have permission to save vitals.';
      }
      return 'Failed to save vitals. Please check your connection and try again.';
    }
    return null;
  };

  const isLoading = isQueueLoading || (!!activePatientId && (isSummaryLoading || isVitalsLoading));
  const errorObj = queueError || (activePatientId ? (summaryError || vitalsError) : null);

  if (errorObj) {
    const isForbidden = axios.isAxiosError(errorObj) && (errorObj.response?.status === 403 || errorObj.response?.status === 401);
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in font-sans">
        <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center border border-rose-100">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-md font-bold text-slate-900">
          {isForbidden ? 'Access Restricted' : 'Connection Error'}
        </h2>
        <p className="text-[12px] text-slate-500 max-w-sm mx-auto">
          {isForbidden 
            ? 'You do not have permission to view this vitals logging station. Please contact your administrator if you believe this is an error.' 
            : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-3 animate-fade-in font-sans">
        <div className="animate-spin mx-auto w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-[12px] text-slate-500 font-semibold tracking-wide animate-pulse">Loading vitals workstation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      <HmsPageHeader 
        title="Vital Signs Logging Station" 
        description="Record and track blood pressure, heart rate, temperature, respiratory rate, and physiological parameters." 
        badge="Nurse Desk"
      />

      {selectedPatient && (
        <HmsSafetyBar
          patientName={selectedPatient.name}
          mrn={selectedPatient.mrn}
          dob={patientSummary?.dob ? format(new Date(patientSummary.dob), 'yyyy-MM-dd') : 'Unavailable'}
          age={selectedPatient.age}
          gender={selectedPatient.gender}
          allergies={patientSummary?.allergies && patientSummary.allergies.length > 0 ? patientSummary.allergies.join(', ') : 'None Known'}
          insurance="Unavailable"
          policyNo="N/A"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left Column: Waiting Queue */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4 space-y-3">
            <h3 className="font-bold text-slate-900 text-[11px] tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Activity className="h-3.5 w-3.5 text-blue-500" />
              Vitals Queue List
            </h3>

            <div className="space-y-1.5">
              {queueData && queueData.filter(item => item.status !== 'COMPLETED' && item.status !== 'CANCELLED').length === 0 ? (
                <div className="py-6 text-center text-slate-400 font-semibold text-[11px]">No patients waiting in queue.</div>
              ) : (
                queueData?.filter(item => item.status !== 'COMPLETED' && item.status !== 'CANCELLED').map((pat) => {
                  const isActive = pat.patientId === selectedPatient?.id;
                  return (
                    <button
                      key={pat.id}
                      onClick={() => handleSelectPatientId(pat.patientId)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border flex flex-col gap-1 transition-all duration-150 cursor-pointer ${
                        isActive 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-350 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`font-bold text-[12px] ${isActive ? 'text-white' : 'text-slate-900'}`}>
                          {pat.patientName || '[REDACTED]'}
                        </span>
                        <span className={`text-[10px] font-bold font-mono ${isActive ? 'text-blue-300' : 'text-blue-600'}`}>MRN: {pat.patientNumber}</span>
                      </div>
                      <div className={`flex gap-2 items-center text-[10px] font-semibold uppercase font-mono ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span>Category: {pat.category}</span>
                        <span>•</span>
                        <span>Wait: {pat.waitTimeMinutes} mins</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Vitals Form */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-8 text-center space-y-2 flex flex-col items-center">
              <Activity className="h-8 w-8 text-slate-300 animate-pulse" />
              <h3 className="font-bold text-slate-750 text-[12px]">No Patient Selected</h3>
              <p className="text-[11px] text-slate-400 max-w-xs">Select a patient from the queue to start recording vital parameters.</p>
            </div>
          ) : success || saveVitalsMutation.isSuccess ? (
            <div className="bg-emerald-50/10 border border-emerald-100 shadow-sm rounded-lg p-8 text-center space-y-3 flex flex-col items-center animate-fade-in">
              <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-650">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-emerald-800 text-[14px]">Vitals Recorded Successfully</h3>
              <p className="text-[11px] text-emerald-600 font-semibold max-w-sm">
                Physiological values for <strong>{selectedPatient.name}</strong> have been saved to the electronic medical record.
              </p>
              <button 
                onClick={() => setSearchParams({})}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-4 rounded-lg shadow-sm cursor-pointer"
              >
                Close Sheets
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dynamic live indicator panel */}
              <VitalsSummaryCard vitals={{ bpSystolic, bpDiastolic, temperature, pulse, respiration }} />

              <HmsFormContainer
                title="Update Physiological Parameters"
                description={`Enter the clinical readings for ${selectedPatient.name}`}
                onSubmit={handleSaveVitals}
                error={getFormError()}
                columns={3}
                actions={
                  <button
                    type="submit"
                    disabled={saveVitalsMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] px-4 py-1.5 font-bold flex items-center gap-1.5 rounded-lg shadow-sm transition-all ml-auto cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {saveVitalsMutation.isPending ? 'Saving Vitals...' : 'Commit Vital Signs'}
                  </button>
                }
              >
                {/* Systolic BP */}
                <div className="flex flex-col space-y-1">
                  <label htmlFor="bp-systolic" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">BP Systolic (mmHg)</label>
                  <input
                    id="bp-systolic"
                    type="number"
                    required
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(Number(e.target.value))}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Diastolic BP */}
                <div className="flex flex-col space-y-1">
                  <label htmlFor="bp-diastolic" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">BP Diastolic (mmHg)</label>
                  <input
                    id="bp-diastolic"
                    type="number"
                    required
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(Number(e.target.value))}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Temperature */}
                <div className="flex flex-col space-y-1">
                  <label htmlFor="temperature" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Temperature (°C)</label>
                  <div className="relative">
                    <input
                      id="temperature"
                      type="number"
                      step="0.1"
                      required
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full p-2 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Thermometer className="h-4 w-4 text-slate-450 absolute right-2 top-2" />
                  </div>
                </div>

                {/* Pulse */}
                <div className="flex flex-col space-y-1">
                  <label htmlFor="pulse" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Pulse Rate (BPM)</label>
                  <div className="relative">
                    <input
                      id="pulse"
                      type="number"
                      required
                      value={pulse}
                      onChange={(e) => setPulse(Number(e.target.value))}
                      className="w-full p-2 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Heart className="h-4 w-4 text-slate-455 absolute right-2 top-2" />
                  </div>
                </div>

                {/* Respiration */}
                <div className="flex flex-col space-y-1">
                  <label htmlFor="respiration" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Respiration Rate (/min)</label>
                  <div className="relative">
                    <input
                      id="respiration"
                      type="number"
                      required
                      value={respiration}
                      onChange={(e) => setRespiration(Number(e.target.value))}
                      className="w-full p-2 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Wind className="h-4 w-4 text-slate-450 absolute right-2 top-2" />
                  </div>
                </div>
              </HmsFormContainer>

              {patientVitals && patientVitals.length > 0 && (
                <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4 space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-[11px] tracking-wider uppercase border-b border-slate-100 pb-1.5">
                    Historical Vitals Logs
                  </h4>
                  <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {patientVitals.map((v) => {
                      const isError = v.status === 'ENTERED_IN_ERROR';
                      return (
                        <div key={v.id} className="py-2 text-[12px] flex justify-between gap-3 items-center">
                          <div className={`flex flex-col ${isError ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            <span>
                              BP: <strong className="font-mono text-slate-900">{v.systolicBp}/{v.diastolicBp}</strong> mmHg | HR: <strong className="font-mono text-slate-900">{v.heartRate}</strong> bpm | Temp: <strong className="font-mono text-slate-900">{v.temperature}</strong>°C
                            </span>
                            {isError && (
                              <span className="text-[10px] text-rose-600 font-bold no-underline mt-0.5">
                                Entered in Error
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] text-slate-450 font-mono font-bold">
                              {v.recordedAt ? format(new Date(v.recordedAt), 'yyyy-MM-dd HH:mm') : 'N/A'}
                            </span>
                            {!isError && v.status === 'ACTIVE' && (
                              <button
                                onClick={() => setErrorModalVitalsId(v.id)}
                                aria-label="Mark Error"
                                className="text-[10px] text-rose-600 font-bold hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 cursor-pointer"
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
          )}
        </div>
      </div>

      <HmsAuditFooter dataSource="Clinical API Gateway" lastRefreshed={new Date()} />

      {/* Error Modal */}
      {errorModalVitalsId && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm shadow-sm border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-[13px] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Mark Vitals as Error
            </h3>
            <p className="text-[12px] text-slate-500 leading-normal">
              Are you sure you want to mark these vitals as entered in error? This action cannot be undone and will flag the values as invalid.
            </p>
            <form onSubmit={handleMarkErrorSubmit} className="space-y-3">
              <div>
                <label htmlFor="error-reason" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Reason</label>
                <input
                  id="error-reason"
                  type="text"
                  required
                  value={errorReason}
                  onChange={(e) => setErrorReason(e.target.value)}
                  placeholder="e.g. Wrong patient, faulty equipment"
                  className="w-full p-2 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-550 text-slate-800"
                />
              </div>

              {markErrorMutation.isError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-700 font-bold">
                  {axios.isAxiosError(markErrorMutation.error) && markErrorMutation.error.response?.status === 403
                    ? 'Access Restricted: You do not have permission to void clinical records.'
                    : 'Failed to mark error. Please check your connection and try again.'}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorModalVitalsId(null);
                    setErrorReason('');
                  }}
                  className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markErrorMutation.isPending || !errorReason.trim()}
                  className="px-3 py-1.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

export default NurseVitalsPage;

