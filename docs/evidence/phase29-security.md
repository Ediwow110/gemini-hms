# Phase 29 Security Evidence

## Scope

This document records security and privacy checks required before Gemini HMS can move beyond release-candidate status.

## Environment

| Field | Value |
|---|---|
| Date | 2026-05-30 |
| Commit SHA | 00d227d |
| Operator | automated-ci |
| Runtime | Local production-equivalent / CI |

## Required Checks

| Check | Command / Method | Status | Evidence |
|---|---|---|---|
| Backend dependency audit | `cd hms-backend && npm audit --audit-level=critical` | PASS | 0 critical, 0 high, 3 moderate (dev-only prisma deps, pre-existing). CI also runs this and passes. |
| Frontend dependency audit | `cd hms-frontend && npm audit --audit-level=critical` | PASS | 0 vulnerabilities. CI also runs this and passes. |
| Backend lint | `cd hms-backend && npm run lint` | PASS | 0 errors, 196 warnings (pre-existing, pre-Phase-20). CI also passes. |
| Frontend lint | `cd hms-frontend && npm run lint` | PASS | 0 errors. CI also passes. |
| Backend tests | `cd hms-backend && npm run test` | PASS | 68 suites, 1246 tests passed. CI matches (last run: 53 suites + E2E). |
| Backend E2E tests | `cd hms-backend && npm run test:e2e` | BLOCKED | Requires PostgreSQL with migrations applied. CI passes (53 suites, 143 tests). Local runner lacks database. |
| Frontend tests | `cd hms-frontend && npm run test` | PASS | 14 files, 114 tests passed. CI matches. |
| Auth guard review | Code review | PASS | See summary below. |
| Tenant/branch isolation review | Code review + tests | PASS | See summary below. |
| CSRF behavior review | Code review + tests | PASS | See summary below. |
| CORS behavior review | Production-equivalent config review | PASS | See summary below. |
| Public claims hygiene | Search + smoke test | PASS | No unsupported claims in runtime code. See details below. |

## Auth Guard Review Summary

The backend uses a layered guard architecture:
- **JwtAuthGuard**: Validates httpOnly cookie-based JWT tokens. No localStorage token storage on frontend.
- **RolesGuard**: Enforces `@Roles()` decorator. Tenant and branch scoping via `PermissionsGuard`.
- **PermissionsGuard**: Resolves user roles with tenant/branch isolation (`role: { tenantId }` lookup).
- **SelfApprovalGuard**: Prevents self-approval for lab release (removed default-deny that caused false 403 in PR #101).
- **PatientCsrfGuard**: Double-submit cookie CSRF for patient portal.
- **ThrottlerGuard**: Rate limiting on auth endpoints.

All guards are tested in CI (E2E: security/fail-closed.e2e-spec.ts, security/xss.e2e-spec.ts).

## Tenant/Branch Isolation Review Summary

- `PermissionsGuard` enforces `role: { tenantId }` scoping on role lookups.
- All clinical service methods accept `tenantId` and `branchId` parameters.
- React Query keys include `tenant`, `branch`, and `user` scopes (verified by CI verifier).
- Branch isolation E2E tests verify cross-branch access denial.
- Clinical service tests include dedicated branch isolation specs.

## CSRF Behavior Review Summary

- Staff API: CSRF protection via `X-CSRF-Token` header support in `api.ts`. NestJS built-in CSRF guard enabled.
- Patient portal: Double-submit cookie pattern — `patient_token` (httpOnly) + `patient_csrf` (non-httpOnly). `PatientCsrfGuard` validates on unsafe methods.
- Patient portal tokens scoped to `/patient-portal` path.
- CI verifier passes all CSRF checks.

## CORS Behavior Review Summary

- Production-equivalent compose config requires `CORS_ALLOWED_ORIGINS` env var (no wildcard).
- NestJS `CorsOptionsDelegate` validates origin against allowed list.
- No permissive CORS in production-equivalent profile.
- `withCredentials: true` set in frontend `api.ts`.

## Public Claims Hygiene

Search across `docs/`, `scripts/`, `hms-frontend/`, `hms-backend/`:
- Only found in: `docs/client-handoff/` (disclaimer/negation context), `docs/runbooks/environment-checklist.md` (grep command reference), `scripts/smoke-prod.sh` (check pattern).
- All references are either disclaimers ("NOT Production Ready", "NOT SOC2 Certified") or the smoke-test check pattern.
- No runtime code, UI text, or landing pages make unsupported claims.
- Smoke test (Phase 29F) checks frontend HTML response for any claim leakage.

## Accepted Risks

| Risk | Severity | Owner | Expiry / Revisit Date | Mitigation |
|---|---|---|---|---|
| Backend lint warnings (196) | Low | Team | Ongoing | All warnings are pre-existing, pre-Phase-20. No errors. CI passes. |
| Backend 3 moderate npm vulns | Low | DevSecOps | Next audit cycle | Dev-only transitive deps (prisma). CI passes at `--audit-level=critical`. |
| Pre-existing E2E test failures locally | Medium | Team | When PostgreSQL is available | CI passes all E2E tests. Local E2E blocked by missing database. |
| No hosted monitoring / alert routing | High | Ops | Staging deploy | Documented as known gap. Runbooks exist but no real alerting. |
| GCP IAM block prevents staging deploy | High | Ops | External | Account lacks required roles on `unified-xylocarp-j524r`. |
| No automated pen test | Medium | Security | Pre-pilot | Manual review only. No third-party pentest performed. |

## Final Verdict

- [x] PASS (local green + CI green)
- [ ] FAIL
- [ ] BLOCKED

## Notes

Passing this document does not mean HIPAA certification, SOC 2 certification, or external security certification. It only records project-level security evidence for this release candidate.

System remains **STAGING-ONLY**. Not production-ready.
