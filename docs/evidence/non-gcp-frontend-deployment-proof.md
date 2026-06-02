# Non-GCP Frontend Deployment Proof (NG-4)

**Date**: 2026-06-02
**Branch**: runtime/ng4-frontend-deployment-proof
**Verdict**: STAGING-ONLY / NON-GCP FRONTEND DEPLOYED

## Executive Summary
Frontend successfully deployed to Vercel and connected to existing Render backend. All critical checks (API URL, no /api/api duplication, no localhost, CORS, login) passed. No secrets committed. Docs-only change.

## Current Verdict
STAGING-ONLY / NON-GCP FRONTEND DEPLOYED

## Vercel Project Summary
- Source: Ediwow110/gemini-hms
- Framework: Vite
- Root directory: hms-frontend
- Build command: npm run build
- Output directory: dist
- Branch: main

## Frontend Public URL
https://gemini-hms.vercel.app

## Render Backend URL
https://gemini-hms-api.onrender.com

## VITE_API_URL Configuration Shape
Set manually in Vercel project settings:
VITE_API_URL=https://gemini-hms-api.onrender.com/api

## Build Command and Result
npm run build → PASS

## Output Directory
dist

## API Base URL Behavior
Frontend correctly calls Render backend using `/api/v1/...` paths. No duplication.

## /api/api Check Result
PASS — no `/api/api` duplication observed in network tab.

## Localhost Check Result
PASS — no localhost references in browser or network requests.

## CORS Update/Result
Render updated with:
CORS_ALLOWED_ORIGINS=https://gemini-hms.vercel.app
Result: PASS — exact Vercel origin allowed, no wildcard.

## Login Page Result
PASS — login page loads and authentication works against Render backend.

## Dashboard Route Notes
Clinical dashboard accessible post-login. No mock data issues observed.

## Browser/Network/Console Notes
- No console errors related to API or CORS.
- All API calls route to Render backend.
- Network tab confirms correct `/api/v1/...` paths.

## Vercel Log Review
- Build succeeded with no secrets exposed.
- VITE_API_URL correctly injected at build time.

## Code/Config Changes
No — this PR contains documentation evidence only.

## Free-Tier Notes
- Vercel Hobby plan used.
- Render free tier used for backend.
- Both subject to cold-start and usage limits.

## Errors Encountered
None.

## No-Real-PHI Statement
No real patient data, PHI, or production secrets used or committed.

## No-Production-Readiness Statement
This deployment is STAGING-ONLY. Not production-ready. No production infrastructure, monitoring, or compliance claims.

## Next Phase
NG-5 only after this PR is green and merged.
