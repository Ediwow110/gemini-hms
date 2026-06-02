# UX-R-3 Billing/Invoices AutoDraft

**Date**: 2026-06-03
**Branch**: `uxr3/billing-invoices-autodraft`
**Base**: `main` (f64f3a3)

## Scope

Implement AutoDraft for billing/invoice forms — frontend-only, no backend schema changes, no new dependencies.

- Target: `PatientBillingPage.tsx` — the primary billing form with real API integration
- Module: `"billing-invoice"` (already existed in `AutoDraftModule` type)
- Draft scope: `userId + invoiceId + route/module` via `buildDraftId`
- Same patterns as UX-R-1 (PatientNoteForm) and UX-R-2 (DoctorPrescriptionPanel)

## Files Changed

| File | Change |
|------|--------|
| `hms-frontend/src/portals/cashier/PatientBillingPage.tsx` | Integrated `useAutoDraft` with module `"billing-invoice"`, added `DraftRecoveryDialog`, `useUser()`, `BillingDraftData` type, financial sensitivity warning, clear draft on successful payment |
| `hms-frontend/src/__tests__/autodraft-billing.test.tsx` | 12 tests: scope, load, expiry, delete, user isolation, ID format, sanitization, idempotent discard, update cycle, cross-user cleanup, dialog message, dialog message absent |

## AutoDraft Integration Details

**Data type**:
```typescript
type BillingDraftData = {
  paymentMethod: string; // 'cash', 'card', 'online', 'hmo'
};
```

**Scoping**:
- `userId`: from `useUser()` auth context
- `entityId`: `invoiceId` from URL params (`?invoice=`)
- `module`: `"billing-invoice"`
- `route`: ``/cashier/billing?invoice=${invoiceId}``
- Changing invoice → changes entityId + route → unique draft identity

**Safety**:
- Recovery does NOT auto-submit — user must Resume draft then manually confirm payment
- Draft deleted only on successful `postPayment` (`handleConfirmPayment` try block)
- Draft preserved on payment failure (`catch` block)
- Financial sensitivity warning in recovery dialog
- `sanitizeDraftFormData` blocks sensitive fields
- `isDirty` set `false` before `deleteAutoDraft` to prevent pending saves from recreating draft

**Updated `PaymentMethodPanel` state**: `onMethodChange` now sets `isDirty(true)` via `handleMethodChange`.

## Commands Run

| Command | Result |
|---------|--------|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | PASS (0 errors) |
| `npm test` | 169/169 passed (18 files, +12 new) |
| `npm run build` | PASS |

## Test Results

```
Test Files  18 passed (18)
     Tests  169 passed (169)
```

**New tests**: 12 (in `autodraft-billing.test.tsx`)

1. Save creates draft with `billing-invoice:userId:invoiceId` scope
2. Load returns unexpired draft with correct fields
3. Expired draft returns null
4. Delete removes draft
5. User isolation via `listAutoDraftsForUser`
6. `buildDraftId` produces correct pattern
7. `sanitizeDraftFormData` strips sensitive fields
8. Idempotent discard
9. Draft update cycle
10. Cross-user cleanup via `deleteAutoDraftsForUser`
11. Recovery dialog renders financial safety message
12. Recovery dialog hides message when omitted

## Manual QA (Simulated)

| Scenario | Result |
|----------|--------|
| Open billing page, select payment method, wait 2s → idle save | ✅ By design |
| Refresh → recovery dialog appears with billing warning | ✅ By design |
| Resume draft → payment method restored | ✅ By design |
| Confirm payment successfully → draft cleared | ✅ By design |
| Refresh after payment → no stale dialog | ✅ By design |
| Navigate to different invoice → different draft scope | ✅ By design |
| Payment fails → draft preserved | ✅ By design |
| Discard draft → refresh → no dialog | ✅ By design |
| Beforeunload warning for dirty billing form | ✅ By design |
| Recovery does not auto-submit | ✅ By design |

## Final Verdict

STAGING-ONLY / UX-R-3 BILLING AUTO-DRAFT IMPLEMENTED

## References

- PR: https://github.com/Ediwow110/gemini-hms/pull/190
- Branch: `uxr3/billing-invoices-autodraft`
- Base: `f64f3a3` (BUG-HUNT-2 merge)
- Previous: PR #188 (UX-R-2 Prescriptions), PR #189 (BUG-HUNT-2)
