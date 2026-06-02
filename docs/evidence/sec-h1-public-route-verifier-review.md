# SEC-H-1: Public Route Exposure Verifier Review

**Date:** 2026-06-02
**Branch:** security/sec-h1-public-route-verifier
**Verdict:** STAGING-ONLY / SEC-H-1 COMPLETE

## Scope
Focused hardening of public route exposure verification. No app code changes, no guard weakening, no auth bypass, no deployment changes, no real PHI, no secrets.

## Current State (Main)

### Existing Verifier
- Script: `scripts/verify-public-routes.js` (350 lines)
- Allowlist: `docs/security/public-route-allowlist.json` (21 entries)
- Execution: `node scripts/verify-public-routes.js`
- CI-safe: Yes (static scan, no server/credentials required)

### Verifier Capabilities
1. Scans all `*.controller.ts` files under `hms-backend/src`
2. Detects class-level `@Public()` and method-level `@Public()` decorators
3. Extracts HTTP method (`@Get`, `@Post`, etc.) and handler name
4. Compares against allowlist (file:handler key)
5. Validates allowlist entries reference existing files/handlers
6. Reports unknown public routes as FAIL
7. Reports method mismatches as warnings
8. Reports allowlist coverage gaps as warnings

### Execution Result (Current Main)
```
Found 40 controller files.
Method-level @Public() found: 7
Class-level @Public() handlers found: 14

Errors: 0
Warnings: 0
Allowlist entries: 21
Coverage: 21/21 allowlist entries matched

RESULT: PASS
```

### Reference Branches (Not Merged)
- `security/s8-public-route-exposure-verifier`: Contains the verifier + allowlist (already in main)
- `security/s3-csrf-public-route-regressions`: CSRF guard tests + unsafe route inventory
- `security/s18-frontend-route-trust-audit`: Frontend route trust audit doc

These remain reference material only. SEC-H-1 does not merge them.

## SEC-H-1 Assessment

### Strengths
- Verifier is CI-safe and deterministic
- Allowlist enforces explicit public route declaration
- Fail-fast on unknown public exposure
- No live server or credentials required
- Clear error messages with remediation guidance

### Limitations (Documented in Script)
- Line-based scanning (not AST parsing)
- Does not resolve full route prefix from `@Controller()` + module metadata
- Conservative warnings for uncertain matches
- Does not detect implicit public routes (e.g., missing guards due to misconfiguration)

### Gaps vs. Reference Branches
- No dedicated test for verifier itself (unit test coverage not present)
- No automated CI job wiring visible in current main (assumed in GitHub Actions)
- Frontend route trust audit (s18) not integrated into backend verifier

## Recommendations (Future SEC-H Phases)
- SEC-H-2: Add unit tests for `verify-public-routes.js` (edge cases, malformed decorators)
- SEC-H-3: Wire verifier into GitHub Actions CI (fail PR on unknown public route)
- SEC-H-4: Consider AST-based scanner (TypeScript compiler API) for prefix resolution
- SEC-H-5: Integrate frontend route classification (from s18) into unified inventory

## Conclusion
Existing verifier (`scripts/verify-public-routes.js`) + allowlist is adequate for SEC-H-1. No code changes required. Public route exposure is intentionally allowlisted and verified at scan time.

**Verdict:** SEC-H-1 COMPLETE — Verifier reviewed and confirmed adequate. Staging-only. No app code, no deployment, no secrets, no PHI, no production-readiness claim.

---
Next: SEC-H-2 (if authorized) or await CI/Docker on this PR.
