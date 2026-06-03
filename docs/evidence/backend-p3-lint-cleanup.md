# BACKEND-P3-LINT-CLEANUP

- **Branch:** `maintenance/backend-p3-lint-cleanup`
- **Base:** main (6aaa4a5)
- **PR:** #200

## Summary

Removed 19 `@typescript-eslint/no-unused-vars` warnings across 9 backend source files. No behavioral changes. All 152 remaining warnings are pre-existing `@typescript-eslint/no-unsafe-argument` (deferred to future phase).

## Warnings Fixed

| Rule | Before | After |
|------|--------|-------|
| `@typescript-eslint/no-unused-vars` | 19 | 0 |
| `@typescript-eslint/no-unsafe-argument` | 152 | 152 (unchanged — deferred) |
| Prettier errors | 2 | 0 |
| **Total (src/)** | **171** | **152** |

## Files Changed (9)

| File | Change | Reason |
|------|--------|--------|
| `admin.service.spec.ts` | Removed `let metrics` | Unused variable |
| `mfa-challenge.guard.ts` | `catch(e)` → `catch {}` | Unused error binding |
| `auth-routing-stability.spec.ts` | Removed `MockSessionService` type + `sessionService` var | Unused type/variable |
| `session-boundary.spec.ts` | Added `void sub/sid/tenantId/tokenVersion` | Destructured exclude vars (required for rest pattern) |
| `clinical-workflow.service.ts` | `catch(auditErr)` → `catch {}` (×2) | Unused error binding |
| `clinical-workflow.service.spec.ts` | Removed `patientUser` constant | Unused test fixture |
| `triage-mutation.service.spec.ts` | Removed `NotFoundException` import | Unused import |
| `tenant-isolation.spec.ts` | Removed 5 unused symbols | Unused imports/constants/function |
| `dashboard.service.ts` | Added `void lowStock` + renamed unused param to `_query` | Unused destructured var + param |

## Verification Results

- **Lint:** 0 errors, 152 warnings (all pre-existing no-unsafe-argument)
- **TypeScript (tsc --noEmit):** No new errors from changed files
- **Tests:** 1435 passed across 75 suites (no regressions)
- **Changed lines:** +12 / -47 across 9 files

## Security Review

All changes are trivially safe:
- Only unused variables/imports removed
- `catch(e)` → `catch {}` where `e` was already unused
- `void` expressions have no side effects
- Array destructuring alignment preserved (critical fix in `dashboard.service.ts`)
- No schema changes, no query changes, no auth changes, no business logic changes

## Deferred

- 152 `@typescript-eslint/no-unsafe-argument` warnings — mostly in controllers/test files (`as any` patterns). Requires type assertion changes.
- Frontend lint/typecheck issues are pre-existing and out of scope.
