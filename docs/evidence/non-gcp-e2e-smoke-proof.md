# Non-GCP E2E Smoke Proof (NG-5)

**Date**: 2026-06-02
**Branch**: runtime/ng5-e2e-smoke-proof
**Verdict**: STAGING-ONLY / NON-GCP E2E SMOKE PROVEN

## Executive Summary
End-to-end smoke test completed successfully on the non-GCP staging-equivalent runtime. Deployed Vercel frontend and Render backend work together through a safe demo journey. All critical checks (API target, no localhost, no /api/api, CORS, console, secrets, PHI) passed. Docs-only change.

## Current Verdict
STAGING-ONLY / NON-GCP E2E SMOKE PROVEN

## Frontend URL
https://gemini-hms.vercel.app

## Backend URL
https://gemini-hms-api.onrender.com

## Smoke Account Type
demo/seed account only — no secrets or real credentials used.

## Frontend Load Result
PASS — https://gemini-hms.vercel.app loads successfully.

## Backend Reachability Result
PASS — `GET /api/v1/health` returns 200 from Render backend.

## Login Result
PASS — login succeeds with seeded demo account. API request correctly targets `https://gemini-hms-api.onrender.com/api/v1/...`.

## Protected Route/Dashboard Result
PASS — at least one protected dashboard route loads after login with no fatal errors.

## API Host/Path Result
PASS — all API calls correctly target `gemini-hms-api.onrender.com/api/v1/...`.

## Localhost Check Result
PASS — no localhost references in browser or network requests.

## /api/api Check Result
PASS — no `/api/api` duplication observed.

## CORS Result
PASS — no CORS errors; exact Vercel origin allowed on Render.

## Browser Console/Network Review
- No fatal console errors.
- Network tab confirms correct Render backend host and `/api/v1/...` paths.
- No secret values or tokens exposed.

## Secrets Exposure Check
PASS — no secrets, JWT tokens, or sensitive values visible in browser console/network.

## No-Real-PHI Statement
No real patient data, PHI, or production data used or displayed during smoke test.

## Free-Tier/Cold-Start Notes
- Vercel Hobby and Render free tier used.
- Cold-start delays observed on first request after idle.
- Subsequent requests stable.

## Errors/Blockers Encountered
None.

## Code/Config Changes
No — this PR contains documentation evidence only.

## No-Production-Readiness Statement
This smoke test is STAGING-ONLY. Not production-ready. No production infrastructure, monitoring, or compliance claims.

## Next Phase
NG-6 — Runtime/security verification, only after this PR is green and merged.
