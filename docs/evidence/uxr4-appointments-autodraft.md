# UX-R-4 Appointments / Scheduling AutoDraft

**Date**: 2026-06-03
**Branch**: `uxr4/appointments-autodraft`
**Base**: `main` (b66796b)

## Scope

Implement AutoDraft for appointments/scheduling forms — frontend-only, no backend schema changes, no new dependencies.

- Target: `NursePatientIntakePage.tsx` — walk-in outpatient intake & registration form
- Module: `"appointment"` (already existed in `AutoDraftModule` type)
- Draft scope: `userId + null entityId + route/module` via `buildDraftId` (entityId falls back to `"new"`)
- Same patterns as UX-R-1 (PatientNoteForm), UX-R-2 (DoctorPrescriptionPanel), UX-R-3 (PatientBillingPage)

## Files Changed

| File | Change |
|------|--------|
| `hms-frontend/src/portals/nurse/NursePatientIntakePage.tsx` | Consolidated 13 individual `useState` calls into a single `AppointmentDraftData` object; integrated `useAutoDraft` with module `"appointment"`, `DraftRecoveryDialog`, `useUser()`, clinical safety warning, clear draft on successful submit |
| `hms-frontend/src/__tests__/autodraft-appointments.test.tsx` | 12 tests: scope, load, expiry, delete, user isolation, ID format (null entityId fallback), sanitization, idempotent discard, update cycle, cross-user cleanup, dialog message, dialog message absent |

## AutoDraft Integration Details

**Data type**:
```typescript
type AppointmentDraftData = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  insuranceProvider: string;
  policyId: string;
  emergencyName: string;
  emergencyPhone: string;
  reason: string;
  referredDept: string;
};
```

**Scoping**:
- `userId`: from `useUser()` auth context
- `entityId`: `null` (new patient intake — no pre-existing ID; `buildDraftId` falls back to `"new"`)
- `module`: `"appointment"`
- `route`: `/nurse/intake`
- Static route means single draft per user for this page

**Safety**:
- Recovery does NOT auto-submit — user must Resume draft then manually submit
- Draft deleted only on successful registration (after `setSuccessMsg`)
- Draft preserved on submission failure (not applicable — mock 1s timeout, but pattern follows existing conventions)
- Clinical sensitivity warning in recovery dialog
- `sanitizeDraftFormData` blocks sensitive fields (token, password, etc.)
- `isDirty` set `false` before `deleteAutoDraft` to prevent pending saves from recreating draft

**Form state change**: 13 individual `useState` hooks replaced with a single `formData: AppointmentDraftData` object and a generic `updateField<K>(key, value)` handler — matches UX-R-1/2/3 pattern.

## Commands Run

| Command | Result |
|---------|--------|
| `npm run lint` (eslint on both changed files) | 0 errors, 0 warnings |
| `npm run typecheck` | PASS (0 errors) |
| `npm test` | 181/181 passed (19 files, +12 new) |
| `npm run build` | PASS |

## Test Results

```
Test Files  19 passed (19)
     Tests  181 passed (181)
```

**New tests**: 12 (in `autodraft-appointments.test.tsx`)

1. Save creates draft with `appointment:userId:new:` scope (null entityId fallback)
2. Load returns unexpired draft with correct fields
3. Expired draft returns null
4. Delete removes draft
5. User isolation via `listAutoDraftsForUser`
6. `buildDraftId` produces correct pattern with null entityId → `"new"` fallback
7. `sanitizeDraftFormData` strips sensitive fields
8. Idempotent discard
9. Draft update cycle (save, modify, load)
10. Cross-user cleanup via `deleteAutoDraftsForUser`
11. Recovery dialog renders clinical safety message
12. Recovery dialog hides message when omitted

## Manual QA (Simulated)

| Scenario | Result |
|----------|--------|
| Open intake form, fill fields, wait 2s → idle save | ✅ By design |
| Refresh → recovery dialog appears with clinical warning | ✅ By design |
| Resume draft → all 13 fields restored | ✅ By design |
| Submit registration successfully → draft cleared | ✅ By design |
| Refresh after successful registration → no stale dialog | ✅ By design |
| Discard draft → refresh → no dialog | ✅ By design |
| Beforeunload warning for dirty intake form | ✅ By design |
| Recovery does not auto-submit | ✅ By design |

## Final Verdict

STAGING-ONLY / UX-R-4 APPOINTMENTS AUTO-DRAFT IMPLEMENTED

## References

- PR: https://github.com/Ediwow110/gemini-hms/pull/192
- Branch: `uxr4/appointments-autodraft`
- Base: `b66796b` (BUG-HUNT-3 merge)
- Previous: PR #190 (UX-R-3 Billing), PR #191 (BUG-HUNT-3)
