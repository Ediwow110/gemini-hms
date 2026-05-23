import { useState, useEffect } from 'react';
import { Save, Lock, Edit, Sparkles, AlertTriangle, CheckCircle2, FileSignature, X } from 'lucide-react';
import { usePatientSoapDraft, useSaveDraftSOAP, useSignSOAP } from '../../../hooks/use-clinical-workflow';
import axios from 'axios';

interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface DoctorSOAPEditorProps {
  patientId: string;
  encounterId?: string;
  isLocked: boolean;
}

export const DoctorSOAPEditor = ({ 
  patientId,
  encounterId,
  isLocked: isLockedProp,
}: DoctorSOAPEditorProps) => {
  const {
    data: draft,
    isLoading: isLoadingDraft,
    error: fetchError,
  } = usePatientSoapDraft(patientId, encounterId || '');

  const saveMutation = useSaveDraftSOAP();
  const signMutation = useSignSOAP();

  const isLocked = isLockedProp || !!draft?.lockedAt;

  const [notes, setNotes] = useState<SOAPNotes>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);

  // Initialize and synchronize notes when a new draft is fetched
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft) {
        setNotes({
          subjective: draft.subjective || '',
          objective: draft.objective || '',
          assessment: draft.assessment || '',
          plan: draft.plan || '',
        });
      } else {
        setNotes({
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [draft]);

  // Auto-hide success alert
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSave = async () => {
    if (!encounterId || isLocked) return;
    try {
      await saveMutation.mutateAsync({
        patientId,
        encounterId,
        data: notes,
      });
      setShowSuccess(true);
    } catch {
      // Handled by mutation error state
    }
  };

  const isFormEmpty =
    !notes.subjective.trim() &&
    !notes.objective.trim() &&
    !notes.assessment.trim() &&
    !notes.plan.trim();

  const isSaveDisabled =
    saveMutation.isPending ||
    isLocked ||
    !encounterId ||
    isFormEmpty;

  const isSignDisabled =
    signMutation.isPending ||
    isLocked ||
    !encounterId;

  const error = fetchError || saveMutation.error || signMutation.error;
  const isForbidden =
    error &&
    axios.isAxiosError(error) &&
    (error.response?.status === 403 || error.response?.status === 401);

  const getSafeErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err) && err.response) {
      const resp = err.response;
      const payload = resp.data;
      if (payload && typeof payload === 'object') {
        const message = (payload as Record<string, unknown>).message;
        if (typeof message === 'string') {
          return message;
        }
      }
      return err.message;
    }
    return err instanceof Error ? err.message : 'An unexpected error occurred while communicating with the server.';
  };

  return (
    <div className="card p-6 bg-white border border-slate-200/80 shadow-sm space-y-6 flex flex-col h-full min-h-[500px]">
      {/* SOAP Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
            <Edit className="h-4 w-4 text-indigo-500" />
            SOAP Charting Workspace
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Document clinical notes under standard medical format.</p>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 select-none">
              <Lock className="h-3.5 w-3.5" /> SOAP Signed & Finalized
            </span>
          ) : (
            <>
              <button
                onClick={() => setShowSignModal(true)}
                disabled={isSignDisabled}
                aria-label="Sign SOAP"
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-1.5 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <FileSignature className="h-3.5 w-3.5" />
                {signMutation.isPending ? 'Signing...' : 'Sign SOAP'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaveDisabled}
                aria-label="Draft Save"
                className="btn border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-xs px-3.5 py-1.5 flex items-center gap-1.5 transition-all"
              >
                <Save className="h-3.5 w-3.5 text-slate-400" />
                {saveMutation.isPending ? 'Saving...' : 'Draft Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-800 text-xs animate-shake">
          <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-extrabold">
              {isForbidden ? 'Access Restricted' : 'Error Saving Draft'}
            </p>
            <p className="font-medium text-[11px] text-rose-700/90 leading-relaxed">
              {isForbidden
                ? 'You do not have permission to view or modify SOAP records. Access requires specific role privileges.'
                : getSafeErrorMessage(error)}
            </p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">SOAP progress notes successfully saved as draft.</span>
        </div>
      )}

      {/* No Active Encounter Warning */}
      {!encounterId && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-amber-800 text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-extrabold">No Active Encounter Found</p>
            <p className="font-medium text-[11px] text-amber-700/90 leading-relaxed mt-0.5">
              SOAP charting requires an open, active encounter. You cannot write notes for checked-out or non-admitted patients.
            </p>
          </div>
        </div>
      )}

      {/* Editor Panels */}
      {isLoadingDraft ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold py-12 gap-2 select-none">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
          Loading SOAP draft...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {/* Subjective (S) */}
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="soap-subjective" className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <span className="h-4 w-4 bg-indigo-50 text-indigo-700 rounded-md flex items-center justify-center text-[10px] font-black">S</span>
              Subjective (Chief Complaint & History)
            </label>
            <textarea
              id="soap-subjective"
              value={notes.subjective}
              disabled={isLocked || !encounterId}
              onChange={(e) => setNotes({ ...notes, subjective: e.target.value })}
              className="flex-1 min-h-[120px] p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300"
              placeholder="Patient complains of..."
            />
          </div>

          {/* Objective (O) */}
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="soap-objective" className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <span className="h-4 w-4 bg-indigo-50 text-indigo-700 rounded-md flex items-center justify-center text-[10px] font-black">O</span>
              Objective (Physical Exam & Findings)
            </label>
            <textarea
              id="soap-objective"
              value={notes.objective}
              disabled={isLocked || !encounterId}
              onChange={(e) => setNotes({ ...notes, objective: e.target.value })}
              className="flex-1 min-h-[120px] p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300"
              placeholder="Vitals reviewed. Heart sounds normal..."
            />
          </div>

          {/* Assessment (A) */}
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="soap-assessment" className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <span className="h-4 w-4 bg-indigo-50 text-indigo-700 rounded-md flex items-center justify-center text-[10px] font-black">A</span>
              Assessment (Diagnosis & ICD-10)
            </label>
            <textarea
              id="soap-assessment"
              value={notes.assessment}
              disabled={isLocked || !encounterId}
              onChange={(e) => setNotes({ ...notes, assessment: e.target.value })}
              className="flex-1 min-h-[120px] p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300"
              placeholder="Impression: Primary hypertension, stable..."
            />
          </div>

          {/* Plan (P) */}
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="soap-plan" className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <span className="h-4 w-4 bg-indigo-50 text-indigo-700 rounded-md flex items-center justify-center text-[10px] font-black">P</span>
              Plan (Orders & Care Plan)
            </label>
            <textarea
              id="soap-plan"
              value={notes.plan}
              disabled={isLocked || !encounterId}
              onChange={(e) => setNotes({ ...notes, plan: e.target.value })}
              className="flex-1 min-h-[120px] p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 focus:bg-white transition-all duration-300"
              placeholder="Rx: Amlodipine 5mg OD. Recheck BP in 2 weeks..."
            />
          </div>
        </div>
      )}
      
      {/* Smart assist tooltip */}
      <div className="bg-gradient-to-r from-indigo-50/50 to-violet-50/50 rounded-2xl p-3.5 border border-indigo-100 flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
        <span className="text-[11px] text-slate-500 leading-relaxed font-semibold">
          <strong>Clinical Copilot Active</strong>: All entries written above are saved securely as draft in the clinical repository.
        </span>
      </div>

      {/* Sign SOAP Confirmation Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowSignModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-md w-full mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-indigo-600" />
                Finalize & Sign SOAP Notes
              </h3>
              <button onClick={() => setShowSignModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl mb-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800 space-y-1">
                  <p className="font-extrabold">This action is permanent and cannot be undone.</p>
                  <p className="font-medium text-[11px] text-amber-700/90 leading-relaxed">
                    Once signed, the SOAP notes will be locked. No further edits or draft saves will be permitted.
                    The finalized record will be added to the patient's permanent clinical history.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSignModal(false)}
                className="btn border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowSignModal(false);
                  if (!encounterId) return;
                  try {
                    await signMutation.mutateAsync({ patientId, encounterId });
                    setShowSuccess(true);
                  } catch {
                    // Handled by mutation error state
                  }
                }}
                disabled={signMutation.isPending}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSignature className="h-3.5 w-3.5" />
                {signMutation.isPending ? 'Signing...' : 'Confirm Sign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
