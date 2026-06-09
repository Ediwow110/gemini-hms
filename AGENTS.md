# Session State
## Goal
- Sandbox-UI honesty audit + correctness audit + idempotency key bug fix across HR, Procurement, Marketplace Admin, Supplier, and Cashier portals.
## Constraints & Preferences
- Stay local only; do not push, open PR, merge, or modify tracked product code unless a real correctness issue is found.
- Do not suggest fake alerts as default fix; do not call every inert sandbox button a bug.
- Do not trust prior totals unless re-verified; do not recommend fixes based on stale claims.
- Keep scope limited to the cashier payment idempotency fix; do not broaden into other cashier changes.
- No modifications to backend APIs; frontend-only fix.
## Progress
### Done
- **Sandbox-UI honesty audit** (48 pages across HR, Procurement, Marketplace Admin, Supplier, Cashier): identified 19 misleading inert controls (all mild polish issues on sandbox-labeled pages), 14 acceptable inert controls, 0 real bugs. One stale claim corrected (DepartmentsPage sandbox notice was claimed missing but exists at lines 70-72).
- **Strict verification pass**: 1 stale claim confirmed, 18 controls re-verified, 1 reclassified as acceptable-as-is, 0 genuinely misleading.
- **Correctness audit**: found 1 real financial integrity bug — idempotency key uses `Date.now()` defeating backend dedup.
- **Fix implemented**: replaced `Date.now()`-based idempotency key with stable ref-based key in `PatientBillingPage.tsx`.
- **Add retry test**: new `"reuses the same idempotency key when retrying after payment failure"` test verifies the same key is reused after a failed first attempt.
- **Verification**: TypeScript typecheck clean; all 26 Cashier portal tests pass (1 new); lint clean.
- **Final verdict**: ACCEPT WITH NITS — fix is correct, test proof gap closed, `Math.random()` acceptable for this use case.

### In Progress
- (none)

### Blocked
- (none)
## Key Decisions
- **Idempotency key fix approach**: generate key once per payment attempt using `useRef`, persist across retries, reset on `invoiceId` change. Uses `Math.random().toString(36).substring(2,15)` as suffix instead of `Date.now()` to prevent duplicate charges on retry after timeout. Replaces `PAY-${invoice.id}-${Date.now()}` with `PAY-${invoice.id}-${random}` stored in ref.
- **Verdict on polish issues**: no code changes justified for sandbox polish; defer to Phase 15-B standardization.
## Next Steps
1. **Phase 15-B**: Standardize all 9 remaining Admin mock pages (`AdminExecutiveDashboard`, `AnalyticsPage`, `HMOClaimsPage`, etc.) + BranchAdminDashboard onto HMS shell with loading/error/empty states.
2. **Get GCP IAM roles granted** (`serviceUsageAdmin`, `compute.admin`, `cloudsql.admin`) on `unified-xylocarp-j524r`.
3. Re-run Phase 18-J to enable APIs, provision staging VM + Cloud SQL.
4. Execute Phase 18-K (staging deploy + smoke tests + apply migrations).
5. Execute Phase 18-L (GitHub Actions CI proof).
6. Revisit Sprint 2B (pharmacy enhancements) after CI/staging clean.
## Critical Context
- **Backend idempotency** is robust (fingerprint + composite unique key `tenantId_operation_key` + COMPLETED/IN_PROGRESS/FAILED state machine + retry support for FAILED keys) — but only works when same key is reused. Changing key on each attempt bypasses the entire guard.
- **Current stack**: `ca64d7e`, `9928fd1`, `6ecff3a`, `a20ff61` — all local, no pushes.
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
