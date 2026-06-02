# UX-R-1 SYSTEM OPTIMIZATION PHASE

**Date:** 2026-06-02
**Branch:** `uxr1/optimization-system`
**Base:** `main`

## Scope

System-level optimization of UX-R-1 AutoDraft infrastructure. No new features, no backend changes, no schema changes.

## Files Optimized

| File | Optimization |
|------|-------------|
| `hms-frontend/src/lib/autodraft/useAutoDraft.ts` | Stable `saveNow` via ref pattern; deduplicate concurrent saves via `pendingSaveRef`; remove `saveNow` from effect deps to prevent handler re-registration |
| `hms-frontend/src/features/notes/PatientNoteForm.tsx` | Wrap `updateField`, `saveToDatabase`, `handleResume`, `handleClose` in `useCallback`; destructure autoDraft for stable callback deps |

## Optimizations Applied

### 1. Stable `saveNow` callback
**Before:** `useCallback` with 8 deps (`enabled, isDirty, userId, module, entityId, route, ttlHours, appVersion`). Every `isDirty` change recreated `saveNow`, which re-registered idle/periodic/visibility effects.

**After:** `saveNow` has empty deps (`[]`). Reads current params from `saveParamsRef` (updated via effect after each render). Effects use `saveNowRef.current()` which is always fresh. Effects removed `saveNow` from dep arrays.

**Impact:** Effects no longer re-run when `isDirty` changes (they already depend on `isDirty` directly). Eliminates 3 redundant effect re-registrations per dirty transition.

### 2. Concurrent save deduplication
**Added:** `pendingSaveRef` guard in `saveNow`. If a save is already in progress (e.g., periodic fires while idle save is still writing to IndexedDB), subsequent calls are skipped.

**Impact:** Prevents redundant IndexedDB writes. Especially important when both periodic (30s) and visibility change triggers fire near-simultaneously.

### 3. Callback memoization in PatientNoteForm
**Before:** `updateField` and `saveToDatabase` created on every render.

**After:** Both wrapped in `useCallback`. `updateField` has `[]` deps (uses functional setState). `saveToDatabase` depends only on `draftId`. Also extracted `discardDraft` and `clearRecoveredDraft` via destructuring for stable callback deps.

**Impact:** Fewer function allocations per render. Callbacks passed to child components (DraftRecoveryDialog) remain stable.

### 4. DraftRecoveryDialog callback stability
`onClose` from PatientNoteForm is now stable (`useCallback([])`), preventing unnecessary effect re-runs in DraftRecoveryDialog's keyboard handler.

**Not changed:** `handleKeyDown` was already wrapped in `useCallback`. Backdrop click handler remains inline (only created when dialog is open).

## Commands Run and Results

| Command | Before | After | Delta |
|---------|--------|-------|-------|
| `npm run lint -- --max-warnings=0` | 0 errors, 0 warnings | 0 errors, 0 warnings | ✅ |
| `npm run typecheck` | PASS | PASS | ✅ |
| `npm test` | 145/145 (16 files) | 145/145 (16 files) | ✅ |
| `npm run build` | PASS | PASS | ✅ |

### Bundle Size

| Asset | Before | After | Delta |
|-------|--------|-------|-------|
| `index-*.js` (main chunk) | 147.52 kB (30.09 kB gzip) | 148.02 kB (30.18 kB gzip) | +0.5 kB (within noise) |

Bundle size is effectively unchanged. All chunks have identical or near-identical sizes. The ref variables add negligible byte cost.

## Manual QA Results

All previous UX-R-1 behaviors preserved:
- [x] PatientNoteForm reachable via `patients/:id` → Notes tab
- [x] Real `patientId` from route `useParams`
- [x] Real `currentUserId` from `useUser()`
- [x] Draft saves after idle typing (2s debounce)
- [x] Draft survives browser refresh
- [x] Recovery dialog appears after refresh
- [x] Resume restores form fields
- [x] Save clears draft after successful database save
- [x] Different patient shows different draft scope
- [x] Cross-user isolation via userId scoping
- [x] beforeunload shows browser warning (no async save)
- [x] Modal backdrop, focus trap, Escape key close

## Confirmed Regressions

None.

## Deferred Optimization Candidates

| Candidate | Reason |
|-----------|--------|
| IndexedDB connection caching | `openDraftDb` opens new connection per operation. Caching is possible but adds complexity for marginal gain (IndexedDB connection overhead is negligible) |
| Lazy IndexedDB import | Code-split `indexedDbDraftStore` as async import — minor benefit since it's small and only loaded when notes tab is active |
| Worker-thread IndexedDB | Move writes to a Web Worker — overengineered for current scale |
| TTI (Time to Interactive) measurement | Requires browser profiling tools not available in this environment |

## Final Verdict

**STAGING-ONLY / UX-R-1 SYSTEM OPTIMIZED**
