import { useMemo, useState } from "react";
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

  function updateField<K extends keyof PatientNoteFormData>(
    key: K,
    value: PatientNoteFormData[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  async function saveToDatabase() {
    // Replace this with your real API call.
    // await api.patientNotes.create({ patientId, ...formData });

    setIsDirty(false);

    // Critical: clear local draft after successful real save.
    await deleteAutoDraft(autoDraft.draftId);
  }

  return (
    <>
      {showRecovery ? (
        <DraftRecoveryDialog
          draft={autoDraft.recoveredDraft}
          onResume={(draftFormData) => {
            setFormData(draftFormData);
            setIsDirty(true);
            autoDraft.clearRecoveredDraft();
          }}
          onDiscard={autoDraft.discardDraft}
          onClose={() => setShowRecovery(false)}
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
            await autoDraft.discardDraft();
            setIsDirty(false);
          }}
        >
          Discard local draft
        </button>
      </form>
    </>
  );
}
