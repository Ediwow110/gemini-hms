# EMR "Cache Notes" Dead Button Removal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the misleading "Cache Notes" dead button from `hms-frontend/src/features/emr/EMRWorkspace.tsx` (line 518) and update the existing test that codifies the bug. The button does nothing (notes are already in local state from typing), but its onClick shows an alert that says "Notes updated in local workspace" — implying the button updated them. This is a misleading save flow in a clinical context (patient safety risk) and a direct violation of hard constraint #5.

**Architecture:** Pure frontend surgical fix. No backend changes. No new dependencies. The SOAP notes textareas already update local state via `onChange`. The "Finalize & Close" button already saves to the database. The "Cache Notes" button is redundant and misleading.

**Tech Stack:** React, vitest, @testing-library/react, TypeScript

## Global Constraints

- One lane only. Do not broaden into other EMR issues.
- Do not amend prior commits.
- Local only. No push, no PR.
- Keep tracked tree clean (only the 2 intended files + the plan doc).
- TDD: failing test first, then implementation.
- Hard constraint #5: no misleading save flows.

---

## Task 1: RED — Update the misleading test to assert the button is NOT present

**Files:**
- Modify: `hms-frontend/src/features/emr/__tests__/EMRWorkspace.test.tsx:166-177`

**Step 1: Read the current test**

The current test is titled `'shows truthful alert for SOAP notes caching'` and asserts the misleading alert is called. This is a test illusion bug (it codifies the bug).

**Step 2: Replace the misleading test with a correct one**

Replace lines 166-177 with:

```tsx
it('does NOT render the dead "Cache Notes" button (misleading save flow)', async () => {
  renderWithAuth(<EMRWorkspace />);
  const patientBtn = await screen.findByText(/John Doe/i);
  fireEvent.click(patientBtn);

  // Switch to SOAP tab
  fireEvent.click(screen.getByText(/SOAP Notes/i));

  // The "Cache Notes" button is dead: it does nothing (notes are already in
  // local state from typing) but its alert claims "Notes updated in local
  // workspace" — a misleading save flow. It must not be rendered.
  expect(screen.queryByRole('button', { name: /cache notes/i })).not.toBeInTheDocument();
});
```

**Step 3: Run the test to confirm RED**

Run: `cd hms-frontend && npx vitest run src/features/emr/__tests__/EMRWorkspace.test.tsx`
Expected: FAIL with "Unable to find a button with the name 'Cache Notes'" (because the button is still present)

---

## Task 2: GREEN — Remove the dead "Cache Notes" button

**Files:**
- Modify: `hms-frontend/src/features/emr/EMRWorkspace.tsx` (remove the button block around line 518)

**Step 1: Remove the button block**

In `EMRWorkspace.tsx`, remove this block (approximately lines 516-522):

```tsx
                     {!isLocked && (
                       <button 
                         onClick={() => alert("Notes updated in local workspace. Please finalize the encounter to persist changes to the database.")} 
                         className="btn btn-primary text-xs py-2 bg-indigo-600 text-white"
                       >
                         Cache Notes
                       </button>
                     )}
```

The SOAP notes textareas already update local state via `onChange` (see `setSoapNotes` calls). The "Finalize & Close" button already saves to the database via `apiClient.patch`. The "Cache Notes" button is redundant and misleading.

**Step 2: Run the test to confirm GREEN**

Run: `cd hms-frontend && npx vitest run src/features/emr/__tests__/EMRWorkspace.test.tsx`
Expected: PASS (all 5 tests pass)

---

## Task 3: Validate

**Step 1: Run the full frontend suite**

Run: `cd hms-frontend && npx vitest run`
Expected: All tests pass (baseline 84 files / 477 tests; should be 84 files / 477 tests after this fix — no new files, no test count change)

**Step 2: Run lint**

Run: `cd hms-frontend && npx eslint src/features/emr/EMRWorkspace.tsx src/features/emr/__tests__/EMRWorkspace.test.tsx`
Expected: 0 errors

**Step 3: Run typecheck**

Run: `cd hms-frontend && npm run typecheck`
Expected: exit 0

**Step 4: Run git diff --check**

Run: `cd hms-frontend && cd .. && git diff --check`
Expected: clean

---

## Task 4: Commit

**Step 1: Stage the 2 files**

```bash
cd hms-frontend
git add ../hms-frontend/src/features/emr/EMRWorkspace.tsx \
        hms-frontend/src/features/emr/__tests__/EMRWorkspace.test.tsx
```

Note: paths are relative to workspace root. Adjust if needed.

**Step 2: Commit with descriptive message**

```bash
git commit -m "fix(frontend): remove misleading cache notes button in emr workspace"
```

Expected: 1 commit on `remediation/production-readiness-lane-2`, 2 files changed.

**Step 3: Verify the commit**

```bash
git log --oneline -n 3
git status
```

Expected: new commit at HEAD, tracked tree clean (except intentional untracked plan docs).

---

## Self-Review

- **Spec coverage**: ✓ Removes the dead button (the bug). ✓ Updates the misleading test (the regression net). ✓ No broadening into other EMR issues.
- **Placeholder scan**: No TODOs, no "implement later", no "similar to Task N".
- **Type consistency**: No new types or signatures. Pure JSX removal + test rewrite.
- **Narrow scope**: 2 files only. No backend changes. No new dependencies.
