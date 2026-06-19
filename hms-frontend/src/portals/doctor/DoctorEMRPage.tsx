import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useUser } from '../../hooks/use-user';
import { PageHeader } from '../../components/ui/page-header';
import { PatientSafetyHeader, PatientSafetyInfo } from './components/PatientSafetyHeader';
import { DoctorSOAPEditor } from './components/DoctorSOAPEditor';
import { DoctorClinicalTimeline } from './components/DoctorClinicalTimeline';
import { DoctorOrdersPanel } from './components/DoctorOrdersPanel';
import { DoctorResultsPanel } from './components/DoctorResultsPanel';
import { DoctorPrescriptionPanel } from './components/DoctorPrescriptionPanel';
import { AlertCircle, UserCheck, Stethoscope, ChevronLeft } from 'lucide-react';
import { usePatientEncounters } from '../../hooks/use-clinical-workflow';
import {
  clinicalWorkflowService,
  type PatientClinicalSummaryDto,
} from '../../services/clinicalWorkflow.service';
import axios from 'axios';

const mapSummaryToPatientSafetyInfo = (summary: PatientClinicalSummaryDto): PatientSafetyInfo => {
  const nameParts = (summary.patientName ?? '').trim().split(/\s+/);
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const dobValue = summary.dob instanceof Date ? summary.dob : new Date(summary.dob);
  const dob = Number.isNaN(dobValue.getTime()) ? '' : dobValue.toISOString().slice(0, 10);

  return {
    id: summary.patientId || summary.id,
    firstName,
    lastName,
    mrn: summary.patientNumber || '',
    dob,
    gender: summary.gender || 'Unknown',
    allergies: summary.allergies?.length ? summary.allergies.join(', ') : 'None',
    diagnoses: [],
    warnings: [],
  };
};

const extractPatientLoadError = (err: unknown): string => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || 'Failed to load patient record.';
};

export const DoctorEMRPage = () => {
  const { patientId: routePatientId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useUser();

  // Determine active patient from either path parameter or query string
  const patientId = routePatientId || searchParams.get('patientId') || null;

  const [activePatient, setActivePatient] = useState<PatientSafetyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch patient encounters to find active/draft-compatible encounters
  const { 
    data: encounters, 
    isLoading: isLoadingEncounters, 
    error: encountersError 
  } = usePatientEncounters(patientId || '');

  // Look for first active encounter (not closed, finished, cancelled, or entered-in-error)
  const activeEncounter = encounters?.find(
    (enc) =>
      !['FINISHED', 'CANCELLED', 'CLOSED', 'ENTERED_IN_ERROR'].includes(enc.status)
  );

  useEffect(() => {
    if (!patientId) {
      setActivePatient(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setError(null);
    setIsLoading(true);

    clinicalWorkflowService
      .getPatientSummary(patientId)
      .then((summary) => {
        if (cancelled) return;
        if (!summary) {
          setError('Patient record not found.');
          setActivePatient(null);
          return;
        }
        setActivePatient(mapSummaryToPatientSafetyInfo(summary));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(extractPatientLoadError(err));
        setActivePatient(null);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (encountersError) {
    const isForbidden = axios.isAxiosError(encountersError) && 
      (encountersError.response?.status === 403 || encountersError.response?.status === 401);
    
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/doctor/queue')}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 shadow-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <PageHeader 
            title="Clinical EMR Workspace" 
            description="Examine charts, capture SOAP progress notes, and issue orders/prescriptions." 
          />
        </div>
        <div className="card p-8 bg-rose-50 border border-rose-100 flex flex-col items-center justify-center text-rose-700 text-xs gap-3">
          <AlertCircle className="h-8 w-8 text-rose-600 animate-bounce" />
          <h2 className="text-base font-extrabold text-slate-800">
            {isForbidden ? 'Access Restricted' : 'Connection Error'}
          </h2>
          <span className="font-semibold text-slate-600 max-w-md text-center">
            {isForbidden 
              ? 'You do not have permission to view this clinical record. Role authorization required.' 
              : 'Failed to retrieve encounter data. Please verify your network connection or try again.'}
          </span>
          <button 
            onClick={() => navigate('/doctor/queue')}
            className="btn btn-primary bg-indigo-600 text-white text-xs px-4 py-2 mt-2"
          >
            Return to Worklist Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* WIP Banner */}
      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 text-xs text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h5 className="font-bold uppercase text-[10px] tracking-wider">EMR Chart (WIP)</h5>
          <p className="font-medium mt-0.5">
            Patient safety header, encounters, SOAP notes, clinical orders, and prescriptions load from live HMS backend APIs.
            Clinical Timeline and Released Diagnostic Results panels still use hardcoded demonstration data — do not use those panels for clinical decision-making.
          </p>
        </div>
      </div>
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/doctor/queue')}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 shadow-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <PageHeader 
          title="Clinical EMR Workspace" 
          description="Examine charts, capture SOAP progress notes, and issue orders/prescriptions." 
        />
      </div>

      {/* Safety Header Panel */}
      <PatientSafetyHeader patient={activePatient} />

      {/* Main Workspace Area */}
      {isLoading || isLoadingEncounters ? (
        <div className="card p-12 bg-white border flex flex-col items-center justify-center text-slate-500 text-xs font-semibold gap-3 select-none">
          <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading patient health history...
        </div>
      ) : error ? (
        <div className="card p-8 bg-rose-50 border border-rose-100 flex flex-col items-center justify-center text-rose-700 text-xs gap-3">
          <AlertCircle className="h-8 w-8 text-rose-600 animate-bounce" />
          <span className="font-extrabold">{error}</span>
          <button 
            onClick={() => navigate('/doctor/queue')}
            className="btn btn-primary bg-rose-600 text-white text-xs px-4 py-2 mt-2"
          >
            Return to Worklist Queue
          </button>
        </div>
      ) : activePatient ? (
        /* The Three-Panel Layout */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          
          {/* Panel 1: Left (Clinical Timeline) - spans 3 columns */}
          <div className="xl:col-span-3 space-y-5">
            <DoctorClinicalTimeline patientId={activePatient.id} />
          </div>

          {/* Panel 2: Center (SOAP Encounter Workspace) - spans 5 columns */}
          <div className="xl:col-span-5">
            <DoctorSOAPEditor 
              patientId={activePatient.id}
              encounterId={activeEncounter?.id}
              isLocked={false}
            />
          </div>

          {/* Panel 3: Right (Clinical Context - Orders, Results, prescriptions) - spans 4 columns */}
          <div className="xl:col-span-4 space-y-5">
            <DoctorPrescriptionPanel 
              patientId={activePatient.id} 
              isLocked={false} 
              currentUserId={user?.id ?? ''} 
              encounterId={activeEncounter?.id}
            />
            <DoctorOrdersPanel patientId={activePatient.id} encounterId={activeEncounter?.id} isLocked={false} />
            <DoctorResultsPanel patientId={activePatient.id} />
          </div>

        </div>
      ) : (
        /* Empty/Inactive state */
        <div className="card p-12 bg-white border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center text-slate-400">
          <UserCheck className="h-16 w-16 text-slate-200 mb-3" />
          <p className="font-bold text-slate-500">No Patient Loaded in Workspace</p>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Please search for a patient in the directory or check in a patient from the waiting queue to activate EMR charting logs.
          </p>
          <div className="flex gap-2.5 mt-5">
            <button 
              onClick={() => navigate('/doctor/queue')}
              className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Stethoscope className="h-4 w-4" /> Go to Clinic Queue
            </button>
            <button 
              onClick={() => navigate('/doctor/patients')}
              className="btn border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs py-2 px-4"
            >
              Search Directories
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default DoctorEMRPage;
