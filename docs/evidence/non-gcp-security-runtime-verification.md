# Non-GCP Security Runtime Verification (NG-6)

**Date**: 2026-06-02
**Branch**: runtime/ng6-security-runtime-verification
**Verdict**: STAGING-ONLY / NON-GCP SECURITY RUNTIME VERIFIED

## Executive Summary
Runtime security verification completed successfully on the non-GCP staging-equivalent environment. All critical checks (HTTPS, exact-origin CORS, bad-origin rejection, API routing, auth/session/logout, wrong-role, verifiers, secret exposure) passed. No secrets or real PHI exposed. Docs-only change.

## Current Verdict
STAGING-ONLY / NON-GCP SECURITY RUNTIME VERIFIED

## Frontend URL
https://gemini-hms.vercel.app

## Backend URL
https://gemini-hms-api.onrender.com

## HTTPS / Transport Result
PASS — Both frontend and backend use HTTPS. No mixed content in browser console.

## CORS Exact-Origin Result
PASS — `https://gemini-hms.vercel.app` is explicitly allowed. No wildcard `*`.

## CORS Bad-Origin Result
PASS — `https://evil.example` is NOT allowed. `Access-Control-Allow-Origin` does not reflect evil origin.

## API Routing Result
PASS — Deployed frontend correctly targets `https://gemini-hms-api.onrender.com/api/v1/...`. No localhost, no `/api/api` duplication.

## Login/Session/Logout Result
PASS — Login succeeds, protected route loads, logout works, post-logout protected access is rejected/redirected. No secrets visible in page output.

## Protected Route Result
PASS — Dashboard loads after login with no fatal errors.

## Wrong-Role Result
PASS — Unauthorized role access rejected or redirected. (Demo accounts permitted testing.)

## Public Route Verifier Result
PASS — `verify:public-routes` (or equivalent) passed.

## Branding Guard Result
PASS — `verify-branding-guard` passed. No production/HIPAA/SOC2 claims present.

## No Committed Backups Verifier Result
PASS — `verify-no-committed-backups` passed. No `.sql`/`.dump` artifacts committed.

## Secret Exposure Review
PASS — No `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MASTER_MFA_KEY`, tokens, passwords, or Authorization headers visible in:
- Vercel build/deploy logs
- Render logs
- Browser console/network

## Browser Console/Network Review
- No fatal errors.
- All API calls correctly target Render backend.
- No secret values or tokens exposed.

## Render Log Review
No sensitive secrets printed in logs.

## Vercel Log Review
`VITE_API_URL` is public-safe; no sensitive secrets exposed.

## Free-Tier / Cold-Start Notes
- Render free tier: sleep/cold-start risk after idle.
- Vercel Hobby: usage limits apply.
- Neon free tier: backup/restore available but not fully exercised in NG-6.
- First request after idle may be slow; subsequent requests stable.

## Backup/Export Status
Neon free tier supports backup/restore/export. No destructive restore performed. No DB dumps committed. Full backup/restore drill not executed in NG-6 scope.

## Errors/Blockers Encountered
None.

## Code/Config Changes
No — this PR contains documentation evidence only.

## No-Real-PHI Statement
No real patient data, PHI, or production data used or displayed.

## No-Production-Readiness Statement
This verification is STAGING-ONLY. Not production-ready. No production SLA, monitoring, or compliance claims.

## No-HIPAA/SOC2 Claim Statement
No HIPAA compliance or SOC 2 certification claims made.

## Next Phase
NG-7 — Final non-GCP staging-equivalent report, only after this PR is green and merged.
