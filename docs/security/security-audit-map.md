# Security Attack Surface Inventory

**Phase:** S1  
**Date:** 2026-06-01  
**Branch:** `security/s1-attack-surface-inventory`  
**Verdict:** STAGING-ONLY — defensive security audit planning

---

## 1. Executive Summary

This document maps the full attack surface of Gemini-HMS ahead of S2–S10 security bug-hunt phases. It inventories auth/session, CSRF, RBAC, tenant/branch isolation, public routes, dashboard/admin APIs, runtime security configuration, and existing hardening mechanisms. No production code was changed. This is a planning artifact only.

**High-risk hypotheses identified:** 15  
**Critical/high hypotheses:** 8 (token/session mismatch, revoked session reuse, stale role claims, tenant mismatch via unscoped findUnique, cross-branch IDOR, CSRF bypass on unsafe public routes, dashboard wrong-role access, MFA challenge token abuse)

---

## 2. Project Security Posture

- **Verdict:** STAGING-ONLY. This is a defensive audit; no production-readiness claim.
- **Scope:** Authentication, session management, CSRF protection, RBAC, tenant isolation, branch isolation, public route exposure, dashboard/admin API access control, runtime security configuration.
- **Not assessed in this phase:** Dependency vulnerability audit (S11), secrets/config exposure audit (S12), logging/PHI leakage (S13), file/report/PDF exposure (S14), rate-limit abuse resistance (S15), IDOR regressions (S16), destructive action safety (S17), frontend route trust (S18), backup/restore security (S19), verifier hardening (S20).

---

## 3. Auth / Session Model

### Key Files
| File | Role |
|------|------|
| `hms-backend/src/auth/auth.controller.ts` | Login, refresh, logout, MFA endpoints |
| `hms-backend/src/auth/auth.service.ts` | Login logic, token generation, MFA step-up |
| `hms-backend/src/auth/jwt.strategy.ts` | JWT extraction & stateful validation |
| `hms-backend/src/auth/session.service.ts` | Session CRUD, refresh rotation, breach detection |
| `hms-backend/src/auth/mfa.service.ts` | TOTP verification, recovery codes, secret encryption |

### Session Creation
- Login → `validateUser()` checks tenant, email, password, lockout (5 fails → 15min lock)
- Creates session with `isMfaVerified: false`
- If sensitive role → returns `MFA_REQUIRED` with short-lived `mfaToken` (5min, scope `mfa_challenge`)
- If non-sensitive → `markMfaVerified` + full token pair
- Tokens: `accessToken` 15min, `refreshToken` 7 days

### Session Revocation
- `logout()` deletes session from DB
- `refreshTokens()` rotates RT with bcrypt comparison, detects replay after 30s leeway (revokes ALL sessions on breach)
- `revokeAllForUser()` deletes all sessions for a user on breach detection

### Token Validation (JWT Strategy)
- Extracts from `cookies.access_token` first, then `Authorization: Bearer`
- Required payload fields: `sub`, `sid`, `tenantId`, `tokenVersion` (number)
- Stateful check: `session.findUnique` verifies session exists, `expiresAt`, user `status === 'ACTIVE'`, `deactivatedAt === null`, `tokenVersion` matches
- Consistency check: `session.userId === payload.sub`, `session.tenantId === payload.tenantId`
- `branchId` from payload is returned **as-is** (line 89: `...(payload.branchId ? { branchId: payload.branchId } : {})`)

### Key Risk: `branchId` in JWT
The branch claim is embedded in the JWT payload (line 543: `...(branchId && { branchId })`). The JWT strategy trusts this claim without re-validating against a session-level branch. The `session` table has a `branchId` field (set during `selectBranch`), but the JWT strategy does not cross-check against it. This means an attacker who can forge/modify the JWT `branchId` claim could impersonate a branch.

### Key Risk: `DISABLE_AUTH_VERIFICATION`
`auth.service.ts:198` checks `process.env.DISABLE_AUTH_VERIFICATION === 'true'`. When enabled, MFA step-up is skipped entirely. The logger warns but does not block. CI runs with this disabled (`'false'`). Production compose requires `MASTER_MFA_KEY` but does not control `DISABLE_AUTH_VERIFICATION`.

---

## 4. CSRF Model

### Key Files
| File | Role |
|------|------|
| `hms-backend/src/auth/guards/csrf.guard.ts` | Global CSRF guard |
| `hms-backend/src/auth/auth.controller.ts` | Login/refresh/MFA endpoints set cookies & verify CSRF |
| `hms-backend/src/patient-portal/guards/patient-csrf.guard.ts` | Patient-specific CSRF |
| `hms-frontend/src/lib/api.ts` | Frontend API client |

### How It Works
- **Global CsrfGuard** (applied via `APP_GUARD`): exempts `@Public()` routes and GET/HEAD/OPTIONS. For unsafe methods, requires `csrf_token` cookie === `x-csrf-token` header.
- **Login**: `@Public()` → bypasses global CsrfGuard. Sets `csrf_token` httpOnly cookie + returns `csrfToken` in body.
- **Refresh**: `@Public()` → manual CSRF check at `auth.controller.ts:179-183` (cookie vs header).
- **MFA endpoints**: All `@Public()` with `@UseGuards(MfaChallengeGuard)` — bypass global CsrfGuard. No manual CSRF check. **Risk: MFA challenge endpoints have no CSRF protection.**

### CSRF Cookie Settings
- `httpOnly: true`
- `secure: isProd`
- `sameSite: 'strict'`
- `path: '/'`

### Key Risks
1. **MFA endpoints lack CSRF** — all 3 MFA endpoints (`mfa/setup`, `mfa/verify`, `mfa/recovery-codes/verify`) are `@Public()` and have no CSRF check.
2. **Patient CSRF** uses non-httpOnly cookie (readable by JS) — different model from main CSRF.
3. **Global CsrfGuard only applies to non-public unsafe routes** — any newly created `@Public()` route with POST/PUT/DELETE is automatically CSRF-free.

---

## 5. RBAC Model

### Key Files
| File | Role |
|------|------|
| `hms-backend/src/auth/guards/permissions.guard.ts` | Permission-based access control |
| `hms-backend/src/auth/guards/roles.guard.ts` | Role-based access control |
| `hms-backend/src/auth/decorators/roles.decorator.ts` | `@Roles(...)` decorator |
| `hms-backend/src/auth/decorators/permissions.decorator.ts` | `@Permissions(...)` decorator |

### Hierarchy
1. **Global guards** (fail-closed): `JwtAuthGuard` → `MfaGuard` → `TenantGuard` → `CsrfGuard`
2. **Controller guards**: `PermissionsGuard`, `RolesGuard`, `BranchGuard` — applied per controller
3. **Method decorators**: `@Roles()`, `@Permissions()`, `@RequireBranchContext()`, `@SkipMfa()`

### PermissionsGuard
- Queries DB for user permissions scoped to tenant
- Supports `ANY` (default) and `ALL` modes
- **Explicitly states** (line 50-51): "Grants are evaluated at tenant scope only; they do not prove branch isolation."
- **Key Risk**: PermissionsGuard re-queries roles from DB — good. But some controllers rely on `@Roles()` which trusts JWT payload roles, which are set at login and stale until token refresh.

### RolesGuard
- Checks `user.roles` from JWT payload
- Does **not** re-query DB — sits on token-level data
- Stale until token refresh (max 15min for access token, 7d for refresh)

---

## 6. Tenant Isolation Model

### Global TenantGuard
- Applied via `APP_GUARD`
- Presumably checks `user.tenantId` consistency

### Query Scoping
- Most services accept `tenantId` from `@GetUser()` and include it in Prisma `where` clauses
- **Risk Pattern**: `findUnique` on records with tenant-owned data without `tenantId` check
- Example in `auth.service.ts`: `findUnique({ where: { id: userId } })` — userId is UUID, cross-tenant unlikely but `findFirst` with tenantId would be safer
- Example in `dashboard.service.ts`: All queries are tenant-scoped via `tenantId`

### Audit Log
- Audit events include `tenantId` and `userId`

---

## 7. Branch Isolation Model

### BranchGuard
- Applied via `@UseGuards(PermissionsGuard, BranchGuard)` on branch-scoped controllers
- Checks `@RequireBranchContext()` decorator
- Validates:
  1. User has `branchId` in token (unless Super Admin)
  2. Request `branchId` (from params/body/query) matches user token `branchId` (unless Super Admin)
  3. Multiple branchId sources are consistent
- Super Admin exception: Super Admin can target any branch as long as request is consistent

### Key Risks
1. **Not all controllers use BranchGuard** — Dashboards, admin, patient-portal, and some other controllers do not declare `@UseGuards(PermissionsGuard, BranchGuard)`.
2. **Dashboard controller** (`dashboard.controller.ts`) has no BranchGuard — queries accept `branchId` from query params but rely on service-level filtering. The dashboard service uses `branchId` for some queries but the controller does not enforce branch consistency.
3. **Session-level branchId exists** (set in `session` table during `selectBranch`) but JWT strategy does not cross-check it.

---

## 8. Public Route Inventory

### Public Routes (Backend)
| File | Method | Path | Protected? |
|------|--------|------|------------|
| `auth.controller.ts` | POST | `/api/v1/auth/login` | Rate-limited (5/60s). No CSRF (public). |
| `auth.controller.ts` | POST | `/api/v1/auth/refresh` | Manual CSRF check. No auth. |
| `auth.controller.ts` | POST | `/api/v1/auth/mfa/setup` | `@UseGuards(MfaChallengeGuard)`. No CSRF. |
| `auth.controller.ts` | POST | `/api/v1/auth/mfa/verify` | `@UseGuards(MfaChallengeGuard)`. No CSRF. |
| `auth.controller.ts` | POST | `/api/v1/auth/mfa/recovery-codes/verify` | `@UseGuards(MfaChallengeGuard)`. No CSRF. |
| `app.controller.ts` | GET | `/api/health` | Public. Safe method. |
| `app.controller.ts` | GET | `/` | Public. Safe method. |
| `patient-portal.controller.ts` | (entire class) | `/api/v1/patient-portal` | `@Public()` on class. All methods use `PatientJwtGuard` + `PatientCsrfGuard`. |

### Patient Portal Routes
- `@Public()` on class level
- Each method has explicit `@UseGuards(PatientJwtGuard, PatientCsrfGuard)` or `@UseGuards(PatientCsrfGuard)`
- Login returns patient-specific JWT (separate from main auth)
- Patient CSRF uses non-httpOnly cookie

### Classification
- Expected: health, login, patient-portal public routes
- Questionable: MFA endpoints without CSRF (overridden by MfaChallengeGuard, but challenge token abuse possible)

---

## 9. Sensitive Controller Inventory

### Controllers with `@UseGuards(PermissionsGuard, BranchGuard)` (branch-scoped, permission-checked)
- `queue.controller.ts`
- `orders.controller.ts`
- `lab.controller.ts`
- `billing.controller.ts`
- `prescriptions.controller.ts`
- `inventory.controller.ts`
- `encounters.controller.ts`
- `emr/encounter.controller.ts`
- `claims.controller.ts`
- `procurement.controller.ts`
- `logistics.controller.ts`
- `nursing.controller.ts`
- `prescriptions.controller.ts`

### Controllers with `@UseGuards(RolesGuard, BranchGuard)` (role-checked, branch-scoped)
- `clinical/clinical.controller.ts`

### Controllers with only `@UseGuards(JwtAuthGuard, RolesGuard)` (role-checked, no branch guard)
- `dashboard.controller.ts` — **No branch isolation**

### Controllers with `@UseGuards(JwtAuthGuard, RolesGuard)` (no branch guard)
- `reports.controller.ts`
- `admin.controller.ts` (admin module)

### Controllers with only `@UseGuards(JwtAuthGuard)` or similar
- `notifications.controller.ts`
- `approvals.controller.ts`
- `marketplace.controller.ts`

---

## 10. Dashboard / Admin API Inventory

### Backend Dashboard Controller
| Endpoint | Roles | Branch Guard? | Tenant Scoped? |
|----------|-------|---------------|----------------|
| GET `dashboard/admin/summary` | Super Admin, Admin | No | Yes (tenantId) |
| GET `dashboard/admin/trends` | Super Admin, Admin | No | Yes (tenantId) |
| GET `dashboard/admin/alerts` | Super Admin, Admin | No | Yes (tenantId) |
| GET `dashboard/admin/top-lists` | Super Admin, Admin | No | Yes (tenantId) |

**Risk**: The `/admin/summary` endpoint accepts `branchId` as optional query param, accepts `userId` from token, but has no BranchGuard. A branch-scoped Admin could pass a different `branchId` and potentially access cross-branch data.

### Frontend Dashboard Services
- `billing-dashboard.service.ts` — calls real API, has demo chart data
- `lab-dashboard.service.ts` — calls real API, has demo chart data
- `pharmacy-dashboard.service.ts` — calls real API, has demo chart data
- `clinical-ops-dashboard.service.ts` — calls real API, has demo chart data
- `dashboard.service.ts` — calls `dashboard/admin/*` backend endpoints

---

## 11. Environment / Secrets / CORS Model

### Required Secrets
- `JWT_SECRET` (min 32 chars, enforced at startup via `jwt.strategy.ts:29`)
- `MASTER_MFA_KEY` (min 32 chars, enforced at startup via `mfa.service.ts:27`)
- `CORS_ALLOWED_ORIGINS` (required in production compose via `docker-compose.prod.yml`)

### CORS Configuration (`main.ts`)
```typescript
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS;
if (!allowedOrigins) {
  console.error('CORS_ALLOWED_ORIGINS is not set in production. Failing closed.');
}
```
- Falls back to `process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173'`
- In production, CORS fails closed (missing env → error logged)

### DISABLE_AUTH_VERIFICATION
- Used in `auth.service.ts:198`
- CI sets to `'false'` in e2e tests
- Not controlled in `docker-compose.prod.yml` — but also not required there
- Present in CI workflows with explicit `false`

### Security Headers
- Not explicitly audited in this phase. Known from earlier reports: helmet is likely configured.

### Runtime Config Check
- `scripts/check_runtime_config.py` checks for `DISABLE_AUTH_VERIFICATION` bypass flag

---

## 12. Existing Hardening Guards / Verifiers

### CI Verifiers
- **Production Docker Build**: Ensures Docker images build cleanly
- **Verifiers**: Mutation allowlist (13 mutations), route permission consistency
- **Branding guard**: Script checking for unsupported compliance claims (HIPAA, SOC2)
- **CI guard**: Quick pre-flight check

### Guards (applied globally in order)
1. `ThrottlerGuard` — rate limiting (100 req/min default, 5 req/min auth, 20 req/min sensitive)
2. `JwtAuthGuard` — authentication (fail-closed, `@Public()` bypass)
3. `MfaGuard` — MFA challenge check for sensitive routes
4. `TenantGuard` — tenant context consistency
5. `CsrfGuard` — CSRF for authenticated unsafe methods

### Middleware
- `AuditContextMiddleware` — applies to all routes
- `PhiMaskingInterceptor` — PHI masking in responses

### Existing Test Coverage (Related to Security)
- `auth-routing-stability.spec.ts`
- Various `*.e2e-spec.ts` test files in `test/`

---

## 13. High-Risk Hypotheses for S2–S10

| # | Hypothesis | Risk | S Phase |
|---|-----------|------|---------|
| H1 | Token sub/session owner mismatch: JWT strategy checks this, but should test | CRITICAL | S2 |
| H2 | Revoked session reuse: session deletion must reject subsequent access | CRITICAL | S2 |
| H3 | tokenVersion invalidation: user tokenVersion increment must invalidate all sessions | CRITICAL | S2 |
| H4 | Stale role claims: RolesGuard trusts JWT payload, not DB | HIGH | S2 |
| H5 | Tenant mismatch in nested queries: findUnique without tenantId | HIGH | S4 |
| H6 | CSRF missing on MFA challenge endpoints | HIGH | S3 |
| H7 | Public unsafe route without CSRF (new `@Public()` + `@Post`) | HIGH | S3 |
| H8 | Branch claim not cross-checked against session-level branchId | HIGH | S5 |
| H9 | Dashboard endpoints missing BranchGuard | MEDIUM | S6 |
| H10 | Wrong role accessing dashboard endpoints | MEDIUM | S6 |
| H11 | MFA challenge token scope/expiry abuse | HIGH | S7 |
| H12 | Recovery code reuse after use | MEDIUM | S7 |
| H13 | Unscoped Prisma findUnique returning cross-tenant records | HIGH | S9 |
| H14 | Audit/log PHI leakage via newValues/oldValues | MEDIUM | S13 |
| H15 | Reports/PDF endpoints without branch isolation | MEDIUM | S14 |

---

## 14. Prioritized Test / Fix Backlog

| Priority | Hypothesis | Phase | Estimated Effort |
|----------|-----------|-------|------------------|
| P0 | H1 — Token/session mismatch | S2 | 2 files, 4 tests |
| P0 | H2 — Revoked session reuse | S2 | 1 file, 2 tests |
| P0 | H3 — tokenVersion invalidation | S2 | 1 file, 2 tests |
| P0 | H5 — Unscoped findUnique | S9 | 5–10 files, 10 tests |
| P1 | H6 — MFA CSRF missing | S3 | 1 guard, 4 tests |
| P1 | H8 — Branch claim trust | S5 | 1 strategy, 3 tests |
| P1 | H11 — MFA challenge token | S7 | 1 service, 3 tests |
| P1 | H9 — Dashboard branch missing | S5/S6 | 1 controller, 4 tests |
| P2 | H4 — Stale role claims | S2 | 1 guard, 2 tests |
| P2 | H12 — Recovery code reuse | S7 | 1 service, 2 tests |
| P2 | H7 — Public unsafe route verifier | S8 | 1 script, 1 CI step |
| P2 | H14 — Audit PHI leakage | S13 | 2 files, 5 tests |

---

## 15. Not Assessed Yet

- Dependency vulnerability audit (S11)
- Secrets and sensitive config exposure (S12)
- Logging/PHI/audit leakage (S13)
- File/report/PDF exposure (S14)
- Rate-limit and abuse resistance (S15)
- IDOR/object-level authorization (S16)
- Destructive action/approval safety (S17)
- Frontend route trust/authorization consistency (S18)
- Backup/restore operational security (S19)
- Security automation/verifier hardening (S20)

---

## 16. Branding Guard Check

```
git grep -n "HIPAA Compliant\|SOC2 Certified\|SOC 2 Certified\|Enterprise Ready\|Built for Production\|Production Ready"
```

No unsupported compliance claims found in source code or documentation.

---

## 17. Conclusion

The attack surface is well-structured with fail-closed global guards. Key risk areas are:
1. **Branch isolation gaps** in dashboard and admin controllers
2. **MFA endpoint CSRF gaps** (all 3 MFA endpoints lack CSRF)
3. **Branch claim trust** in JWT strategy (no cross-check against session)
4. **Unscoped Prisma queries** (findUnique without tenantId checks)
5. **Stale role claims** in RolesGuard (relies on JWT payload)

Phase S1 documents 15 high-risk hypotheses. The next 9 phases (S2–S10) will systematically test each hypothesis, fix proven bugs, and add regression coverage.
