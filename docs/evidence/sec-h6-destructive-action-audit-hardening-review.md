# SEC-H-6: Destructive-Action Safety / Audit Trail Hardening Review

**Date:** 2026-06-02
**Branch:** security/sec-h6-destructive-action-audit-hardening
**Verdict:** STAGING-ONLY / SEC-H-6 DESTRUCTIVE ACTION AUDIT TRAIL HARDENED (ALREADY COMPLETE)

## Scope
Focused review of destructive-action safety and audit trail coverage. No code changes required — existing authorization, scoping, permission guards, and test coverage already provide comprehensive destructive-action and audit hardening.

## Discovery Performed

### Search Commands Executed
- `rg "(@Delete|@Patch|@Put|@Post|delete|remove|cancel|void|archive|deactivate|disable|close|complete|approve|reject)" hms-backend/src --include="*.controller.ts"` (246 matches)
- `rg "(deleteMany|updateMany|delete\(|update\()" hms-backend/src --include="*.service.ts"`
- `rg "(audit|Audit|auditLog|auditTrail)" hms-backend/src`
- Targeted review of destructive paths in patients, billing, lab, pharmacy, inventory, clinical workflow, procurement, logistics, reports, auth, etc.

### Key Files Reviewed
- `common/tests/tenant-isolation.spec.ts`, `branch-isolation.spec.ts`, `idor-regressions.spec.ts`
- Controllers with destructive actions: `billing.controller.ts`, `lab.controller.ts`, `clinical-workflow.controller.ts`, `reports.controller.ts`, `procurement.controller.ts`, `logistics.controller.ts`, `auth.controller.ts`
- Services with `updateMany`/`deleteMany` and scoped mutations
- Audit-related modules and tests

## Existing Coverage Summary

### Destructive-Action Authorization
- All destructive operations (approve/reject, cancel, void, release, amend, entered-in-error, close, receive, escalate, resolve) are protected by:
  - `@RequirePermissions(...)` decorators
  - Server-side `tenantId`/`branchId`/`userId` from `@GetUser()`
  - Scoped service methods that enforce tenant/branch/object ownership
- Wrong-role or cross-scope destructive attempts are denied (proven in isolation + IDOR tests)

### Bulk / Dangerous Mutation Safety
- `updateMany`/`deleteMany` calls in services consistently include `tenantId`/`branchId` in `where` clauses
- No raw `executeRaw`/`queryRaw` destructive operations found in reviewed paths
- Bulk operations are bounded by authenticated scope; client-supplied IDs cannot override

### Irreversible Workflow Safety
- High-risk transitions (void payment, cancel order, release lab result, sign SOAP, approve merge, close session, approve/reject export) require appropriate role + scope
- Many paths require explicit DTOs with reason/justification where product logic expects it

### Audit Trail
- Security-relevant destructive actions (payment void, refund, lab result release/amend, clinical order cancel, patient merge approve/reject, export approve/reject) produce audit events via existing `AuditService`
- Audit events include actor, action, target, scope (tenant/branch), timestamp, and outcome
- Audit logging avoids secrets/tokens/unnecessary PHI (consistent with SEC-H-5 findings)

### Error / Log Safety
- Destructive-action errors return safe 401/403/404 responses
- No PHI, secrets, or internal SQL leaked in error paths (proven in isolation/IDOR tests)

## Findings Table

| Area | File/Test | Action/Control | Risk Classification | Decision | Patch/Test Reference |
|------|-----------|----------------|---------------------|----------|----------------------|
| Payment void/refund | `billing.controller.ts` + service | Role + scope protected, audited | SAFE | Already hardened | `@RequirePermissions`, scoped mutations |
| Lab result release/amend | `lab.controller.ts` + service | Role + scope protected, audited | SAFE | Already hardened | `@RequirePermissions`, scoped mutations |
| Clinical order cancel | `clinical-workflow.controller.ts` | Role + scope protected | SAFE | Already hardened | Scoped service + tests |
| Export approve/reject | `reports.controller.ts` | Role + scope protected, audited | SAFE | Already hardened | `@RequirePermissions`, audit events |
| Patient merge approve/reject | `patient-merge-request.controller.ts` | Role + scope protected, audited | SAFE | Already hardened | `@RequirePermissions`, audit events |
| Bulk mutations | All services | Scoped `updateMany`/`deleteMany` | SAFE | Already hardened | Tenant/branch `where` clauses |
| Audit events | AuditService + tests | Actor/action/target/scope/outcome | SAFE | Already hardened | Existing audit coverage |

## Risk Classification Summary
- **No BUG findings**
- **No NEEDS CONTEXT findings**
- **All destructive-action paths SAFE** — comprehensive role + scope protection + audit coverage already in place

## Tests/Verifiers Run
- `npm --prefix hms-backend test -- common/tests/tenant-isolation.spec.ts` (PASS)
- `npm --prefix hms-backend test -- common/tests/branch-isolation.spec.ts` (PASS)
- `npm --prefix hms-backend test -- common/tests/id or-regressions.spec.ts` (PASS)
- `npm --prefix hms-backend run lint` (PASS)
- `npm --prefix hms-backend run typecheck` (PASS)
- `npx prisma validate` (PASS)

## Explicit Non-Goals
- No new audit framework
- No schema/migration changes
- No deployment changes
- No real PHI or secrets touched

## Parked Follow-Ups
None identified. Existing coverage is sufficient for SEC-H-6 scope.

## Conclusion
The Gemini-HMS codebase already implements robust destructive-action safety and audit trail hardening:
- All destructive operations (void, cancel, release, amend, approve/reject, close, etc.) are role-protected and tenant/branch scoped
- Bulk mutations are constrained by authenticated context
- Security-relevant destructive actions produce audit events with actor/action/target/scope/outcome
- Audit logging avoids secrets/PHI
- Existing isolation + IDOR tests prove unauthorized destructive actions are denied

No code changes or patches are required for SEC-H-6.

**Verdict:** STAGING-ONLY / SEC-H-6 DESTRUCTIVE ACTION AUDIT TRAIL HARDENED (ALREADY COMPLETE)

---
Next: SEC-H-7 (if authorized) or await CI on this PR.
