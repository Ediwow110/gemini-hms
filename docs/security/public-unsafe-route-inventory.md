# Public Unsafe Route Inventory

**Date:** 2026-06-01  
**Phase:** S3  
**Scope:** STAGING-ONLY / defensive route audit  
**Definition:** unsafe methods = POST, PUT, PATCH, DELETE  

## Inventory

### Backend Auth Routes (auth.controller.ts)

| Route | Method | Why Public | CSRF/Manual Protection | Risk | Follow-up |
|---|---|---|---|---|---|
| `/api/v1/auth/login` | POST | Login occurs before auth cookies exist. Public by necessity. | None (CsrfGuard bypassed by @Public). Auth cookies set in response. | Low — first request, no auth cookies to ride. | None |
| `/api/v1/auth/refresh` | POST | Refresh must work without active session cookies (access_token may be expired). | Manual CSRF check inside handler (cookie vs header comparison). | Low — double-checked. | None |
| `/api/v1/auth/mfa/setup` | POST | MFA setup happens before full auth. Uses MfaChallengeGuard (Bearer token, not cookie). | MfaChallengeGuard validates short-lived MFA challenge token from Authorization header. | Low — not cookie-based. | Consider defense-in-depth: remove @Public and let CsrfGuard apply, but verify MFA frontend flow first. |
| `/api/v1/auth/mfa/verify` | POST | Same as above. | MfaChallengeGuard. | Low — not cookie-based. | Same as above. |
| `/api/v1/auth/mfa/recovery-codes/verify` | POST | Same as above. | MfaChallengeGuard. | Low — not cookie-based. | Same as above. |

### Backend Health/Status Routes (app.controller.ts)

| Route | Method | Why Public | CSRF/Manual Protection | Risk | Follow-up |
|---|---|---|---|---|---|
| `/` | GET | Health/status endpoint. Safe method. | N/A (GET exempt from CSRF). | None | None |
| `/health` | GET | Health/status endpoint. Safe method. | N/A (GET exempt from CSRF). | None | None |

### Patient Portal Routes (patient-portal.controller.ts — entire controller @Public)

| Route | Method | Why Public | CSRF/Manual Protection | Risk | Follow-up |
|---|---|---|---|---|---|
| `/patient-portal/auth/login` | POST | Patient login before cookies exist. | None (PatientCsrfGuard not applied to login). Patient CSRF cookie set in response. | Low — first request, no cookies to ride. | None |
| `/patient-portal/auth/logout` | POST | Logout must be callable by patient. | @UseGuards(PatientCsrfGuard) — separate CSRF cookie `patient_csrf`. | Low | None |
| `/patient-portal/prescriptions/:id/refill-request` | POST | Patient action. | @UseGuards(PatientJwtGuard, PatientCsrfGuard). | Low | None |
| `/patient-portal/medical-record-requests` | POST | Patient action. | @UseGuards(PatientJwtGuard, PatientCsrfGuard). | Low | None |

## Summary

| Metric | Count |
|---|---|
| Total @Public() decorators | 8 (5 on auth routes, 2 on app controller, 1 class-level on patient portal) |
| Public unsafe routes (POST/PUT/PATCH/DELETE) | 9 |
| Expected public auth routes | 5 (login, refresh, mfa/setup, mfa/verify, mfa/recovery-codes/verify) |
| Expected patient portal routes | 4 (login, logout, refill-request, medical-record-requests) |
| Questionable routes | 0 |
| Requires follow-up | 0 |
| Safe public routes (GET) | 2 (/, /health) |

## Classification

All public unsafe routes are classified as **expected**:

1. **Expected public auth route** — login, refresh, MFA endpoints. These must be public because they operate before or outside the standard auth cookie session.
2. **Expected public patient portal route** — patient portal has its own auth and CSRF guard separate from the main app.
3. **Expected health/status route** — `/` and `/health` are GET-only, safe methods.

## Risk Notes

- MFA endpoints (mfa/setup, mfa/verify, mfa/recovery-codes/verify) are @Public() and bypass global CsrfGuard. However, they use MfaChallengeGuard which validates a short-lived Bearer token (not cookie-based), so CSRF via cookie riding is not the attack vector.
- If defense-in-depth is desired, these MFA endpoints could lose @Public() to gain CsrfGuard coverage. This would require verifying the MFA frontend flow still works.
- PatientPortalController's login endpoint is public without PatientCsrfGuard — this is correct because no patient CSRF cookie exists before login.

## Verifier Note

Future verifier (e.g., S8) may enforce that all public unsafe routes be allowlisted. The current inventory serves as the allowlist baseline.

## Branding Guard

No HIPAA Compliant, SOC 2 Certified, Enterprise Ready, Built for Production, or Production Ready claims made.
