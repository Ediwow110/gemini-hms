# NurseTriageQueuePage "Broadcast Emergency Alert" Dead Action Disable — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable the "Broadcast Emergency Alert" button in `NurseSpecimenQueuePage.tsx` (clinical emergency escalation) because the underlying `handleEscalate` function is a silent no-op (no backend endpoint exists, just `setPriority(1)` and a fake `alert()`). This is the most dangerous fake-success UI in the codebase — a nurse who clicks it in a real emergency will believe the alert was sent to the ER Charge Nurse and Physician when it wasn't. The page has no sandbox banner to mitigate the truth gap.

**Architecture:** Surgical frontend-only fix. Disable the button, remove the `onClick` handler, add an explanatory `title` attribute that documents the lack of backend support, add a `data-testid` for testability. Follow the established pattern from `753d54f` (LabOrdersPage "Print Barcodes" disable) and `bda752f` (EMR "Cache Notes" dead button removal).

**Tech Stack:** React, vitest, @testing-library/react, TypeScript

## Global Constraints

- One lane only. Do not touch other pages, other alerts, or backend services.
- Do not amend prior commits.
- Local only. No push, no PR.
- Keep tracked tree clean (only the 2 intended files + the plan doc).
- TDD: failing test first, then implementation.
- Do NOT add a sandbox banner to the page (scope creep; surgical fix only).
- Do NOT change the "Broadcast Emergency Alert" button label (it should remain as a visible disabled control to document the intended workflow).
- Do NOT remove the `handleEscalate` function or its state (out of scope; only disable the button and remove the `onClick`).
- Follow existing pattern: `disabled` + `data-testid` + `title` + muted styling (matches `753d54f` LabOrdersPage exactly).

---

## Task 1: RED — Write failing tests for the disabled "Broadcast Emergency Alert" button

**Files:**
- Modify: `hms-frontend/src/portals/nurse/__tests__/NurseTriageQueuePage.test.tsx`

**Step 1: Read the existing test patterns**

Already read. The file uses `MemoryRouter` + `QueryClientProvider` wrapper, mocks `apiClient.{get,post}` and `useUser`. The test file has 11 tests covering: successful submission, 403 error, disabled submit on invalid form, Mark Error visibility, Mark Error disabled when reason empty, historical triage display, correction API call, 403 on correction, network error on correction, no mock fallback after correction.

**Step 2: Add 2 new tests at the end of the `describe` block**

Append these tests after the last test in the file:

```tsx
  it('disables the "Broadcast Emergency Alert" button because no emergency broadcast endpoint exists', async () => {
    setupGetMock();

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    const broadcastBtn = screen.getByText(/Broadcast Emergency Alert/);
    expect(broadcastBtn).toBeDisabled();
  });

  it('shows an explanatory title on the disabled "Broadcast Emergency Alert" button', async () => {
    setupGetMock();

    render(<NurseTriageQueuePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    const broadcastBtn = screen.getByText(/Broadcast Emergency Alert/);
    expect(broadcastBtn).toHaveAttribute('title', expect.stringMatching(/not.*wired|not.*available|not.*integrated|disabled|endpoint/i));
  });
```

**Step 3: Run the tests to confirm RED**

Run: `cd hms-frontend && npx vitest run src/portals/nurse/__tests__/NurseTriageQueuePage.test.tsx`
Expected:
- The 2 new tests FAIL.
- The existing 11 tests should still pass.
- "disables the Broadcast Emergency Alert button" — FAILS because the button is currently enabled
- "shows an explanatory title" — FAILS because the button currently has no `title` attribute

**Step 4: Implement the fix**

**Files:**
- Modify: `hms-frontend/src/portals/nurse/NurseTriageQueuePage.tsx`

Find the "Broadcast Emergency Alert" button (around line 122-130):

```tsx
        <button
          type="button"
          onClick={handleEscalate}
          className="px-3 py-1.5 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold flex items-center gap-1.5 rounded-lg transition-colors"
        >
          <ShieldAlert className="h-3.5 w-3.5" /> Broadcast Emergency Alert
        </button>
```

Replace with:

```tsx
        <button
          type="button"
          disabled
          data-testid="nursetriage-broadcast-emergency-alert-disabled"
          title="Disabled: emergency broadcast is not yet wired to a backend endpoint. Use direct ER Charge Nurse communication for now."
          className="px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60 text-[11px] font-bold flex items-center gap-1.5 rounded-lg"
        >
          <ShieldAlert className="h-3.5 w-3.5" /> Broadcast Emergency Alert
        </button>
```

Changes:
- Added `disabled` attribute
- Added `data-testid="nursetriage-broadcast-emergency-alert-disabled"`
- Added `title` attribute explaining the limitation
- Removed `onClick={handleEscalate}`
- Changed styling: `border-slate-200 bg-slate-50 text-slate-400` (muted), `cursor-not-allowed opacity-60`
- Removed `hover:bg-rose-100` and `transition-colors` (no hover effect when disabled)
- Button label unchanged

**Step 5: Run the tests to confirm GREEN**

Run: `cd hms-frontend && npx vitest run src/portals/nurse/__tests__/NurseTriageQueuePage.test.tsx`
Expected: All 13 tests PASS (11 existing + 2 new).

---

## Task 2: Validate

**Step 1: Run the full frontend suite**

Run: `cd hms-frontend && npx vitest run`
Expected: All tests pass. Baseline was 85 files / 485 tests. After this fix, expected 85 files / 487 tests (no new file, +2 tests, 0 regressions).

**Step 2: Run lint**

Run: `cd hms-frontend && npx eslint src/portals/nurse/NurseTriageQueuePage.tsx src/portals/nurse/__tests__/NurseTriageQueuePage.test.tsx`
Expected: 0 errors

**Step 3: Run typecheck**

Run: `cd hms-frontend && npm run typecheck`
Expected: exit 0

**Step 4: Run git diff --check**

Run: `cd hms-frontend && cd .. && git diff --check`
Expected: clean

---

## Task 3: Commit

**Step 1: Stage the 2 files**

```bash
cd /d/D/Vscode/hms-login-OFFICIAL
git add hms-frontend/src/portals/nurse/NurseTriageQueuePage.tsx \
        hms-frontend/src/portals/nurse/__tests__/NurseTriageQueuePage.test.tsx
```

**Step 2: Commit with descriptive message**

```bash
git commit -m "fix(frontend): disable dead broadcast emergency alert action in nurse triage"
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

- **Spec coverage**: ✓ Disable button. ✓ Add `title` attribute. ✓ Add `data-testid`. ✓ 2 new tests. ✓ No broadening into other pages or other alerts.
- **Placeholder scan**: No TODOs, no "implement later", no "similar to Task N".
- **Type consistency**: No new types or signatures. Uses existing `ShieldAlert` icon (already imported).
- **Narrow scope**: 2 files only. No backend changes. No new dependencies. No new pages.
- **No duplicate work**: This lane is distinct from prior `753d54f` (LabOrdersPage "Print Barcodes") and `bda752f` (EMR "Cache Notes") — different page, different button, different file.
- **Pattern consistency**: Follows the exact pattern from `753d54f` LabOrdersPage: `disabled` + `data-testid` + `title` + muted styling. Minimal cognitive load for future maintainers.
- **Honesty**: The `title` attribute explicitly states "not yet wired to a backend endpoint" — no false claims about future availability.
- **No sandbox banner added**: Scope is surgical; adding a page-level banner would be scope creep.
- **`handleEscalate` function preserved**: Out of scope; future lane could remove it if desired.
- **Button label preserved**: "Broadcast Emergency Alert" remains visible as a disabled control to document the intended workflow.
