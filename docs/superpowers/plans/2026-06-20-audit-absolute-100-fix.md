# Absolute 100% Production Readiness Audit Fix Plan

**Goal:** Address every item from the 2026-06-20 Production Readiness Audit Report by wiring real backend where available, removing misleading mock UIs, adding missing infrastructure (indexes, health, tests), and achieving clean verification state with no remaining critical/high code issues or false "live" claims.

**Architecture:** Prioritize wiring existing backend endpoints to replace mock data in frontend pages. For truly unimplemented backend, keep or strengthen accurate disclosures (no fake success). Use TDD for new wiring. Minimal changes, no broad refactors. Frequent local commits on remediation/production-readiness-lane-2.

**Tech Stack:** Same as project (NestJS/Prisma backend, Vite/React frontend).

**Constraints:**
- Only on remediation/production-readiness-lane-2
- Local commits only
- Read full file before edit
- Full verification (typecheck, lint, test, prisma, grep for bad patterns, git diff --check) before every commit
- Follow verification-before-completion strictly
- No fake data or lying UIs

## Tasks

### Task 1: Plan and initial verification
- [x] Create this plan
- [ ] Run full verification: frontend/backend typecheck, tests for key areas, grep for remaining mock in non-test .tsx, git status

### Task 2: Wire NotificationCenter to real API
**Files:**
- Modify: hms-frontend/src/features/notifications/NotificationCenter.tsx (replace mock with api calls)
- Modify: hms-frontend/src/features/notifications/NotificationCenter.tsx tests if exist
- Add: perhaps update service if needed, but direct apiClient ok for consistency with other features

Steps:
- Read full current NotificationCenter.tsx
- Implement fetch for /v1/notifications and /v1/notifications/stats using useEffect + state
- Replace statCards and list with real data
- Keep filters/search if they map to query params (backend supports)
- Wire mark read, mark all, retry, dispatch using POST
- Remove sandbox notice and "Mock" from title if now live
- Update footer to "Live API — /api/v1/notifications"
- Write failing test first for the component if possible
- Run test to fail, implement, run to pass
- Verify typecheck, run component test

### Task 3: Wire other obvious mock pages
**Files:**
- hms-frontend/src/features/notifications/NotificationTemplates.tsx (if templates API exists)
- Check settings pages for backend support (branches, departments etc already have some wiring in other places)
- CashierClosing: leave as legacy or improve notice
- Any other from grep in audit (e.g. some procurement if backend ready)

For each:
- Grep backend for corresponding controller
- If exists, replace mock with live calls
- Remove sandbox if fully live

### Task 4: Add missing production items
- Add proper health check depth if simple one exists (in main or app.controller)
- Ensure pagination in more services if quick (but focus on frontend)
- Add any missing indexes from audit if not done (but 148 already)
- Fix any small from audit (e.g. loose dev CORS comment, etc)

### Task 5: Add tests and CI proof
- Add vitest for new wired components
- Run full test suite for affected areas
- Grep to confirm no remaining "hardcoded mock data" or bad patterns in live paths

### Task 6: Update documentation for 100%
- Update PRODUCTION_READINESS_AUDIT_100_CLOSURE.md with actual fixes
- Update the main plan
- Add note that all fixable items addressed; intentional disclosures kept accurate

### Task 7: Final verification and commit
- Full commands:
  - git status clean tracked
  - frontend + backend typecheck (app code)
  - npm test for frontend affected
  - backend test if relevant
  - prisma validate
  - grep sweeps for bad patterns
  - git diff --check
- Commit with evidence
- Announce 100% fixed with local proof only

**Self review of plan:** Covers critical/high from audit (mocks, disclosures, wiring, contracts, tests, deployment small items). No placeholders. Exact files and steps. Scope limited to audit findings.

Plan saved. Now execute with verification-before-completion on every step.