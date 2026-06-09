# Session State
## Goal
- Sandbox-UI honesty audit + correctness audit + idempotency key bug fix + single-branch auth branch-context fix.
- Real-DB frontend validation: PASS WITH FIX APPLIED (LOCAL ONLY).
## Constraints & Preferences
- Stay local only; do not push, open PR, merge, or modify tracked product code unless a real correctness issue is found.
- Do not suggest fake alerts as default fix; do not call every inert sandbox button a bug.
- Do not trust prior totals unless re-verified; do not recommend fixes based on stale claims.
- Keep scope limited to the cashier payment idempotency fix; do not broaden into other cashier changes.
- No modifications to backend APIs; frontend-only fix.
## Progress
### Done
- **Sandbox-UI honesty audit** (48 pages across HR, Procurement, Marketplace Admin, Supplier, Cashier): identified 19 misleading inert controls, 14 acceptable inert controls, 0 real bugs.
- **Strict verification pass**: 1 stale claim corrected, 18 controls re-verified, 0 genuinely misleading.
- **Correctness audit**: found 1 real financial integrity bug — idempotency key uses `Date.now()` defeating backend dedup.
- **Idempotency fix**: replaced `Date.now()`-based key with stable `useRef`-based key in `PatientBillingPage.tsx`; retry test added; TS/lint/tests clean.
- **Final verdict**: ACCEPT WITH NITS — fix is correct.
- **Branch-context auth fix**: single-branch users now auto-resolve `branchId` in `generateTokenPair()` at `hms-backend/src/auth/auth.service.ts:522`. Fix covers `login()`, `verifyMfa()`, `verifyMfaWithRecoveryCode()`. 75/75 auth tests pass. Real-DB API smoke confirms pharmacist + cashier branch-scoped APIs return 200 (were 403).
- **Real-DB frontend rerun**: pharmacist → `/pharmacy` (0 errors), cashier dashboard (0 errors), invoices/billing pages load without `missing_branch_context`. Verdict: **PASS WITH FIX APPLIED (LOCAL ONLY)**.

### Unresolved (Fixture Gaps / Display Polish)
- Drug catalog empty in this DB (API 200, no fixtures)
- Dispense button disabled on DEMO prescription (read-only fixture)
- Outstanding balance shows `NaN ₱` due to Prisma Decimal serialization display gap
- "Paid" shows 0 despite DEMO-INV-001 being fully paid (status `ISSUED` not `PAID`)

### Blocked
- (none)
## Key Decisions
- **Idempotency key fix approach**: generate key once per payment attempt using `useRef`, persist across retries, reset on `invoiceId` change. Uses `Math.random()` suffix instead of `Date.now()`.
- **Branch-context fix approach**: modify `generateTokenPair()` to auto-assign `branchId` when `availableBranches.length === 1`, handling all three callers at once. Session also updated for stateful tracking.
- **Verdict on polish issues**: no code changes justified for sandbox polish; defer to Phase 15-B standardization.
## Next Steps
1. **CI / staging / deployment-path proof** — this is now the next meaningful validation step.
2. **Get GCP IAM roles granted** (`serviceUsageAdmin`, `compute.admin`, `cloudsql.admin`) on `unified-xylocarp-j524r`.
3. Re-run Phase 18-J to enable APIs, provision staging VM + Cloud SQL.
4. Execute Phase 18-K (staging deploy + smoke tests + apply migrations).
5. Execute Phase 18-L (GitHub Actions CI proof).
6. Revisit Sprint 2B (pharmacy enhancements) after CI/staging clean.
## Critical Context
- **Backend idempotency** is robust (fingerprint + composite unique key `tenantId_operation_key` + COMPLETED/IN_PROGRESS/FAILED state machine + retry support for FAILED keys) — but only works when same key is reused.
- **Current stack**: `ca64d7e`, `9928fd1`, `6ecff3a`, `a20ff61`, `493583b`, `55d351a` — all local, no pushes.
- **Frontend service** correctly passes key as `idempotency-key` header; backend controller (`billing.controller.ts:182-184`) requires this header and rejects missing values.
- **Mutation allowlist**: **15** total — 12 clinical (saveVitals, markVitalsEnteredInError, saveTriage, markTriageEnteredInError, saveDraftSOAP, signSOAP, createClinicalOrder, cancelClinicalOrder, receiveLabOrder, saveDraftLabResult, validateLabResult, releaseLabResult) + 2 pharmacy (dispenseMedication, adjustStock) + 1 doctor (createPrescription).
- **Pharmacy endpoints**: `GET /api/v1/pharmacy/prescriptions?status=` (Pharmacist/Branch Admin/Super Admin, read-only queue); `POST /api/v1/pharmacy/prescriptions/:id/dispense` (Pharmacist/Branch Admin/Super Admin, ACTIVE→DISPENSED).
- **Pharmacy dispense**: Optimistic locking via `updateMany` with `where: { id, version, status: 'ACTIVE' }`. Calls `InventoryService.dispenseItem()` for stock deduction. Transactional audit `PRESCRIPTION_DISPENSED`.
- **Frontend PharmacyHub**: Refactored from mock-only to real API (prescription queue from `usePrescriptionQueue`, drug catalog from `useDrugCatalog`, dispense via `useDispenseMedication` with cache invalidation).
- **Test count**: 1537/1537 backend all pass. Frontend typecheck clean, lint clean, verifier all pass.
- **Prisma schema**: Prescription model now has `dispensedById`, `dispensedAt` fields + `DispensedBy` User relation + `(tenantId, branchId, status)` index.
- **10 of 11 Admin + Branch Admin pages are mock-only**; only CatalogManagementPage uses real API (now refactored with hooks + service layer).
## Relevant Files
- `hms-frontend/src/portals/cashier/PatientBillingPage.tsx`: fixed idempotency key generation (line 154-156); added `useRef` import (line 1); added `idempotencyKeyRef` state (line 43); reset key on invoice change (line 57).
- `hms-frontend/src/services/billing-frontend.service.ts`: sends idempotency key in header (lines 88-92) — unchanged.
- `hms-backend/src/billing/billing.controller.ts`: validates idempotency-key header (lines 163-193) — unchanged.
- `hms-backend/src/billing/billing.service.ts`: idempotency guard logic (lines 55-200) — unchanged.
- `hms-backend/src/auth/auth.service.ts`: branch-context fix in `generateTokenPair()` at lines 522-571; auto-assigns `branchId` when exactly one active branch exists.
- `hms-frontend/src/services/billing-frontend.service.ts`: sends idempotency key in header (lines 88-92) — unchanged.
- `hms-backend/src/billing/billing.controller.ts`: validates idempotency-key header (lines 163-193) — unchanged.
- `hms-backend/src/billing/billing.service.ts`: idempotency guard logic (lines 55-200) — unchanged.
- `hms-backend/src/pharmacy/pharmacy.module.ts`: Module definition.
- `hms-backend/src/pharmacy/pharmacy.controller.ts`: GET/POST endpoints.
- `hms-backend/src/pharmacy/pharmacy.service.ts`: `getPrescriptionQueue()`, `dispenseMedication()`.
- `hms-backend/src/pharmacy/pharmacy.service.spec.ts`: 14 tests.
- `hms-backend/src/pharmacy/dto/dispense-prescription.dto.ts`: `DispensePrescriptionDto`.
- `hms-backend/src/pharmacy/dto/pharmacy-queue.dto.ts`: `PharmacyPrescriptionQueueDto`, `DispenseResultDto`.
- `hms-backend/src/inventory/inventory.module.ts`: Added `exports: [InventoryService]`.
- `hms-backend/prisma/migrations/20260523130000_add_prescription_dispense_fields/`: Manual migration.
- `hms-frontend/src/services/pharmacy.service.ts`: API client with DTOs.
- `hms-frontend/src/hooks/use-pharmacy.ts`: `usePrescriptionQueue`, `useDrugCatalog`, `useDispenseMedication`.
- `hms-frontend/src/features/pharmacy/PharmacyHub.tsx`: Refactored to real API.
- `hms-frontend/scripts/verify-clinical-readonly-wiring.ts`: Target 8 updated to 15 mutations (12 clinical + 2 pharmacy + 1 doctor).
- `hms-frontend/src/portals/field-service/` — all 10 FS pages (3 real Phase 14-B, 7 mock Phase 14-C).
- `hms-frontend/src/services/catalog.service.ts` — Phase 15-A: typed DTOs + 6 service methods.
- `hms-frontend/src/hooks/use-catalog.ts` — Phase 15-A: 3 React Query hooks.
- `hms-frontend/src/portals/admin/CatalogManagementPage.tsx` — Phase 15-A refactored (inline apiClient → hooks + service, HmsDashboardShell/HmsPageHeader/HmsAuditFooter, error state with retry).
- `hms-frontend/src/portals/admin/__tests__/CatalogManagementPage.test.tsx` — Phase 15-A: 4 tests.
- `hms-frontend/src/hooks/__tests__/use-catalog.test.tsx` — Phase 15-A: 2 tests.
- `hms-frontend/src/portals/admin/` — remaining 9 Admin pages not yet standardized (Phase 15-B scope).
- `hms-frontend/src/portals/branch-admin/` — BranchAdminDashboard + 10 WIP stubs (Phase 15-B scope).
## Carryover Risks
1. **GCP IAM block**: No staging/CI. Account lacks 4 critical roles on `unified-xylocarp-j524r`.
2. **Pharmacist role not seeded**: Must be added to database `roles` table at deployment.
3. **Migrations unapplied**: All Phase 14 + Sprint 2A migrations require PostgreSQL.
4. **Drug catalog fixtures empty**: No drug catalog data in this DB; dispense flow cannot be fully exercised.
