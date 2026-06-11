import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pill, Plus, AlertTriangle } from 'lucide-react';
import { usePatientPrescriptions, useCreatePrescription } from '../../../hooks/use-doctor';
import { useAutoDraft } from '../../../lib/autodraft/useAutoDraft';
import { DraftRecoveryDialog } from '../../../lib/autodraft/DraftRecoveryDialog';
import { safeDeleteAutoDraft } from '../../../lib/autodraft/indexedDbDraftStore';
import type { PrescriptionDto } from '../../../services/doctor.service';

type PrescriptionDraftData = {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  encounterId: string;
};

const EMPTY_FORM: PrescriptionDraftData = {
  medicationName: '',
  dosage: '1 tablet',
  frequency: 'Once daily (OD)',
  duration: '30 days',
  instructions: '',
  encounterId: '',
};

interface DoctorPrescriptionPanelProps {
  patientId: string;
  isLocked: boolean;
  currentUserId: string;
  encounterId?: string;
}

export const DoctorPrescriptionPanel = ({ 
  patientId, 
  isLocked, 
  currentUserId,
  encounterId 
}: DoctorPrescriptionPanelProps) => {
  const { data: prescriptions, isLoading, refetch } = usePatientPrescriptions(patientId);
  const createRx = useCreatePrescription();

  const [formData, setFormData] = useState<PrescriptionDraftData>(EMPTY_FORM);
  const [isDirty, setIsDirty] = useState(false);
  const [showRecovery, setShowRecovery] = useState(true);

  useEffect(() => {
    setShowRecovery(true);
    setFormData(EMPTY_FORM);
    setIsDirty(false);
  }, [patientId]);

  // Auto-fill encounterId from prop if form field is empty and no draft was just recovered
  useEffect(() => {
    if (encounterId && !formData.encounterId) {
      setFormData((prev) => ({ ...prev, encounterId }));
    }
  }, [encounterId, formData.encounterId]);

  const route = useMemo(
    () => `/patients/${patientId}/prescriptions/new`,
    [patientId]
  );

  const autoDraft = useAutoDraft<PrescriptionDraftData>({
    enabled: true,
    userId: currentUserId,
    module: 'prescription',
    entityId: patientId,
    route,
    formData,
    isDirty,
    ttlHours: 72,
  });

  const { draftId, discardDraft, clearRecoveredDraft } = autoDraft;

  const updateField = useCallback(
    <K extends keyof PrescriptionDraftData>(key: K, value: PrescriptionDraftData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    []
  );

  const handleResume = useCallback(
    (draftFormData: PrescriptionDraftData) => {
      setFormData(draftFormData);
      setIsDirty(true);
      clearRecoveredDraft();
    },
    [clearRecoveredDraft]
  );

  const handleClose = useCallback(() => setShowRecovery(false), []);

  const handleAddRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medicationName || isLocked || !formData.encounterId) return;

    createRx.mutate(
      {
        patientId,
        encounterId: formData.encounterId,
        medicationName: formData.medicationName,
        dosage: formData.dosage,
        frequency: formData.frequency,
        duration: formData.duration,
        notes: formData.instructions || undefined,
      },
      {
        onSuccess: () => {
          setIsDirty(false);
          safeDeleteAutoDraft(draftId, "prescription-submit-success");
          setFormData((prev) => ({
            ...prev,
            medicationName: '',
            instructions: '',
          }));
          refetch();
        },
      },
    );
  };

  const safePrescriptions = prescriptions || [];

  return (
    <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4" data-patient-id={patientId}>
      {/* WIP Banner */}
      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2 text-xs text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <div>
          <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Prescriptions (Real — CDS/E-Prescribing WIP)</h5>
          <p className="font-medium mt-0.5">
            Prescriptions are saved to the live patient record and visible in the pharmacy queue. Drug interaction checks and external e-prescribing remain in development.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider uppercase flex items-center gap-2">
          <Pill className="h-4 w-4 text-indigo-500" />
          Prescriptions
        </h3>
        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
          {safePrescriptions.length} Meds
        </span>
      </div>

      {/* Recovery dialog */}
      {showRecovery ? (
        <DraftRecoveryDialog
          draft={autoDraft.recoveredDraft}
          onResume={handleResume}
          onDiscard={discardDraft}
          onClose={handleClose}
          message="Recovered prescription draft — review all fields carefully before submitting. This is local browser data, not a saved prescription."
        />
      ) : null}

      {/* Encounter ID input (required for prescription creation) */}
      {!isLocked && !formData.encounterId && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
          <p className="font-semibold">Enter Encounter ID to enable prescribing:</p>
          <input
            type="text"
            value={formData.encounterId}
            onChange={(e) => updateField('encounterId', e.target.value)}
            placeholder="Paste encounter UUID..."
            className="mt-2 w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
        </div>
      )}

      {!isLocked && formData.encounterId && (
        <div className="space-y-1 mb-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Encounter ID</label>
            {encounterId === formData.encounterId && (
              <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                Linked to active encounter
              </span>
            )}
          </div>
          <input
            type="text"
            value={formData.encounterId}
            onChange={(e) => updateField('encounterId', e.target.value)}
            placeholder="Paste encounter UUID..."
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
          />
        </div>
      )}

      {/* Add Prescription form */}
      {!isLocked && formData.encounterId && (
        <form onSubmit={handleAddRx} className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.medicationName}
              onChange={(e) => updateField('medicationName', e.target.value)}
              placeholder="Medication Name (e.g. Paracetamol 500mg)..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
            />
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => updateField('duration', e.target.value)}
              placeholder="Duration (e.g. 7 days)..."
              className="w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => updateField('dosage', e.target.value)}
              placeholder="Dosage (e.g. 1 tab)..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none"
            />
            <select
              value={formData.frequency}
              onChange={(e) => updateField('frequency', e.target.value)}
              className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="Once daily (OD)">Once daily (OD)</option>
              <option value="Twice daily (BID)">Twice daily (BID)</option>
              <option value="Three times daily (TID)">Three times daily (TID)</option>
              <option value="Four times daily (QID)">Four times daily (QID)</option>
              <option value="Every 4 hours (q4h)">Every 4 hours (q4h)</option>
              <option value="As needed (PRN)">As needed (PRN)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={formData.instructions}
              onChange={(e) => updateField('instructions', e.target.value)}
              placeholder="Special instructions..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={createRx.isPending || !formData.medicationName}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-1.5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createRx.isPending ? 'Saving...' : <><Plus className="h-3.5 w-3.5" /> Add</>}
            </button>
          </div>

          {autoDraft.lastDraft ? (
            <p className="text-[10px] text-slate-400">
              Local draft saved {new Date(autoDraft.lastDraft.updatedAt).toLocaleTimeString()}
            </p>
          ) : null}

          {autoDraft.isSavingDraft ? (
            <p className="text-[10px] text-amber-600 font-semibold">Saving draft...</p>
          ) : null}

          {createRx.isError && (
            <p className="text-[10px] text-rose-600 font-semibold">
              Failed to save prescription. Please verify the encounter ID and try again.
            </p>
          )}
        </form>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-4 text-slate-400 text-xs font-semibold">
          Loading prescriptions...
        </div>
      )}

      {/* Prescription List */}
      {!isLoading && (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {safePrescriptions.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-semibold">
              No active prescriptions for this patient.
            </div>
          ) : (
            safePrescriptions.map((rx: PrescriptionDto) => (
              <div
                key={rx.id}
                className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5 text-indigo-500" />
                    {rx.medicationName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 font-semibold">
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{rx.dosage}</span>
                    <span>{rx.frequency}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600">Dur: {rx.duration}</span>
                    <span className="text-slate-300">•</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      rx.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                      rx.status === 'DISPENSED' ? 'bg-blue-50 text-blue-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {rx.status}
                    </span>
                  </div>
                  {rx.notes && (
                    <p className="text-[10px] text-slate-400 italic">Instructions: {rx.notes}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
export default DoctorPrescriptionPanel;
