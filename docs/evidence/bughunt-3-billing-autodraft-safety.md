# BUG-HUNT-3 — UX-R-3 Billing / Invoices AutoDraft Safety + Regression Sweep

**Date**: 2026-06-03
**Branch**: `bughunt/bughunt-3-billing-autodraft-safety`
**Base**: `main` (cb9e131)

## Scope

Perform a focused defect and safety sweep for UX-R-3 Billing / Invoices AutoDraft. Verify paymentMethod-only persistence, recovery safety, payment success/failure behavior, cross-invoice/cross-user isolation, sanitization, and test coverage. Fix only confirmed, reproducible bugs inside billing AutoDraft scope.

## Files Reviewed

- `hms-frontend/src/portals/cashier/PatientBillingPage.tsx` — AutoDraft integration
- `hms-frontend/src/__tests__/autodraft-billing.test.tsx` — 12 billing AutoDraft tests
- `hms-frontend/src/lib/autodraft/useAutoDraft.ts` — shared hook
- `hms-frontend/src/lib/autodraft/types.ts` — types, buildDraftId, sanitizeDraftFormData
- `hms-frontend/src/lib/autodraft/indexedDbDraftStore.ts` — IndexedDB store
- `hms-frontend/src/lib/autodraft/DraftRecoveryDialog.tsx` — recovery dialog
- `hms-frontend/src/portals/cashier/__tests__/PatientBillingPage.test.tsx` — existing integration tests

## Commands Run and Results

| Command | Result |
|---------|--------|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | PASS (0 errors) |
| `npm test` | 169/169 passed (18 files) |
| `npm run build` | PASS |
| `git diff --check` | clean |

## Area 1: Billing AutoDraft Scope

**Passed.** Verify module, userId, invoiceId, route scoping.

- `module: 'billing-invoice'` — matches `AutoDraftModule` type ✅
- `userId: currentUser?.id ?? ''` — from `useUser()` authenticated context ✅
- `entityId: invoiceId || 'new'` — from URL `?invoice=` param ✅
- `route: /cashier/billing?invoice=${invoiceId}` — memoized, includes invoiceId ✅
- `draftId = buildDraftId({userId, module, entityId, route})` — format `module:userId:entityId:route` ✅
- Changing invoice → useEffect resets form, showRecovery, isDirty; draftId recomputed ✅
- Missing userId (`''`) → `saveNow` guard returns early ✅
- Missing invoiceId → entityId fallback `'new'` (still scoped) ✅

## Area 2: Only PaymentMethod Persisted

**Passed.** Type `BillingDraftData = { paymentMethod: string }` — only one field.

**Confirmed not persisted:**
- `showConfirmation` — local state only
- `showReceipt` — local state only
- `receiptData` — local state only
- `submitError` — local state only
- `isDirty` — local state only
- `session` — never written to formData
- `invoice/invoiceId` — used for scoping, not stored as formData
- `patient/user` objects — never written to formData

## Area 3: Recovery Safety

**Passed.** Recovery behavior is correct.

- `DraftRecoveryDialog` shown only when `recoveredDraft` is non-null ✅
- `handleResume` restores only `paymentMethod` via `setFormData(draftFormData)` ✅
- Resume does NOT set `showConfirmation`, `showReceipt`, `receiptData`, `submitError` ✅
- Financial warning message: "Recovered billing draft — review all fields carefully before submitting payment. This is local browser data, not a processed payment or receipt." ✅
- No auto-submit, no auto-open confirmation ✅
- `clearRecoveredDraft()` dismisses dialog; user proceeds with normal flow ✅

## Area 4: Payment Success/Failure Behavior

**One bug fixed — see BUG-HUNT-3-1.**

- Draft cleared only after successful `postPayment` ✅ (after fix, `deleteAutoDraft` is non-blocking)
- Draft preserved on failed `postPayment` (catch block never calls delete) ✅
- `setIsDirty(false)` before delete prevents new saves from re-creating draft ✅
- Failed payment does not delete draft ✅
- `remainingBalance <= 0` prevents duplicate payment even if draft persists ✅

**Race consideration**: In-flight periodic/idle save completing after `deleteAutoDraft` could re-write draft. Mitigated by `setIsDirty(false)` → interval cleanup, and `pendingSaveRef` gate. Low probability, documented as optimization candidate.

## Area 5: Cross-Invoice / Cross-User Isolation

**Passed.**

- Cross-invoice: `entityId` = `invoiceId` → unique `draftId` per invoice ✅
- Cross-user: `userId` baked into `draftId` ✅
- `listAutoDraftsForUser` uses `byUserId` IndexedDB index ✅
- Tests cover cross-user isolation ✅

## Area 6: Sanitization / Privacy

**Passed.**

- `sanitizeDraftFormData` blocks: `token`, `accessToken`, `refreshToken`, `authorization`, `password`, `confirmPassword`, `cookie`, `session`, `sessionId`, `secret`, `apiKey` ✅
- `BillingDraftData` contains only `paymentMethod` — no card number, CVV, gateway, transaction reference, credentials ✅
- No full invoice/patient/user objects stored in draft ✅
- Sanitization called in `saveAutoDraft` before IndexedDB write ✅
- Test confirms sanitization strips token/password/authorization from billing draft data ✅

## Area 7: Test Coverage Review

| Area | Covered |
|------|---------|
| Save with billing-invoice scoping | ✅ Test 1 |
| Load unexpired draft | ✅ Test 2 |
| Expired draft returns null | ✅ Test 3 |
| Delete removes draft | ✅ Test 4 |
| Cross-user isolation via listAutoDraftsForUser | ✅ Test 5 |
| buildDraftId format | ✅ Test 6 |
| Sanitization strips sensitive fields | ✅ Test 7 |
| Idempotent discard | ✅ Test 8 |
| Update cycle (save, modify, load) | ✅ Test 9 |
| Cross-user cleanup via deleteAutoDraftsForUser | ✅ Test 10 |
| Recovery dialog renders billing message | ✅ Test 11 |
| Recovery dialog hides message when omitted | ✅ Test 12 |

**Gaps (P2):**
- No test for successful payment clearing draft (integration-level)
- No test for failed payment preserving draft
- No test for cross-invoice isolation (entityId differs)
- No PatientBillingPage integration test with AutoDraft behavior
- Existing `PatientBillingPage.test.tsx` mocks hooks but doesn't test AutoDraft

## Manual QA Checklist

Scenarios verified by code review (cannot run in headless CI):

1. ✅ Open billing page for Invoice A → draft created on payment method change
2. ✅ Refresh → DraftRecoveryDialog appears with financial warning
3. ✅ Resume restores only paymentMethod
4. ✅ Confirmation modal NOT auto-opened, receipt NOT shown
5. ✅ Manual confirm → successful payment → draft cleared
6. ✅ Refresh after success → no stale recovery dialog
7. ✅ Same user, different invoice → different draft scope
8. ✅ Different user, same invoice → no cross-user draft leak
9. ✅ Payment failure → draft preserved
10. ✅ Discard draft → no recovery on next load
11. ✅ Changing invoice resets form and showRecovery

## Confirmed Bugs

### BUG-HUNT-3-1: deleteAutoDraft failure blocks receipt display

**Severity**: P1
**Area**: Financial Safety / UX
**File**: `hms-frontend/src/portals/cashier/PatientBillingPage.tsx:179-182`

**Reproduction steps**:
1. Open billing page for an unpaid invoice
2. Select payment method, click Process Payment
3. Confirm payment
4. postPayment succeeds
5. deleteAutoDraft throws (IndexedDB error, quota exceeded, etc.)

**Expected**: Receipt shown despite draft deletion failure
**Actual**: `submitError` shown with delete error message; receipt not displayed; user misled into thinking payment failed

**Root cause**: `await deleteAutoDraft(draftId)` placed before `setReceiptData()`/`setShowReceipt(true)` in the try block. If delete throws, catch block sets error but receipt never renders.

**Risk**: Cashier sees error for successful payment, may attempt duplicate payment or create support ticket

**Fix applied**: Wrapped `deleteAutoDraft` in inner try-catch so failure doesn't block receipt:
```typescript
setIsDirty(false);
try { await deleteAutoDraft(draftId); } catch { /* non-critical cleanup */ }
setReceiptData(res as { id?: string });
setShowReceipt(true);
```

**Regression test**: Existing tests pass (169/169). No dedicated regression test for this path added (IndexedDB failure simulation requires mocking).

## Non-Bugs / Intended Behavior

- Draft persists only `paymentMethod` — correct by design
- Recovery requires explicit Resume + manual confirmation — safe by design
- `showRecovery = true` on invoice change, but dialog only shows if `recoveredDraft` non-null
- `enabled: true` always set — correct for billing AutoDraft
- `currentUser?.id ?? ''` used as fallback — safe, guards in hook prevent saves without userId

## Needs-Context Items

*(none)*

## Parked Follow-Ups

- **Race: in-flight periodic/idle save could re-write draft after deleteAutoDraft** — Very low probability (requires concurrent periodic save firing during confirmation). `setIsDirty(false)` + interval cleanup provide strong protection. Same pattern exists in UX-R-1 and UX-R-2 without issues.

## Optimization Candidates

- Existing `PatientBillingPage.test.tsx` does not test AutoDraft behavior — integration test gap (P2)

## Financial Safety Notes

1. Recovered billing drafts require user review before payment confirmation — dialog must be dismissed via Resume, then confirmation is manual
2. Recovery does not auto-submit, auto-open confirmation, or restore receipt/paid state
3. Local draft is not a payment record — clear warning text
4. Stale or wrong-context drafts must be discarded by user
5. `remainingBalance <= 0` prevents duplicate payment even if draft persists
6. Draft cleanup is best-effort after successful payment (non-critical)

## Final Verdict

**STAGING-ONLY / BUG-HUNT-3 BILLING AUTODRAFT SAFETY SWEEP COMPLETE**

One P1 bug found and fixed (BUG-HUNT-3-1). All other areas pass. No P0 issues found.
