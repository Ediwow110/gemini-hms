## Summary

- Optimizes UX-R-4 appointment AutoDraft lifecycle behavior.
- Combines visibilitychange and beforeunload handling into a stable effect using ref-based dirty checks.
- Prevents event listeners from being re-added on every keystroke.
- Merges redundant ref-update effects.
- Removes redundant NursePatientIntakePage mount effect where initial state was already correct.
- Adds UX-R-4 system optimization evidence.

## Scope

- UX-R-4 appointment AutoDraft optimization only.
- No new features.
- No new AutoDraft modules.
- No backend changes.
- No schema or migration changes.
- No deployment changes.
- No new dependencies.
- No production-readiness claim.
- No HIPAA claim.
- No SOC 2 claim.

## Verification

- `npm run lint`: 0 errors
- `npm run typecheck`: 0 errors
- `npm test`: 181/181 passed, 19 files
- `npm run build`: clean
- Bundle size: unchanged, 148 kB
- `git diff --check`: clean

## Optimization Details

- `useAutoDraft.ts`
  - Combined visibilitychange and beforeunload into one stable effect.
  - Added ref-based dirty check.
  - Reduced listener churn.
  - Merged three ref-update effects into one.
  - Net reduction: approximately 27 lines.

- `NursePatientIntakePage.tsx`
  - Removed redundant mount effect that set recovery state to its existing initial value.
  - Removed unused useEffect import.
  - Eliminates one extra mount render.

## Deferred Candidates

- IndexedDB connection caching deferred because current fake-indexeddb tests make the change higher-risk.
- Other-module redundant effects are out of UX-R-4 scope.
- Additional candidates documented in `docs/evidence/uxr4-system-optimization.md`.

## Verdict

STAGING-ONLY / UX-R-4 SYSTEM OPTIMIZED
