import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Thermometer, Heart, Wind, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
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

  const isLoading = isQueueLoading || (!!activePatientId && (isSummaryLoading || isVitalsLoading));
  const errorObj = queueError || (activePatientId ? (summaryError || vitalsError) : null);

  if (errorObj) {
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
            ? 'You do not have permission to view this vitals logging station. Please contact your administrator if you believe this is an error.' 
            : 'Failed to connect to the clinical service. Please check your network connection or try again later.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4 animate-fade-in">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading vitals workstation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Vital Signs Logging Station" 
        description="Record and track blood pressure, heart rate, temperature, respiratory rate, and blood oxygen saturation." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Waiting Queue */}
        <div className="space-y-4">
          <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="h-4 w-4 text-indigo-500" />
              Vitals Queue List
            </h3>

            <div className="space-y-2">
              {queueData && queueData.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium text-xs">No patients waiting in queue.</div>
              ) : (
                queueData?.filter(item => item.status !== 'COMPLETED' && item.status !== 'CANCELLED').map((pat) => {
                  const isActive = pat.patientId === selectedPatient?.id;
                  return (
                    <button
                      key={pat.id}
                      onClick={() => handleSelectPatientId(pat.patientId)}
                      className={`w-full text-left p-3.5 rounded-xl border flex flex-col gap-1 transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200 shadow-sm animate-scale-in'
                          : 'bg-white border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`font-bold text-xs ${isActive ? 'text-indigo-800' : 'text-slate-800'}`}>
                          {pat.patientName || '[REDACTED]'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold font-mono">MRN: {pat.patientNumber}</span>
                      </div>
                      <div className="flex gap-2 items-center text-[9px] text-slate-400 font-bold uppercase mt-1">
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
            <div className="card p-12 bg-white border border-slate-200/80 shadow-sm rounded-2xl text-center space-y-3 flex flex-col items-center">
              <Activity className="h-10 w-10 text-slate-300" />
              <h3 className="font-bold text-slate-700 text-sm">No Patient Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm">Select a patient from the queue to start recording their vital signs and reviewing potential alerts.</p>
            </div>
          ) : success || saveVitalsMutation.isSuccess ? (
            <div className="card p-10 bg-emerald-50/20 border border-emerald-100/80 shadow-sm rounded-2xl text-center space-y-4 flex flex-col items-center animate-fade-in">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-black text-emerald-800 text-base">Vitals Recorded Successfully</h3>
              <p className="text-xs text-emerald-600 font-semibold max-w-md">
                Vital parameters for <strong>{selectedPatient.name}</strong> have been cryptographically sealed and attached to the active triage profile.
              </p>
              <button 
                onClick={() => setSearchParams({})}
                className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-6 rounded-xl shadow-sm shadow-emerald-200"
              >
                Close Sheets
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dynamic live indicator panel */}
                <VitalsSummaryCard vitals={{ bpSystolic, bpDiastolic, temperature, pulse, respiration }} />

              <form onSubmit={handleSaveVitals} className="card p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-6">
                <h3 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">
                  Update Physiological Parameters ({selectedPatient.name})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Systolic BP */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BP Systolic (mmHg)</label>
                    <input
                      type="number"
                      required
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(Number(e.target.value))}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Diastolic BP */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BP Diastolic (mmHg)</label>
                    <input
                      type="number"
                      required
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(Number(e.target.value))}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Temperature */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temperature (°C)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="w-full p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <Thermometer className="h-4 w-4 text-slate-400 absolute right-2.5 top-3" />
                    </div>
                  </div>

                  {/* Pulse */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pulse Rate (BPM)</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={pulse}
                        onChange={(e) => setPulse(Number(e.target.value))}
                        className="w-full p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <Heart className="h-4 w-4 text-slate-400 absolute right-2.5 top-3" />
                    </div>
                  </div>

                  {/* Respiration */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Respiration Rate (/min)</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={respiration}
                        onChange={(e) => setRespiration(Number(e.target.value))}
                        className="w-full p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <Wind className="h-4 w-4 text-slate-400 absolute right-2.5 top-3" />
                    </div>
                  </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  {validationError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                      {validationError}
                    </div>
                  )}

                  {saveVitalsMutation.isError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                      {axios.isAxiosError(saveVitalsMutation.error) && saveVitalsMutation.error.response?.status === 400
                        ? 'Validation error: Please check vital sign values and try again.'
                        : axios.isAxiosError(saveVitalsMutation.error) && (saveVitalsMutation.error.response?.status === 403 || saveVitalsMutation.error.response?.status === 401)
                          ? 'Access Restricted: You do not have permission to save vitals.'
                          : 'Failed to save vitals. Please check your connection and try again.'}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saveVitalsMutation.isPending}
                    className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2 font-extrabold flex items-center gap-1.5 rounded-xl shadow-md transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {saveVitalsMutation.isPending ? 'Saving Vitals...' : 'Commit Vital Signs'}
                  </button>
                </div>
              </form>

              {patientVitals && patientVitals.length > 0 && (
                <div className="card p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl space-y-3">
                  <h4 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">
                    Historical Vitals Logs
                  </h4>
                  <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {patientVitals.map((v) => {
                      const isError = v.status === 'ENTERED_IN_ERROR';
                      return (
                        <div key={v.id} className="py-2.5 text-xs flex justify-between gap-3 items-center">
                          <div className={`flex flex-col ${isError ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                            <span>
                              BP: <strong>{v.systolicBp}/{v.diastolicBp}</strong> mmHg | HR: <strong>{v.heartRate}</strong> bpm | Temp: <strong>{v.temperature}</strong>°C
                            </span>
                            {isError && (
                              <span className="text-[10px] text-rose-500 font-semibold no-underline mt-0.5">
                                Entered in Error
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] text-slate-400 font-mono font-bold">
                              {v.recordedAt ? format(new Date(v.recordedAt), 'yyyy-MM-dd HH:mm') : 'N/A'}
                            </span>
                            {!isError && v.status === 'ACTIVE' && (
                              <button
                                onClick={() => setErrorModalVitalsId(v.id)}
                                aria-label="Mark Error"
                                className="text-[10px] text-rose-600 font-semibold hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100"
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

      {/* Error Modal */}
      {errorModalVitalsId && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Mark Vitals as Error
            </h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to mark these vitals as entered in error? This action cannot be undone and will be permanently recorded in the audit log. The original values will be preserved but flagged as invalid.
            </p>
            <form onSubmit={handleMarkErrorSubmit} className="space-y-4">
              <div>
                <label htmlFor="error-reason" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Reason</label>
                <input
                  id="error-reason"
                  type="text"
                  required
                  value={errorReason}
                  onChange={(e) => setErrorReason(e.target.value)}
                  placeholder="e.g. Wrong patient, faulty equipment"
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
                    setErrorModalVitalsId(null);
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

export default NurseVitalsPage;
