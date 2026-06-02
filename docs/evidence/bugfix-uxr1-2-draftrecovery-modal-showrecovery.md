# BUGFIX-UXR1-2 — DraftRecovery Modal UX + showRecovery State Reset

**Date:** 2026-06-02
**Branch:** `bugfix/uxr1-wire-patient-note-autodraft` (continuing on same branch)
**Base:** `main`

## Bugs Addressed

| ID | Severity | Description |
|----|----------|-------------|
| BUG-3 | P2 | DraftRecoveryDialog missing modal UX (backdrop, focus trap, Escape key) |
| BUG-4 | P2 | `showRecovery` state not reset when `patientId` changes without remount |

## Files Changed

- `hms-frontend/src/lib/autodraft/DraftRecoveryDialog.tsx` — full rewrite (modal UX)
- `hms-frontend/src/features/notes/PatientNoteForm.tsx` — +4 lines (BUG-4 fix)

## BUG-3 Fix Summary

**What changed in DraftRecoveryDialog:**
- Wrapped content in a full-screen backdrop overlay matching project pattern: `fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in`
- Dialog panel styled with `bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full mx-4`
- Added Escape key handler that calls `onClose` when provided
- Added focus trap: Tab/Shift+Tab cycle through focusable elements (buttons) within the dialog
- Auto-focuses first focusable element on mount via `requestAnimationFrame`
- Backdrop click dismisses via `onClose` (matches project pattern)
- Buttons use project-standard classes (`btn btn-primary`, `btn btn-secondary`, `btn btn-ghost`)

## BUG-4 Fix Summary

**What changed in PatientNoteForm:**
- Added `useEffect` that resets `showRecovery` to `true` when `patientId` changes
- This ensures that navigating to a different patient re-shows the recovery dialog if a draft exists for that patient

## Verification

| Command | Result |
|---------|--------|
| `npm run lint -- --max-warnings=0` | 0 errors, 0 warnings |
| `npm run typecheck` | PASS |
| `npm test` | 145/145 (16 files) |
| `npm run build` | PASS |

## Bugs Still Parked

None.

## Final Verdict

**STAGING-ONLY / BUGFIX-UXR1-2 DRAFTRECOVERY MODAL UX + SHOWRECOVERY RESET FIXED**
