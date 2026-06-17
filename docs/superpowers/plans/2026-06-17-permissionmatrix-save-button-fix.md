# PermissionMatrix Dead Save Action — Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable the dead "Save Role Permissions" button on the RBAC PermissionMatrix page so admins cannot mistake a no-op UI click for a real persisted save. Match the `ClaimsDashboard.tsx` "disabled button + global read-only notice" pattern.

**Architecture:** Pure UI fix on a single component. No backend changes. No new API calls. No new dependencies. Removes the dead click handler, dead state, and dead toast block now that the button is neutralized.

**Tech Stack:** React 19, TypeScript, vitest + @testing-library/react, Tailwind utility classes, lucide-react.

## Global Constraints

- Frontend-only change. Two files touched:
  - `hms-frontend/src/portals/admin/components/PermissionMatrix.tsx` (modify)
  - `hms-frontend/src/portals/admin/components/__tests__/PermissionMatrix.test.tsx` (create)
- No backend edits. No new API calls. No new dependencies.
- Do NOT wire actual permission mutation calls. That is a separate, larger lane.
- Do NOT touch `RolesPermissionsPage.tsx`, `admin.service.ts`, the backend, or any other file.
- TDD: write failing test first, verify it fails, then implement.
- Validation gates: `npx vitest run` (focused), `npm run lint`, `npm run typecheck`. Local only — do not push.
- Commit locally with message `fix(frontend): disable dead save action on permission matrix`.
- Do not amend prior commits.

---

### Task 1: Write the failing test (RED)

**Files:**
- Create: `hms-frontend/src/portals/admin/components/__tests__/PermissionMatrix.test.tsx`

**Test contract:**
- Renders `<PermissionMatrix selectedRole="Super Admin" />` and asserts:
  1. The "Read-Only Display" header explanation is present (sanity).
  2. The "Save Role Permissions" button exists in the DOM.
  3. The "Save Role Permissions" button is `disabled` (the core fix).
  4. The "Permission mutations not yet wired" success-faking toast is NOT rendered on mount.

**Step 1.1:** Write the test file using the same imports and conventions as `UserAccessTable.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PermissionMatrix } from '../PermissionMatrix';

describe('PermissionMatrix honest-read-only tests', () => {
  it('renders the read-only header explaining deferred mutation wiring', () => {
    render(<PermissionMatrix selectedRole="Super Admin" />);
    expect(screen.getByText(/Read-Only Display/i)).toBeInTheDocument();
    expect(screen.getByText(/Mutation Wiring Deferred/i)).toBeInTheDocument();
  });

  it('Save Role Permissions button is disabled so it cannot imply a real save', () => {
    render(<PermissionMatrix selectedRole="Super Admin" />);
    const saveBtn = screen.getByTestId('permissionmatrix-save-button');
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveTextContent(/Save Role Permissions/);
  });

  it('does not render a fake success toast on mount', () => {
    render(<PermissionMatrix selectedRole="Super Admin" />);
    expect(
      screen.queryByText(/Permission mutations not yet wired/i),
    ).not.toBeInTheDocument();
  });
});
```

**Step 1.2:** Run the test to confirm RED.
- Command: `cd hms-frontend && npx vitest run src/portals/admin/components/__tests__/PermissionMatrix.test.tsx`
- Expected: at least the second test ("Save Role Permissions button is disabled") FAILS because the button is currently not disabled.
- The other two tests should pass in RED (header and toast absence are pre-existing conditions).

---

### Task 2: Implement the fix (GREEN)

**Files:**
- Modify: `hms-frontend/src/portals/admin/components/PermissionMatrix.tsx`

**Step 2.1:** Remove `Info` from lucide-react import (no longer needed after the toast is removed).
- Old: `import { ShieldCheck, Info } from 'lucide-react';`
- New: `import { ShieldCheck } from 'lucide-react';`

**Step 2.2:** Remove the `showSaveToast` state.
- Old:
  ```tsx
  export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ selectedRole }) => {
    const [showSaveToast, setShowSaveToast] = useState(false);
    const [matrixState, setMatrixState] = useState<Record<string, ...>>({ ... });
  ```
- New:
  ```tsx
  export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ selectedRole }) => {
    const [matrixState, setMatrixState] = useState<Record<string, ...>>({ ... });
  ```

**Step 2.3:** Remove the `handleSave` function (dead after the button is disabled).
- Delete lines 148-155:
  ```tsx
  const handleSave = () => {
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 5000);
  };
  ```

**Step 2.4:** Replace the dead Save button with a disabled button carrying `data-testid` and disabled styling.
- Old (lines 184-191):
  ```tsx
  <button 
    onClick={handleSave}
    className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
  >
    Save Role Permissions
  </button>
  ```
- New:
  ```tsx
  <button
    type="button"
    disabled
    aria-disabled="true"
    data-testid="permissionmatrix-save-button"
    title="Permission mutations are not yet wired. The role-permission matrix is read-only in this UI."
    className="btn bg-slate-200 text-slate-500 font-bold text-xs py-1.5 px-4 rounded-xl cursor-not-allowed opacity-60"
  >
    Save Role Permissions
  </button>
  ```

**Step 2.5:** Remove the conditional toast block (lines 231-244).
- Old:
  ```tsx
  {showSaveToast && (
    <div className="p-4 bg-amber-50 border border-amber-250 rounded-2xl flex gap-3 text-xs text-amber-800 animate-scale-in">
      <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
      <div>
        <h5 className="font-extrabold uppercase text-[10px] tracking-wider">Permission mutations not yet wired</h5>
        <p className="font-medium mt-0.5">
          Backend role-permission mutation endpoints exist (<code className="font-mono text-[11px]">POST /api/v1/admin/roles/:roleId/permissions</code>) but this UI is read-only. No data was sent. Role names are sourced from live API; the permission matrix below is illustrative.
        </p>
      </div>
    </div>
  )}
  ```
- New: (removed entirely; the header already says "Read-Only Display — Mutation Wiring Deferred")

**Step 2.6:** Run the test to confirm GREEN.
- Command: `cd hms-frontend && npx vitest run src/portals/admin/components/__tests__/PermissionMatrix.test.tsx`
- Expected: all 3 tests PASS.

---

### Task 3: Validate

**Step 3.1:** Run focused test.
- Command: `cd hms-frontend && npx vitest run src/portals/admin/components/__tests__/PermissionMatrix.test.tsx`
- Expected: 3/3 pass.

**Step 3.2:** Run full frontend test suite to confirm no regressions.
- Command: `cd hms-frontend && npx vitest run`
- Expected: same pass count as before + 3 new passes. No new failures.

**Step 3.3:** Run lint on the touched file.
- Command: `cd hms-frontend && npx eslint src/portals/admin/components/PermissionMatrix.tsx src/portals/admin/components/__tests__/PermissionMatrix.test.tsx`
- Expected: 0 errors.

**Step 3.4:** Run typecheck.
- Command: `cd hms-frontend && npm run typecheck`
- Expected: exit 0, 0 errors.

**Step 3.5:** Run `git diff --check`.
- Command: `git diff --check`
- Expected: clean (no whitespace/merge issues).

---

### Task 4: Senior review (self)

- Issue was real (dead primary CTA, no persistence, looks like a save).
- Fix is narrow (1 file + 1 test file, 4 logical changes).
- Dead-action trust problem is removed: button is disabled, handler removed, state removed, toast removed.
- No regressions expected: only PermissionMatrix.tsx and its test are touched. Other components import nothing from PermissionMatrix.
- Tracked tree will be clean after commit (only the 2 intentional untracked plan docs remain).
- Local commit justified.

---

### Task 5: Commit (local only)

**Step 5.1:** Stage the two files only.
- Command: `git add hms-frontend/src/portals/admin/components/PermissionMatrix.tsx hms-frontend/src/portals/admin/components/__tests__/PermissionMatrix.test.tsx`
- Verify: `git status --short` shows only these two as `M` or `A` (and the 2 untracked plan docs unchanged).

**Step 5.2:** Commit locally.
- Command: `git commit -m "fix(frontend): disable dead save action on permission matrix"`
- Verify: `git log --oneline -n 3` shows the new commit at HEAD.

**Step 5.3:** Confirm clean tree and no push.
- `git status` should show only the 2 untracked plan docs.
- DO NOT push.

---

## Non-Goals (do not do these in this lane)

- Do NOT wire actual permission mutation API calls.
- Do NOT touch `RolesPermissionsPage.tsx`, `admin.service.ts`, or the backend.
- Do NOT add new admin pages, redesign the matrix, or change role data.
- Do NOT modify any other files outside `PermissionMatrix.tsx` and its new test file.
- Do NOT add a stub for the mutation handler.
- Do NOT add `useState` for an "isOpen" modal pattern.
- Do NOT add a fake success path under any circumstances.
- Do NOT push or open a PR.

## Required Validation Evidence (before declaring done)

- `npx vitest run src/portals/admin/components/__tests__/PermissionMatrix.test.tsx` → 3/3 pass
- `npx vitest run` (full suite) → no new failures vs baseline (465 + 3 = 468 expected)
- `npx eslint <touched files>` → 0 errors
- `npm run typecheck` → exit 0
- `git diff --check` → clean
- `git status` → 2 untracked plan docs only, no modified files
- `git log --oneline -n 1` → shows new commit
