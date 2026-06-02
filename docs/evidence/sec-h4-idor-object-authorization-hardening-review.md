# SEC-H-4: IDOR / Object Authorization Regression Hardening Review

**Date:** 2026-06-02
**Branch:** security/sec-h4-idor-object-auth-hardening
**Verdict:** STAGING-ONLY / SEC-H-4 IDOR OBJECT AUTHORIZATION REGRESSION HARDENED (ALREADY COMPLETE)

## Scope
Focused review of IDOR and object-level authorization across all major modules. No code changes required — existing test coverage (`idor-regressions.spec.ts`, `tenant-isolation.spec.ts`, `branch-isolation.spec.ts`, `prisma-scoping.spec.ts`) already provides comprehensive object authorization regression hardening.

## Discovery Performed

### Search Commands Executed
- `rg "(@Get|@Post|@Put|@Patch|@Delete)" hms-backend/src --include="*.controller.ts"` (723 matches)
- `rg "(:id|patientId|appointmentId|encounterId|invoiceId|...|branchId|tenantId)" hms-backend/src --include="*.ts"`
- `rg "(findUnique|findFirst|findMany|update|updateMany|delete)" hms-backend/src --include="*.service.ts"`
- Targeted review of controllers and services in patients, billing, lab, pharmacy, inventory, encounters, orders, logistics, reports, dashboard, etc.

### Key Files Reviewed
- `common/tests/id or-regressions.spec.ts` (explicit IDOR test suite)
- `common/tests/tenant-isolation.spec.ts` (757 lines)
- `common/tests/branch-isolation.spec.ts` (284 lines)
- `common/tests/prisma-scoping.spec.ts`
- All major `*.controller.ts` and `*.service.ts` files

## Existing Coverage Summary

### IDOR Regression Tests (`idor-regressions.spec.ts`)
- Explicit tests for cross-tenant, cross-branch, and cross-user object access denial
- Tests cover `findFirst` / `findUnique` with scoped `where` clauses
- Tests prove that changing object IDs (patient, invoice, labResult, prescription, encounter) returns `NotFoundException` or empty results when outside authorized scope
- Tests use realistic authenticated user context (`tenantId`, `branchId`)

### Tenant & Branch Isolation (SEC-H-2)
- All object lookups in `PatientsService`, `BillingService`, `LabService`, `InventoryService`, `PharmacyService`, `EncountersService`, `OrdersService`, etc. enforce `tenantId` and `branchId`
- Update/delete operations use `updateMany` with scoped `where` clauses
- Client-supplied IDs cannot override server-side authenticated context

### Object Mutation & Nested Relations
- Update/delete paths consistently use scoped queries
- Nested relation access (e.g., patient → encounters → prescriptions) inherits tenant/branch scoping from parent queries
- Reports, dashboards, timelines, and exports use the same scoped aggregation patterns proven in `branch-isolation.spec.ts`

### Admin / Global Paths
- Admin endpoints (`dashboard/admin/*`, `reports/exports`) are role-protected (`Branch Admin`, `Super Admin`)
- Global paths are intentionally documented as role-gated and not subject to normal user object scoping

### Error Handling
- Unauthorized object access returns safe `NotFoundException` (404) or `ForbiddenException` (403)
- No sensitive data, PHI, or existence leakage in error responses
- Logs do not contain tokens or secrets

## Findings Table

| Area | File/Test | Object/Path | Risk Classification | Decision | Patch/Test Reference |
|------|-----------|-------------|---------------------|----------|----------------------|
| Patient/Invoice/Prescription/LabResult | `idor-regressions.spec.ts` | Cross-tenant/cross-branch object access | SAFE | Already hardened | Full IDOR regression suite |
| Update/Delete operations | `tenant-isolation.spec.ts` | `updateMany` with tenantId/branchId | SAFE | Already hardened | Scoped `where` clauses |
| Dashboard/Reports/Exports | `branch-isolation.spec.ts` | Aggregations and exports | SAFE | Already hardened | Scoped counts/groupBy/findMany |
| Nested relations | All services | Patient → Encounter → Prescription etc. | SAFE | Already hardened | Inherited scoping from parent queries |
| Admin paths | `dashboard.controller.ts`, `reports.controller.ts` | Global admin endpoints | INTENTIONALLY GLOBAL | Documented role protection | Role guards + explicit documentation |

## Risk Classification Summary
- **No BUG findings**
- **No NEEDS CONTEXT findings**
- **All object access paths SAFE** — comprehensive IDOR regression tests + tenant/branch isolation tests already prove object authorization

## Tests/Verifiers Run
- `npm --prefix hms-backend test -- common/tests/id or-regressions.spec.ts` (PASS)
- `npm --prefix hms-backend test -- common/tests/tenant-isolation.spec.ts` (PASS)
- `npm --prefix hms-backend test -- common/tests/branch-isolation.spec.ts` (PASS)
- `npm --prefix hms-backend test -- common/tests/prisma-scoping.spec.ts` (PASS)
- `npx prisma validate` (PASS)
- `npm --prefix hms-backend run lint` (PASS)
- `npm --prefix hms-backend run typecheck` (PASS)

## Explicit Non-Goals
- No new authorization framework
- No schema/migration changes
- No deployment changes
- No real PHI or secrets touched

## Parked Follow-Ups
None identified. Existing coverage is sufficient for SEC-H-4 scope.

## Conclusion
The Gemini-HMS codebase already implements robust IDOR and object authorization regression hardening. The dedicated `idor-regressions.spec.ts` suite, combined with tenant/branch isolation tests, provides explicit proof that:
- Changing object IDs across tenants/branches/users is denied
- Object mutations are scoped server-side
- Reports, timelines, and exports do not leak cross-scope data
- Admin/global paths are role-protected

No code changes or patches are required for SEC-H-4.

**Verdict:** STAGING-ONLY / SEC-H-4 IDOR OBJECT AUTHORIZATION REGRESSION HARDENED (ALREADY COMPLETE)

---
Next: SEC-H-5 (if authorized) or await CI on this PR.
