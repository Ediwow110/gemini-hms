# BUGFIX-UXR1-1 — Wire PatientNoteForm Route + Fix beforeunload AutoDraft Reliability

**Date:** 2026-06-02
**Branch:** `bugfix/uxr1-wire-patient-note-autodraft`
**Base:** `main`

## Bugs Addressed

| ID | Severity | Description |
|----|----------|-------------|
| BUG-1 | P1 | PatientNoteForm not wired into any route — dead code |
| BUG-2 | P2 | beforeunload handler async save not reliable |

## Files Changed

- `hms-frontend/src/features/patients/PatientProfile.tsx` — 17 insertions, 3 deletions
- `hms-frontend/src/lib/autodraft/useAutoDraft.ts` — 12 insertions, 4 deletions

## BUG-1 Fix Summary

**How PatientNoteForm is now reachable:**
- Added `"Notes"` to the tabs array in `PatientProfile.tsx`
- Added a render branch for `activeTab === "Notes"` that renders `<PatientNoteForm />`
- PatientNoteForm receives `patientId` from `useParams<{ id: string }>()` (the route param from `patients/:id`)
- PatientNoteForm receives `currentUserId` from `useUser()` hook
- No route changes needed — the existing `patients/:id` route already renders `PatientProfile`
- The Notes tab is consistent with the existing tab-based navigation pattern (Overview, Orders, Billing, etc.)

**No backend changes, no server-side sync, no new dependencies.**

## BUG-2 Fix Summary

**What changed in beforeunload behavior:**
- Removed the async `saveNow()` call from the `beforeunload` event handler
- Replaced with standard browser dirty-form warning via `event.preventDefault()` + `event.returnValue = ""`
- Added explicit comment: "Async IndexedDB writes during beforeunload are not reliably persisted by browsers"

**Why async save during unload is not treated as reliable:**
- Browsers may terminate pending async operations during page unload
- `indexedDB` writes initiated in a `beforeunload` handler are not guaranteed to complete

**Which save mechanisms remain primary:**
- Idle save after 2 seconds of inactivity
- Periodic save every 30 seconds
- `visibilitychange` save when the tab becomes hidden
- These three mechanisms provide reliable draft persistence

## Tests Added/Updated

No new tests added. Existing tests (145/145) continue to pass. The beforeunload behavior change is covered by:
- Manual QA checklist (below)
- Existing autodraft store tests (7 tests) continue to pass
- All 16 test files pass (145 tests)

## Verification Commands and Results

| Command | Result |
|---------|--------|
| `npm run lint -- --max-warnings=0` | 0 errors, 0 warnings |
| `npm run typecheck` | PASS |
| `npm test` | 145/145 (16 files) |
| `npm run build` | PASS |
| `git diff --check` | Clean |

## Manual QA

- [x] PatientNoteForm reachable via `patients/:id` → click "Notes" tab
- [x] Real `patientId` from route `useParams` is used
- [x] Real `currentUserId` from `useUser()` is used
- [x] Draft saves after idle typing (2s debounce)
- [x] Draft survives browser refresh (IndexedDB persistence)
- [x] Recovery dialog appears after refresh
- [x] Resume restores form fields
- [x] Save + refresh: no recovery dialog (draft cleared)
- [x] Different patient shows different draft scope
- [x] Cross-user isolation: draft scoped by userId
- [x] beforeunload shows browser warning when form is dirty (no async save)

## Bugs Intentionally Parked

| ID | Severity | Description |
|----|----------|-------------|
| BUG-3 | P2 | DraftRecoveryDialog missing modal UX (backdrop, focus trap, Escape key) |
| BUG-4 | P2 | `showRecovery` state not reset when `patientId` changes without remount |

## Final Verdict

**STAGING-ONLY / BUGFIX-UXR1-1 PATIENT NOTE AUTODRAFT CORE BUGS FIXED**
