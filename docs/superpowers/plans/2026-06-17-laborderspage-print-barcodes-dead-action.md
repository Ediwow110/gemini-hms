# LabOrdersPage "Print Barcodes" Dead-Action Removal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable the "Print Barcodes" button in `hms-frontend/src/portals/lab/LabOrdersPage.tsx` so it cannot be clicked to produce a fake-success `alert('Printing clinical barcode labels...')` message. The button has no backend support; the alert is fake success in a clinical workflow (specimen chain-of-custody). Add an explanatory `title` attribute and a `data-testid` hook, then write a test asserting the button is disabled.

**Architecture:** Surgical bug fix. Pure frontend. No backend changes. No new dependencies. No new files (except adding 2 tests to the existing `LabOrdersPage.test.tsx`). The rest of the page is real (live hooks, real mutation, real modal flow, real navigation). The fix is to:
1. Disable the "Print Barcodes" button.
2. Add a `title` attribute explaining why it is disabled.
3. Add a `data-testid` for testability.
4. Add 2 tests: button is disabled; button has the explanatory title.

**Tech Stack:** React, vitest, @testing-library/react, TypeScript

## Global Constraints

- One lane only. Do not touch other pages, other dead actions in LabOrdersPage, or backend services.
- Do not amend prior commits.
- Local only. No push, no PR.
- Keep tracked tree clean (only the 2 intended files + the plan doc).
- TDD: failing test first, then implementation.
- Hard constraint #5: no fake-success UI. Hard constraint #6: if backend-blocked, harden honestly.
- The "Cannot receive: No patient context found" alert at line 389 is a LEGITIMATE error message after a real failed lookup — DO NOT touch it.
- The page's existing "LIS Intake Workspace (Real — Partial)" banner already provides general honesty context. Adding a per-button `title` attribute is the minimum needed for the specific dead action.

---

## Task 1: RED — Write failing tests asserting the disabled button

**Files:**
- Modify: `hms-frontend/src/portals/lab/__tests__/LabOrdersPage.test.tsx`

**Step 1: Read the existing test patterns**

Already read. The file uses `MemoryRouter` + `vi.mock('../../../hooks/use-clinical-workflow')` and sets `mockSearchParamsValue = new URLSearchParams('patientId=queue-1')` to select an order. The 8th test (`'displays order detail panel with enriched demographics when patientId is in search params'`) already verifies that the order detail panel renders and the "Receive Specimen" button is present for the "Ordered" status.

**Step 2: Add 2 new tests at the end of the `describe` block**

Append these tests after the last test in the file:

```tsx
  it('disables the "Print Barcodes" button because barcode printing is not yet wired', () => {
    mockSearchParamsValue = new URLSearchParams('patientId=queue-1');

    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    const printButton = screen.getByTestId('laborders-print-barcodes-disabled');
    expect(printButton).toBeDisabled();
  });

  it('shows an explanatory title on the disabled "Print Barcodes" button', () => {
    mockSearchParamsValue = new URLSearchParams('patientId=queue-1');

    render(
      <MemoryRouter>
        <LabOrdersPage />
      </MemoryRouter>
    );

    const printButton = screen.getByTestId('laborders-print-barcodes-disabled');
    expect(printButton).toHaveAttribute(
      'title',
      expect.stringMatching(/not yet wired|not available|not yet integrated|disabled/i)
    );
  });
```

**Step 3: Run the tests to confirm RED**

Run: `cd hms-frontend && npx vitest run src/portals/lab/__tests__/LabOrdersPage.test.tsx`
Expected: The 2 new tests FAIL. The existing 10 tests should still pass.
- "disables the 'Print Barcodes' button" — FAILS because the button is currently enabled (no `disabled` attribute)
- "shows an explanatory title" — FAILS because the button has no `title` attribute and no `data-testid`

---

## Task 2: GREEN — Disable the button and add the testid/title

**Files:**
- Modify: `hms-frontend/src/portals/lab/LabOrdersPage.tsx` (lines 374-381)

**Step 1: Replace the button block**

Find this block (lines 374-381):

```tsx
                    <button
                      onClick={() => alert('Printing clinical barcode labels...')}
                      className="btn bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black px-5 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Printer className="h-4 w-4" /> Print Barcodes
                    </button>
```

Replace with:

```tsx
                    <button
                      disabled
                      data-testid="laborders-print-barcodes-disabled"
                      title="Disabled: clinical barcode printing is not yet integrated. Use the specimen accessioning flow for now."
                      className="btn bg-slate-50 border border-slate-200 text-slate-400 text-xs font-black px-5 py-3 rounded-xl flex items-center gap-2 cursor-not-allowed opacity-60"
                    >
                      <Printer className="h-4 w-4" /> Print Barcodes
                    </button>
```

Key changes:
- Added `disabled` attribute — the button cannot be clicked.
- Added `data-testid="laborders-print-barcodes-disabled"` — stable hook for tests.
- Added `title="Disabled: clinical barcode printing is not yet integrated. Use the specimen accessioning flow for now."` — explains why the button is disabled, points the user to the real alternative.
- Removed `onClick` handler — no more fake success alert.
- Changed styling: removed `hover:bg-slate-50`, added `cursor-not-allowed opacity-60`, muted text color from `text-slate-700` to `text-slate-400` — visually communicates the button is disabled.
- Removed `transition-all` and `shadow-sm` — disabled buttons don't need them.

**Step 2: Run the tests to confirm GREEN**

Run: `cd hms-frontend && npx vitest run src/portals/lab/__tests__/LabOrdersPage.test.tsx`
Expected: All 12 tests PASS (10 existing + 2 new).

---

## Task 3: Validate

**Step 1: Run the full frontend suite**

Run: `cd hms-frontend && npx vitest run`
Expected: All tests pass. Baseline was 85 files / 481 tests. After this fix, expected 85 files / 483 tests (no new file, +2 tests, 0 regressions).

**Step 2: Run lint**

Run: `cd hms-frontend && npx eslint src/portals/lab/LabOrdersPage.tsx src/portals/lab/__tests__/LabOrdersPage.test.tsx`
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
cd /d/D/Vscode/hms-login-OFFICIAL
git add hms-frontend/src/portals/lab/LabOrdersPage.tsx \
        hms-frontend/src/portals/lab/__tests__/LabOrdersPage.test.tsx
```

**Step 2: Commit with descriptive message**

```bash
git commit -m "fix(frontend): disable dead print barcodes action in lab orders page"
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

- **Spec coverage**: ✓ Button disabled. ✓ Tool title explains why. ✓ data-testid for tests. ✓ 2 new tests. ✓ No broadening into other pages or other dead actions.
- **Placeholder scan**: No TODOs, no "implement later", no "similar to Task N".
- **Type consistency**: No new types or signatures.
- **Narrow scope**: 2 files only. No backend changes. No new dependencies. Follows the pattern from `df61a93` (UserList hardening) and `bda752f` (EMR Cache Notes removal).
- **Preserves legitimate behavior**: The "Cannot receive: No patient context found" alert at line 389 is a real validation error after a real failed lookup and is NOT touched.
