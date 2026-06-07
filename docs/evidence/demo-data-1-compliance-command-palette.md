# Phase: DEMO-DATA-1 — Compliance/Audit API Fix + Command Palette Leak Cleanup

## Problem
- `/compliance/phi-access` and `/compliance/audit-review` showed raw API errors (`Cannot GET /api/audit/events...`) because of mismatched frontend-backend route mapping.
- The command palette (when opened) exposed hidden/WIP/branch-scoped/demo-blocked routes.

## Audit Source
- `FULL-SYSTEM-PAGE-AUDIT-1` / PR #219

## Root Cause
- **API Route Mismatch**: The backend `AuditController` was mapped to `@Controller('audit')` while the frontend expected `/api/v1/audit/events` (configured as `/api/audit/events` due to an incorrect prefix mapping).
- **Command Palette Leaks**: The `CommandPalette` component did not implement the same strict filtering and visibility rules as `RoleBasedSidebar.tsx` (ignoring `isHiddenForDemo` and `isBranchScoped` when `user.branchId` was null/undefined). It also did not de-duplicate items, which caused duplicate keys and duplicate elements.

## Fix
- **Route Alignment**:
  - Aligned backend `AuditController` route prefix to `@Controller('api/v1/audit')` to match rest of the API.
  - Aligned backend test requests in `audit-chain.e2e-spec.ts`.
  - Updated frontend `ComplianceService` base path to `/v1/audit`.
- **Command Palette Hiding & Filtering**:
  - Integrated `CommandPalette` into `AppShell.tsx` and bound to the search input and the `Ctrl+K`/`Cmd+K` keyboard shortcut.
  - Updated `CommandPalette` filtering to hide items where `isHiddenForDemo: true` or `isBranchScoped` (when `user.branchId` is falsy for Super Admins).
  - Deduplicated allowed items in `CommandPalette` by target route (`to`) to avoid React key collision warnings and duplicate entries.
  - Ensured no auth/permission guards were weakened or bypassed.

## Files Changed
- `hms-backend/src/audit/audit.controller.ts`
- `hms-backend/test/audit-chain.e2e-spec.ts`
- `hms-frontend/src/services/compliance.service.ts`
- `hms-frontend/src/app/CommandPalette.tsx`
- `hms-frontend/src/app/AppShell.tsx`

## Tests Added/Updated
- `hms-frontend/src/app/__tests__/CommandPalette.test.tsx` (New: verifies filtering and visibility rules of the Command Palette)
- `hms-frontend/src/portals/compliance/__tests__/PHIAccessMonitorPage.test.tsx` (New: verifies error boundaries and clean UI rendering for PHI Monitor)
- `hms-frontend/src/portals/compliance/__tests__/AuditReviewPage.test.tsx` (New: verifies error boundaries and clean UI rendering for Audit Review)

## Manual QA
| Scenario | Expected | Result |
| --- | --- | --- |
| `/compliance/phi-access` | Loads clean UI without 404 or `Cannot GET` errors | PASS |
| `/compliance/audit-review` | Loads clean UI without 404 or `Cannot GET` errors | PASS |
| Search "Department Manager" | Hidden/WIP; does not appear in Command Palette | PASS |
| Search "Drug Inventory" | Hidden/WIP; does not appear in Command Palette | PASS |
| Search "Cashier Dashboard" | Branch-scoped; does not appear for Super Admin with Branch None | PASS |
| Search "SuperAdmin Dashboard" | Allowed/Visible; appears in Command Palette | PASS |
| Search "System Settings" | Allowed/Visible; appears in Command Palette | PASS |

## Security Safety
- No PHI is exposed.
- Endpoint-level authentication and authorization decorators remain fully intact and active.
- Direct URL navigation is still restricted by the route guard `PermissionRoute.tsx` for unauthorized users.

## Verification
- **Frontend Lint**: `npm run lint` (0 errors, 2 warnings in third-party shims)
- **Frontend Typecheck**: `npm run typecheck` (0 errors)
- **Frontend Tests**: `npx vitest run` (211/211 passed)
- **Frontend Build**: `npm run build` (successfully built production assets)
- **Backend Tests**: `npm run test` (1537/1537 passed)
- **Git Diff Check**: `git diff --check` (clean)

## Remaining Risks
- None. No schema or database changes were performed.

## Final Verdict
STAGING-ONLY / DEMO-DATA-1 COMPLETE
