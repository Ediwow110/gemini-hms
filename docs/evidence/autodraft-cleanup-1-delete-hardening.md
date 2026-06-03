# AUTO-DRAFT-CLEANUP-1 — Best-Effort deleteAutoDraft Cleanup Hardening

**Date:** 2026-06-03
**Branch:** `maintenance/autodraft-delete-cleanup-hardening`
**Base:** `main` (`d4e2762`)

## Scope

- AutoDraft cleanup behavior only
- Frontend only
- No backend changes
- No schema/migrations
- No deployment
- No dependencies

## Files Inspected

- `hms-frontend/src/lib/autodraft/indexedDbDraftStore.ts`
- `hms-frontend/src/lib/autodraft/useAutoDraft.ts`
- `hms-frontend/src/features/notes/PatientNoteForm.tsx`
- `hms-frontend/src/portals/doctor/components/DoctorPrescriptionPanel.tsx`
- `hms-frontend/src/portals/cashier/PatientBillingPage.tsx`
- `hms-frontend/src/portals/nurse/NursePatientIntakePage.tsx`
- `hms-frontend/src/__tests__/autodraft-store.test.ts`

## Files Changed

| File | Change |
|------|--------|
| `indexedDbDraftStore.ts` | Added `safeDeleteAutoDraft` helper — best-effort wrapper |
| `useAutoDraft.ts` | `discardDraft` uses `safeDeleteAutoDraft`; removed unused import |
| `PatientNoteForm.tsx` | `deleteAutoDraft` → `safeDeleteAutoDraft` with context `patient-note-submit-success` |
| `DoctorPrescriptionPanel.tsx` | `deleteAutoDraft` → `safeDeleteAutoDraft` with context `prescription-submit-success` |
| `PatientBillingPage.tsx` | `deleteAutoDraft` → `safeDeleteAutoDraft` with context `billing-payment-success` |
| `NursePatientIntakePage.tsx` | `deleteAutoDraft` → `safeDeleteAutoDraft` with context `appointment-registration-success` |
| `autodraft-store.test.ts` | Added 3 tests for `safeDeleteAutoDraft` |

## Cleanup Policy

- Delete cleanup is **best-effort** — never blocks successful real save
- Cleanup failure returns `false` and logs generic warning in DEV only (no PHI/secrets)
- Failed real save preserves draft (unchanged behavior)
- No draft content, form data, or patient information is logged
- Context string is generic (e.g., `patient-note-submit-success`, `billing-payment-success`)

## Module Review

| Module | Before | After |
|--------|--------|-------|
| Patient Notes | `await deleteAutoDraft(draftId)` — could block success | `await safeDeleteAutoDraft(...)` — non-fatal |
| Prescriptions | `deleteAutoDraft(draftId)` — fire-and-forget | `safeDeleteAutoDraft(...)` — non-fatal |
| Billing | `try { await deleteAutoDraft(draftId); } catch { }` — silent | `await safeDeleteAutoDraft(...)` — non-fatal, dev-warning on failure |
| Appointments | `deleteAutoDraft(draftId)` — fire-and-forget | `safeDeleteAutoDraft(...)` — non-fatal |

## Race Condition Review

**Potential stale re-save after successful submit:**
If a pending idle/periodic save is mid-execution when a successful submit fires, the save could complete after cleanup and recreate the draft. This is mitigated by:
- `saveNow` checks `saveParamsRef.current.isDirty` at entry → exits early if dirty cleared
- `isDirty` is set to false before cleanup runs in all 4 modules
- The window is narrow (IndexedDB writes are fast) and the worst outcome is a stale draft shown on next recovery, which requires explicit user review to restore

**Verdict:** Acceptable P3 risk. No code change needed.

## Tests Added

- `safeDeleteAutoDraft returns true when delete succeeds`
- `safeDeleteAutoDraft does not throw when draft does not exist`
- `safeDeleteAutoDraft returns boolean (true or false) and never throws`

## Verification

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm test` | ✅ 184/184 (19 files) — 3 new tests pass |
| `npm run build` | ✅ built in 1.23s |
| `git diff --check` | ✅ no whitespace errors |

## Bug Fixed/Hardened

**BUG-HUNT-4-1 / P3** — fire-and-forget `deleteAutoDraft` hardened:
- All 4 consumer modules now use `safeDeleteAutoDraft` with best-effort semantics
- Cleanup failure never blocks success UI
- DEV-only warnings for observability without exposing PHI
- Shared helper prevents drift across modules

## Deferred Items

- Backend lint warnings (447 pre-existing) remain out of scope
- Staging/GCP IAM remains out of scope
- Production readiness remains out of scope
- Race condition between pending auto-save and submit cleanup remains accepted P3

## Final Verdict

**STAGING-ONLY / AUTO-DRAFT CLEANUP DELETE HARDENING COMPLETE**
