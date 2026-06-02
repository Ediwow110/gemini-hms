# UX-R-2 Prescriptions AutoDraft

**Feature**: Prescriptions / Pharmacy Forms AutoDraft — auto-save prescription form data to IndexedDB and recover on return.

## Files Modified

| File | Change |
|------|--------|
| `hms-frontend/src/portals/doctor/components/DoctorPrescriptionPanel.tsx` | Integrated `useAutoDraft` with module `"prescription"`, added `DraftRecoveryDialog`, refactored `useState` fields into single `PrescriptionDraftData` object, clear draft on successful submit |
| `hms-frontend/src/portals/doctor/DoctorEMRPage.tsx` | Added `useUser()` hook, passes `currentUserId` prop to `DoctorPrescriptionPanel` |

## Files Created

| File | Description |
|------|-------------|
| `hms-frontend/src/__tests__/autodraft-prescription.test.ts` | 10 tests: scope, load, expiry, delete, user isolation, ID format, sanitization, idempotent discard, update cycle, cross-user cleanup |

## Test Results

```
Test Files  17 passed (17)
     Tests  155 passed (155)
```

**New tests**: 10 (all in `autodraft-prescription.test.ts`)

Test coverage:
1. Save creates draft with `prescription:userId:patientId` scope
2. Load returns unexpired draft with correct fields
3. Expired draft returns null
4. Delete removes draft
5. User isolation via `listAutoDraftsForUser`
6. `buildDraftId` produces correct pattern
7. `sanitizeDraftFormData` strips sensitive fields (token, password, authorization)
8. Idempotent discard (double delete does not throw)
9. Draft update cycle (save, delete, save modified, load modified)
10. Cross-user cleanup via `deleteAutoDraftsForUser`

## Verification

```
typecheck: PASS (0 errors)
lint:      PASS (0 errors, 0 warnings)
test:      PASS (155/155, 17 files)
build:     PASS (vite production)
```

## Design Notes

- Reuses existing `useAutoDraft` hook with `module: "prescription"` — no hook changes needed
- `AutoDraftModule` already included `"prescription"` value from UX-R-1
- Draft scope: `buildDraftId({ userId, module: "prescription", entityId: patientId, route })`
- 72-hour TTL same as patient notes
- Draft cleared on successful prescription submission via `deleteAutoDraft(draftId)`
- `DraftRecoveryDialog` shown on mount when a recoverable draft exists
- Form fields refactored from individual `useState` calls to single `PrescriptionDraftData` object for `useAutoDraft` compatibility

## References

- PR: #190
- Branch: `uxr2/prescriptions-autodraft`
- Main commit: `f632c52`
- Previous: PR #187 (UX-R-1 system optimization)
