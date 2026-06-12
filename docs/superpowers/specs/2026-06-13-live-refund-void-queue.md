# Live Refund/Void Queue — Design Spec

**Goal:** Replace the simulated refund/void queue with a real live queue by adding a backend read/list endpoint for the current user's own payment reversal requests and wiring `RefundVoidQueuePage` to it.

**Status:** Design approved verbally. Ready for implementation.

---

## Decisions

| Question | Decision | Evidence |
|----------|----------|----------|
| Source of truth | `PaymentReversal` (billing-domain record) | Created in same tx as `ApprovalRequest`; carries financial intent (type, amount, paymentId, invoiceId); has independent status lifecycle (PENDING/APPLIED/REJECTED/CANCELLED) |
| Statuses to show | All statuses — PENDING (primary, actionable), APPLIED/REJECTED/CANCELLED (history) | Cashier needs to see whether their request is still pending or was resolved |
| User role scope | `requestedBy = current userId` — cashier sees only own requests | Page is in Cashier portal; maker-checker separation means approvers use Approval Center |
| Approve/Reject actions | Stay in Approval Center | Backend `billing.reversal.apply` permission is separate from `billing.refund.request`; maker-checker model requires different user |
| This page's actions | Submit new request (existing) + view own request status (new) | No governance actions |

---

## Backend Contract

**Route:** `GET /api/v1/billing/reversals/my`
**Guard:** `@RequirePermissions('billing.refund.request')` + `@RequireBranchContext()`
**Service filter:** `{ requestedBy: userId, tenantId, branchId }`
**Joins:** `Payment` (receiptNumber), `Payment → Invoice → Order → Patient` (patient name)
**Sort:** `requestedAt DESC`

**Response shape:**
```json
[{
  "id": "uuid",
  "type": "REFUND | PAYMENT_VOID",
  "amount": 500.00,
  "status": "PENDING | APPLIED | REJECTED | CANCELLED",
  "reason": "Duplicate charge",
  "requestedAt": "2026-06-13T10:14:00Z",
  "approvedAt": null,
  "paymentId": "uuid",
  "receiptNumber": "RCP-2026-5120",
  "invoiceNumber": "INV-2026-001",
  "patientName": "Jonathan Harker"
}]
```

---

## Frontend Contract

**Service:** `billingFrontendService.getMyReversals()` → array of the above shape
**Hook:** `useMyReversals()` → `{ reversals, loading, error, refetch }`

**Page changes:**
- Replace `simulatedRows` with live `reversals` from `useMyReversals()`
- Remove "Partially Wired — Queue Display Is Simulated" banner
- Remove SIMULATED badge from header
- Remove "Example Data" label
- Keep "Go to Approval Center for approve/reject" messaging
- Add loading/empty/error states for the queue section
- Remove `SimulatedRefundRequest` interface and `simulatedRows` constant

**Status → Chip mapping:**
- PENDING → `warning` → "Pending"
- APPLIED → `success` → "Applied"
- REJECTED → `critical` → "Rejected"
- CANCELLED → `default` → "Cancelled"

---

## Files Changed

| File | Change |
|------|--------|
| `hms-backend/src/billing/billing.controller.ts` | Add `GET /reversals/my` endpoint |
| `hms-backend/src/billing/billing.service.ts` | Add `getMyReversals()` with Payment/Invoice/Order/Patient joins |
| `hms-frontend/src/services/billing-frontend.service.ts` | Add `getMyReversals()` method |
| `hms-frontend/src/hooks/use-billing.ts` | Add `useMyReversals()` hook |
| `hms-frontend/src/portals/cashier/RefundVoidQueuePage.tsx` | Wire live queue, remove simulation artifacts |
| `hms-frontend/src/portals/cashier/__tests__/RefundVoidQueuePage.test.tsx` | Update mocks, remove SIMULATED assertions |

**Excluded by design:**
- No backend DTOs (service returns inline-shaped object)
- No approve/reject buttons on this page
- No changes to Approval Center
- No changes to Prisma schema
