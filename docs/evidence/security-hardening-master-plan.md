# Security Hardening Master Plan (SEC-H-0)

**Date**: 2026-06-02
**Branch**: security/hardening-master-plan
**Verdict**: STAGING-ONLY / SECURITY HARDENING MASTER PLAN

## 1. Executive Summary

This document defines the focused security hardening track that converts the 21 parked security branches (s1–s21) into concrete, current-main work.

All security branches are high-risk. No bulk merge or deletion is allowed. Hardening must proceed through focused PRs (SEC-H-1 through SEC-H-7) after this master plan.

## 2. Current Security Posture

- NG-6 proved basic runtime security verification (HTTPS, CORS, auth/session/logout, verifiers).
- SR-1 through SR-3 reviewed all 21 security branches and confirmed they are parked/high-risk.
- No direct merge or delete candidates identified.
- Current main contains some security verifiers and tests, but many older regression tests and verifiers remain in the parked branches.

## 3. What NG-6 Proved

- HTTPS, exact-origin CORS, bad-origin rejection.
- Login/session/logout behavior.
- Wrong-role rejection in demo accounts.
- Public route verifier, branding guard, no-committed-backups verifier.
- No secrets exposed in browser or logs during staging smoke tests.

## 4. What NG-6 Did Not Prove

- Full tenant/branch isolation on all queries.
- IDOR/object authorization on all record types.
- Rate-limit/abuse resistance under load.
- Destructive-action safety on all privileged operations.
- Secrets/config/logging/PHI exposure prevention across all code paths.
- Verifier hardening and consolidation.

## 5. Security Hardening Priorities

1. Public route exposure verifier / route inventory (SEC-H-1)
2. Prisma query scoping / tenant and branch isolation (SEC-H-2)
3. Auth/session/CSRF regression hardening (SEC-H-3)
4. IDOR/object authorization regression hardening (SEC-H-4)
5. Secrets/config/logging/PHI exposure hardening (SEC-H-5)
6. Destructive-action safety and audit trail hardening (SEC-H-6)
7. Security verifier consolidation and final security hardening report (SEC-H-7)

## 6. Phase Plan SEC-H-1 through SEC-H-7

Each phase will:
- Reference the relevant parked security/s* branches only for context.
- Produce focused, current-main changes.
- Open a dedicated PR.
- Wait for green CI + Production Docker Build.
- Merge only after explicit user approval.

## 7. Per-Phase Target Files/Tests

- SEC-H-1: public-route verifier script, route inventory docs, public/protected route classification tests.
- SEC-H-2: Prisma service query guards, tenant/branch scoping regression tests, object authorization helpers.
- SEC-H-3: auth/session/logout/refresh tests, CSRF regression tests, secure cookie/session policy tests.
- SEC-H-4: IDOR/object authorization regression tests, controller/service authorization guards.
- SEC-H-5: secrets/config validation tests, log redaction tests, safe config verifier.
- SEC-H-6: destructive-action guard tests, audit event assertions, confirmation/ role restriction tests.
- SEC-H-7: security hardening final report (docs-only unless verifier index update is required).

## 8. Risk Controls

- No schema changes unless explicitly approved in advance.
- No weakening of auth, RBAC, tenant/branch isolation, MFA, CSRF, audit, or destructive-action safeguards.
- No real PHI.
- No committed secrets or .env files.
- Every PR must pass backend lint/build/test + frontend typecheck/lint/test/build (if frontend touched) + git diff --check + branding guard.

## 9. Non-Claims

- This plan does not claim production readiness.
- This plan does not claim HIPAA compliance.
- This plan does not claim SOC 2 certification.
- This plan does not authorize real PHI usage.

## 10. Stop Gates

- Any PR touching schema, migrations, deployment, or package files must stop and request explicit approval.
- Any PR weakening auth, isolation, or audit safeguards must stop.
- Any dirty tracked files, failed checks, or unexpected divergence must stop the phase.

**END OF SECURITY HARDENING MASTER PLAN**
