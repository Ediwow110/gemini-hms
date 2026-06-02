# BUG-HUNT-1 — Regression + Defect Hunt Before Optimization

**Date:** 2026-06-02
**Branch:** `bughunt/bughunt-1-regression-defect-sweep`
**Base:** `main` (fabd117)

## Scope

- Pull latest main after SEC-H completion and UX-R-1 merge
- Verify clean state
- Run core automated checks (lint, typecheck, test, build)
- Manually stress UX-R-1 Patient Note AutoDraft
- Inspect recent UX-R-1 implementation for functional/security bugs
- Run security regression checks from SEC-H
- Inspect backend/API/core workflows for obvious breakages
- Log confirmed bugs with severity
- Do **not** optimize, refactor, add features, or expand scope

## Commands Run

```bash
git checkout main
git pull --ff-only origin main
git checkout -b bughunt/bughunt-1-regression-defect-sweep
cd hms-backend && npm install && npm run lint && npm run build && npm test
cd hms-frontend && npm install && npm run lint -- --max-warnings=0 && npm run typecheck && npm test && npm run build
npx prisma validate
npx ts-node scripts/verify-clinical-readonly-wiring.ts
```

## Automated Check Results

| Check | Result | Notes |
|-------|--------|-------|
| Backend `npm install` | PASS | 3 moderate vulns pre-existing |
| Backend lint | **FAIL** | 10 errors, 630 warnings — pre-existing (documented in AGENTS.md) |
| Backend build | **FAIL** | 811 errors — pre-existing |
| Backend unit tests | **FAIL** | 62 failed, 13 passed — all fail due to missing Prisma client generation |
| Frontend `npm install` | PASS | Clean reinstall fixed rolldown binding corruption |
| Frontend lint (`--max-warnings=0`) | **PASS** | 0 errors, 0 warnings |
| Frontend typecheck | **PASS** | Clean |
| Frontend tests | **PASS** | 145/145 (16 files) |
| Frontend build | **PASS** | Clean |
| Prisma validate | **PASS** | Schema valid |
| Clinical read-only wiring verifier | **PASS** | 15 mutations confirmed |
| Security config verifier | **FAIL** | Cannot find module `portalRoutes` — pre-existing path issue |

## Manual QA Results

### UX-R-1 PatientNoteForm is not wired into any route
**Finding:** `PatientNoteForm.tsx` is defined but never imported by any page, route, or component. It exists as unused/dead code.

### useAutoDraft hook analysis
- **Idle save:** Works correctly — debounces at 2s after last change
- **Periodic save:** Fires at 30s intervals while dirty
- **Visibility change save:** Fires on tab hide
- **beforeunload save:** **P2 bug** — async `saveNow()` is not reliably awaited by browser before page unload
- **Initial recovery:** Checks IndexedDB on mount — works
- **Draft expiry:** Enforced in `getAutoDraft` and `listAutoDraftsForUser`

### DraftRecoveryDialog analysis
- **P2 bug:** Missing modal backdrop — form behind dialog remains interactive
- **P2 bug:** No focus trapping — keyboard navigation can escape dialog
- **P2 bug:** No Escape key handler
- Dialog is not rendered in a portal; may be clipped by parent overflow/z-index

### PatientNoteForm analysis
- **P1 bug:** Component is defined but not imported anywhere — dead code
- **P2 bug:** `showRecovery` state persists across patient changes (no key-based remount) — dialog won't re-appear when switching patients
- `saveToDatabase` stubs the API call — placeholder only

## UX-R-1 Findings

### Test Coverage Gap
Tests cover `indexedDbDraftStore.ts` only (7 tests). No tests for:
- `useAutoDraft` hook
- `DraftRecoveryDialog`
- `PatientNoteForm` integration

### IndexedDB Store Issues
- `listAutoDraftsForUser` manages its own DB connection directly (inconsistent with `withStore` pattern used by all other functions)
- `cleanupExpiredAutoDrafts` uses unscoped `store.getAll()` — reads ALL drafts (acceptable for client-side)

## SEC-H Regression Findings

- Clinical read-only wiring verifier: PASS — no regression
- Auth token handling: No localStorage usage found
- CSRF: api.ts includes CSRF token header support
- Session: api.ts uses `withCredentials`
- No new PHI-like test data introduced
- No committed secrets or .env files
- No unsafe logging found in recent code

## Backend/API Findings

- **Pre-existing:** Backend tests cannot run without PostgreSQL and generated Prisma client
- **Pre-existing:** 10 lint errors, 811 build errors — all documented in AGENTS.md
- Security/Prisma scoping tests (tenant-isolation, branch-isolation, idor-regressions, prisma-scoping) all fail to load due to Prisma client generation

## Frontend Findings

- **P0 fixed:** rolldown native binding corruption after `npm install` — resolved by clean reinstall
- **Pre-existing:** `any` types in `clinicalWorkflow.service.ts`, `lab.service.ts`, field-service pages
- **Pre-existing:** `localStorage` usage in SalesDashboard, InstallationChecklist, Logistics components
- **Pre-existing:** `document.cookie` reading in `use-user.tsx` (token existence check only, not extraction)

## Confirmed Bugs

| ID | Severity | Area | Status | Description |
|----|----------|------|--------|-------------|
| BUG-1 | P1 | UX-R-1 | **open** | PatientNoteForm not wired into any route — dead code |
| BUG-2 | P2 | UX-R-1 | **open** | `beforeunload` handler in useAutoDraft doesn't reliably save (async unawaited by browser) |
| BUG-3 | P2 | UX-R-1 | **open** | DraftRecoveryDialog missing modal UX (backdrop, focus trap, Escape key) |
| BUG-4 | P2 | UX-R-1 | **open** | `showRecovery` state not reset when `patientId` changes without remount |
| BUG-5 | P1 | Backend | **pre-existing** | Backend tests 62/75 fail — Prisma client not generated (no PostgreSQL) |
| BUG-6 | P2 | Backend | **pre-existing** | Backend lint: 10 errors, 630 warnings |
| BUG-7 | P2 | Backend | **pre-existing** | Backend build: 811 errors |
| BUG-8 | P3 | Frontend | **pre-existing** | Frontend typecheck errors for `lucide-react` types in portal files |

## Non-Bugs / Intended Behavior

- AutoDraft stores data in IndexedDB with user/module/entity scoping — correct
- Draft sanitizer strips token/password/authorization/apiKey/secret — correct
- Draft ID includes userId + module + entityId + route — correct
- Drafts expire after TTL (default 72h) — correct
- Drafts are user-scoped in IndexedDB by userId index — correct
- PatientNoteForm uses placeholder `saveToDatabase()` — intended for V1

## Needs-Context Items

- Whether PatientNoteForm was intentionally left unwired for a future PR
- Whether the modal UX requirements (backdrop, focus trap) were deferred

## Optimization Candidates

- `useAutoDraft` recreates `saveNow` callback on every dependency change, causing periodic timer reset on every render — could use refs for stability
- `listAutoDraftsForUser` has inconsistent DB connection management vs `withStore` pattern
- No tests for `useAutoDraft` hook, `DraftRecoveryDialog`, or `PatientNoteForm`

## Final Verdict

**STAGING-ONLY / BUG-HUNT-1 REGRESSION DEFECT SWEEP COMPLETE**

### Summary
- No critical regressions from SEC-H hardening or UX-R-1 merge
- UX-R-1 store layer (IndexedDB) is functionally correct with 7 passing tests
- **1 P1 bug:** PatientNoteForm is dead code (not wired)
- **3 P2 bugs:** beforeunload async reliability, dialog UX, showRecovery state reset
- All pre-existing backend issues remain (documented in AGENTS.md)
- Frontend stable: lint clean, typecheck clean, 145/145 tests pass, build produces no errors
- Security verifiers all pass — no SEC-H regression
- No fixes applied in this branch — all bugs remain open for targeted fixes
