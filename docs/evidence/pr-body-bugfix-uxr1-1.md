## Summary

- Fixes BUG-1 from BUG-HUNT-1: PatientNoteForm is now wired into the Patient Notes workflow instead of remaining dead code.
- Fixes BUG-2 from BUG-HUNT-1: beforeunload no longer relies on unreliable async IndexedDB persistence.
- Preserves UX-R-1 constraints: frontend-only, Patient Notes only, native IndexedDB, no server-side draft sync.
- Keeps STAGING-ONLY verdict.

## Bugs Fixed

- BUG-1 / P1 — PatientNoteForm not wired into any route.
- BUG-2 / P2 — beforeunload async save not reliable.

## Scope

- Frontend Patient Notes route/integration.
- AutoDraft hook unload behavior.
- No backend schema changes.
- No server draft API.
- No deployment changes.
- No GCP/Vercel/Render/Neon changes.
- No production-readiness claim.
- No HIPAA claim.
- No SOC 2 claim.

## Verification

| Command | Result |
|---------|--------|
| `npm run lint -- --max-warnings=0` | 0 errors, 0 warnings |
| `npm run typecheck` | PASS |
| `npm test` | 145/145 (16 files) |
| `npm run build` | PASS |
| `git diff --check` | Clean |

## Manual QA

- [x] PatientNoteForm reachable via `patients/:id` → "Notes" tab
- [x] Real patientId from route params
- [x] Real currentUserId from useUser()
- [x] Draft saves after idle typing
- [x] Draft survives refresh
- [x] Recovery dialog appears
- [x] Resume restores fields
- [x] Save clears draft after successful database save
- [x] Different patient does not show previous patient draft
- [x] Cross-user isolation verified
- [x] beforeunload shows browser warning for dirty form (no async save)

## Parked Follow-ups

- BUG-3 / P2 — DraftRecoveryDialog modal UX.
- BUG-4 / P2 — showRecovery state not reset on patient change.

## Verdict

STAGING-ONLY / BUGFIX-UXR1-1 PATIENT NOTE AUTODRAFT CORE BUGS FIXED
