
import { AutoDraft } from "./types";

type DraftRecoveryDialogProps<TFormData> = {
  draft: AutoDraft<TFormData> | null;
  onResume: (formData: TFormData) => void;
  onDiscard: () => void;
  onClose?: () => void;
};

export function DraftRecoveryDialog<TFormData>({
  draft,
  onResume,
  onDiscard,
  onClose,
}: DraftRecoveryDialogProps<TFormData>) {
  if (!draft) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="draft-recovery-title">
      <div>
        <h2 id="draft-recovery-title">Unsaved draft found</h2>

        <p>
          A local unsaved draft was found for this form.
        </p>

        <p>
          Last saved:{" "}
          <strong>{new Date(draft.updatedAt).toLocaleString()}</strong>
        </p>

        <p>
          This draft is stored locally in this browser only. It is not a database
          save and it is not a backup.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              onResume(draft.formData);
              onClose?.();
            }}
          >
            Resume draft
          </button>

          <button
            type="button"
            onClick={() => {
              onDiscard();
              onClose?.();
            }}
          >
            Discard draft
          </button>

          {onClose ? (
            <button type="button" onClick={onClose}>
              Decide later
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
