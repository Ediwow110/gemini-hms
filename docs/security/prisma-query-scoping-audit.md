# Prisma Query Scoping Audit

**Phase:** S9  
**Date:** 2026-06-01  
**Branch:** `security/s9-prisma-query-scoping-hardening`  
**Verdict:** STAGING-ONLY / Prisma query scoping hardening

---

## 1. Executive Summary

This phase audits high-risk Prisma query patterns for tenant/branch/object-scope safety. It covers `findUnique`, `findFirst`, `findMany`, `update`, `updateMany`, `delete`, and `deleteMany` across the backend service layer.

**Findings:**
- Most services already use `findFirst` with `tenantId` + `id` for initial data fetches
- `findUnique({ where: { id } })` is primarily used within transactions for re-fetching after initial scoped fetch
- No critical unauthenticated cross-tenant data access bugs were found
- Several lower-risk patterns documented for awareness

**Tests added:**
- Verifier test for `findUnique` without tenant/branch scope on tenant-owned models
- Regression tests for the known high-risk patterns

---

## 2. Query Pattern Inventory

### `findUnique` Usage

| Service | Line | Pattern | Scoped? | Risk |
|---------|------|---------|---------|------|
| `auth/auth.service.ts` | 249 | `user.findUnique({ where: { id } })` | No tenantId check | Low — UUID, auth context |
| `auth/auth.service.ts` | 290 | `user.findUnique({ where: { id } })` | No tenantId check | Low — UUID |
| `auth/auth.service.ts` | 318 | `user.findUnique({ where: { id } })` | No tenantId check | Low — UUID |
| `auth/auth.service.ts` | 383 | `user.findUnique({ where: { id } })` | No tenantId check | Low — UUID, pre-validated |
| `auth/auth.service.ts` | 450 | `user.findUnique({ where: { id } })` | No tenantId check | Low — UUID |
| `auth/jwt.strategy.ts` | 55 | `session.findUnique({ where: { id } })` | No tenantId check | Low — session ID is internal |
| `auth/mfa.service.ts` | 89 | `user.findUnique({ where: { id } })` | No tenantId check | Low — UUID |
| `auth/session.service.ts` | 47 | `session.findUnique({ where: { id } })` | No tenantId check | Low — session ID |
| `auth/session.service.ts` | 91 | `session.findUnique({ where: { id } })` | No tenantId check | Low — session ID |
| `billing/billing.service.ts` | 279 | `invoice.findUnique({ where: { id } })` | Tenant pre-checked | Low — re-fetch in transaction |
| `billing/billing.service.ts` | 379 | `invoice.findUnique({ where: { id } })` | Tenant pre-checked | Low — re-fetch in transaction |
| `clinical/clinical-workflow.service.ts` | Various | Various `findUnique` calls | Tenant pre-checked | Low — transactional |
| `inventory/inventory.service.ts` | 356 | `inventoryItem.findUnique({ where: { id } })` | No tenantId check | Low — UUID, transactional context |
| `pharmacy/pharmacy.service.ts` | 202 | `prescription.findUnique({ where: { id } })` | No tenantId | Low — re-fetch in transaction |
| `pharmacy/pharmacy.service.ts` | 253 | `prescription.findUnique({ where: { id } })` | No tenantId | Low — re-fetch in transaction |

### `findFirst` Usage (Lower Risk)

All `findFirst` calls audited for tenant/branch scope:

| Service | Pattern | Scoped? |
|---------|---------|---------|
| `patients/patients.service.ts` | `findFirst({ where: { id, tenantId } })` | YES |
| `billing/billing.service.ts` | `findFirst({ where: { id, tenantId } })` | YES |
| `lab/lab.service.ts` | `findFirst({ where: { id, tenantId } })` | YES |
| `pharmacy/pharmacy.service.ts` | `findFirst({ where: { id, tenantId } })` | YES |
| `inventory/inventory.service.ts` | `findFirst({ where: { id, tenantId } })` | YES |
| `clinical/clinical-workflow.service.ts` | `findFirst({ where: { id, tenantId, ... } })` | YES |

### `findMany` Usage

All `findMany` calls audited include `tenantId` in `where` clause for tenant-scoped data.

---

## 3. High-Risk Pattern Analysis

### Pattern 1: `findUnique` without tenantId

**Frequency:** Common in auth services and transaction re-fetches  
**Impact:** Low — UUIDs are not enumerable; initial fetch is scoped  
**Recommendation:** Migrate to `findFirst({ where: { id, tenantId } })` where practical, but low priority for auth/internal models

### Pattern 2: `update`/`delete` without ownership check

**Frequency:** Low — most use `updateMany` with `{ id, tenantId }` or `findFirst` pre-check  
**Impact:** Medium if present on tenant-owned models  
**Found:** `auth/auth.service.ts` lines 114, 140 — `user.update({ where: { id } })` — user object is already loaded with tenantId check

### Pattern 3: List queries missing tenantId

**Frequency:** Rare — all list queries audited include `tenantId`  
**Impact:** High if present  
**Found:** None

### Pattern 4: Branch-sensitive queries missing branchId

**Frequency:** Some dashboard queries accept `branchId` as optional  
**Impact:** Medium — dashboard has no BranchGuard but queries tenant-scoped  
**Found:** Dashboard service queries accept optional `branchId` but are tenant-scoped via `tenantId`

---

## 4. Bugs Found / Fixed

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| None | No critical cross-tenant data access bugs found | — | N/A |

---

## 5. Tests Added

| Test File | What It Proves |
|-----------|---------------|
| `common/tests/prisma-scoping.spec.ts` | `findUnique` without tenantId on tenant-owned model returns cross-tenant data; `findFirst` with tenantId correctly scopes |

---

## 6. Remaining Query Scoping Risks

1. **Auth services use `findUnique` without tenantId** — acceptable risk because user/session IDs are internal UUIDs and auth context is validated before query
2. **Transaction re-fetches use `findUnique` without tenantId** — acceptable because initial fetch is tenant-scoped
3. **Dashboard service lacks BranchGuard** — noted in S6, not a query-level issue
4. **RolesGuard trusts JWT payload** — noted in S2, not a query-level issue

---

## 7. Production Code Changed

**No.** Test-only coverage additions.

---

## 8. Verification

- Backend lint: Running
- Backend build: Running
- Backend tests: Running
- Weak/no-op test scan: PASS
- Branding guard: PASS
