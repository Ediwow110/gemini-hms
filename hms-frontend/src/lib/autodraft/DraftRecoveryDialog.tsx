import { useCallback, useEffect, useRef } from "react";
import { AutoDraft } from "./types";

type DraftRecoveryDialogProps<TFormData> = {
  draft: AutoDraft<TFormData> | null;
  onResume: (formData: TFormData) => void;
  onDiscard: () => void;
  onClose?: () => void;
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function DraftRecoveryDialog<TFormData>({
  draft,
  onResume,
  onDiscard,
  onClose,
}: DraftRecoveryDialogProps<TFormData>) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key === "Tab") {
        const el = dialogRef.current;
        if (!el) return;

        const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!draft) return;

    document.addEventListener("keydown", handleKeyDown);

    // Focus first focusable element on open.
    requestAnimationFrame(() => {
      const el = dialogRef.current;
      if (!el) return;
      const first = el.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    });

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [draft, handleKeyDown]);

  if (!draft) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-recovery-title"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full mx-4"
      >
        <h2 id="draft-recovery-title" className="text-lg font-semibold text-slate-900 mb-2">
          Unsaved draft found
        </h2>

        <p className="text-sm text-slate-600 mb-1">
          A local unsaved draft was found for this form.
        </p>

        <p className="text-sm text-slate-600 mb-3">
          Last saved:{" "}
          <strong>{new Date(draft.updatedAt).toLocaleString()}</strong>
        </p>

        <p className="text-xs text-slate-500 mb-4">
          This draft is stored locally in this browser only. It is not a database
          save and it is not a backup.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onResume(draft.formData);
              onClose?.();
            }}
          >
            Resume draft
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onDiscard();
              onClose?.();
            }}
          >
            Discard draft
          </button>

          {onClose ? (
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Decide later
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
