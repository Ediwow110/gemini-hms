import { useCallback, useEffect, useMemo, useState } from "react";
import { useAutoDraft } from "@/lib/autodraft/useAutoDraft";
import { DraftRecoveryDialog } from "@/lib/autodraft/DraftRecoveryDialog";
import { deleteAutoDraft } from "@/lib/autodraft/indexedDbDraftStore";

type PatientNoteFormData = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

type PatientNoteFormProps = {
  currentUserId: string;
  patientId: string;
  appVersion?: string;
};

const EMPTY_FORM: PatientNoteFormData = {
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
};

export function PatientNoteForm({
  currentUserId,
  patientId,
  appVersion,
}: PatientNoteFormProps) {
  const [formData, setFormData] = useState<PatientNoteFormData>(EMPTY_FORM);
  const [isDirty, setIsDirty] = useState(false);
  const [showRecovery, setShowRecovery] = useState(true);

  useEffect(() => {
    setShowRecovery(true);
  }, [patientId]);

  const route = useMemo(
    () => `/patients/${patientId}/notes/new`,
    [patientId]
  );

  const autoDraft = useAutoDraft<PatientNoteFormData>({
    enabled: true,
    userId: currentUserId,
    module: "patient-note",
    entityId: patientId,
    route,
    formData,
    isDirty,
    ttlHours: 72,
    appVersion,
  });

  const { draftId, discardDraft, clearRecoveredDraft } = autoDraft;

  const updateField = useCallback(
    <K extends keyof PatientNoteFormData>(key: K, value: PatientNoteFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    []
  );

  const saveToDatabase = useCallback(async () => {
    // Replace this with your real API call.
    // await api.patientNotes.create({ patientId, ...formData });

    setIsDirty(false);

    // Critical: clear local draft after successful real save.
    await deleteAutoDraft(draftId);
  }, [draftId]);

  const handleResume = useCallback(
    (draftFormData: PatientNoteFormData) => {
      setFormData(draftFormData);
      setIsDirty(true);
      clearRecoveredDraft();
    },
    [clearRecoveredDraft]
  );

  const handleClose = useCallback(() => setShowRecovery(false), []);

  return (
    <>
      {showRecovery ? (
        <DraftRecoveryDialog
          draft={autoDraft.recoveredDraft}
          onResume={handleResume}
          onDiscard={discardDraft}
          onClose={handleClose}
        />
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          saveToDatabase();
        }}
      >
        <div>
          <label>
            Subjective
            <textarea
              value={formData.subjective}
              onChange={(event) => updateField("subjective", event.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Objective
            <textarea
              value={formData.objective}
              onChange={(event) => updateField("objective", event.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Assessment
            <textarea
              value={formData.assessment}
              onChange={(event) => updateField("assessment", event.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Plan
            <textarea
              value={formData.plan}
              onChange={(event) => updateField("plan", event.target.value)}
            />
          </label>
        </div>

        <div>
          {autoDraft.lastDraft ? (
            <small>
              Local draft saved{" "}
              {new Date(autoDraft.lastDraft.updatedAt).toLocaleTimeString()}
            </small>
          ) : null}

          {autoDraft.isSavingDraft ? <small>Saving draft...</small> : null}
        </div>

        <button type="submit">Save note</button>

        <button
          type="button"
          onClick={async () => {
            await discardDraft();
            setIsDirty(false);
          }}
        >
          Discard local draft
        </button>
      </form>
    </>
  );
}
