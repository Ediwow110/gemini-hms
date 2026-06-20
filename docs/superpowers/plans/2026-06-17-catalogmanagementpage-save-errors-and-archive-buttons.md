# CatalogManagementPage — Fix Silent Save Failures and Dead Archive Actions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the dead Archive buttons (no service method, no onClick, no backend endpoint) and add visible error feedback to the save handlers (currently `console.error` only — silent fake-success). One file, narrow scope, honesty-hardening on a live-API page.

**Architecture:** Pure UI fix on `hms-frontend/src/portals/admin/CatalogManagementPage.tsx`. No backend changes. No new dependencies. No new files outside the component and its existing test file.

**Tech Stack:** React 19, TypeScript, vitest + @testing-library/react, lucide-react.

## Global Constraints

- Frontend-only. Exactly two files:
  - `hms-frontend/src/portals/admin/CatalogManagementPage.tsx` (modify)
  - `hms-frontend/src/portals/admin/__tests__/CatalogManagementPage.test.tsx` (extend)
- No backend edits. No new API calls. No new dependencies.
- Do NOT wire an Archive flow. The Edit modal already toggles `isActive` (same effect).
- Do NOT close the save modal on error — keep it open so the user sees the error and can retry.
- Do NOT add a separate "archive" service method or confirmation dialog (scope creep).
- TDD: write the failing test first, verify RED, then implement GREEN.
- Validation gates: `npx vitest run` (focused), `npx vitest run` (full), `npx eslint <files>`, `npm run typecheck`, `git diff --check`. Local only.
- Commit locally with message `fix(frontend): surface catalog save errors and remove dead archive buttons`.
- Do not amend prior commits.

---

### Task 1: Write the failing test (RED)

**Files:**
- Modify: `hms-frontend/src/portals/admin/__tests__/CatalogManagementPage.test.tsx`

**Test contract additions:**
1. When `catalogService.createItem` rejects, the form submission shows a visible error message in the modal and the modal stays open.
2. The page does not contain any "Archive" icon button (post-fix, the buttons are removed).

**Step 1.1:** Add a new `describe` block (or append to the existing one) for save-error feedback.

Required imports additions at the top of the test file:
- `import userEvent from '@testing-library/user-event';` (if not already imported — use whatever the project pattern is; otherwise use `fireEvent` from `@testing-library/react`)
- `import { catalogService } from '../../../services/catalog.service';` (will be mocked)

Required mock at the top of the test file (add to the existing `vi.mock` chain):
```tsx
vi.mock('../../../services/catalog.service', () => ({
  catalogService: {
    getCategories: vi.fn(),
    getItems: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
  },
}));
```

Inside a new `describe('CatalogManagementPage save error feedback', () => {})` block:
- Set up: mock `useCatalogCategories` and `useCatalogItems` to return real-looking data, mock `useInvalidateCatalog` to return `vi.fn()`, mock `catalogService.createItem` to reject with `new Error('Backend rejected: missing required field')`.
- Render the page in the standard `wrapper`.
- Click the "New Item" button.
- Fill in the form fields (Code, Category, Name, Description, isActive).
- Submit the form.
- Assert: the error message text `'Backend rejected: missing required field'` is now in the document.
- Assert: the modal title "Add New Item / Service" is still in the document (modal did not close).

**Step 1.2:** Add a second test in the same block that asserts the page does not render any Archive buttons (post-fix).
- Render with mock data (categories + items present).
- Assert: no button matching the Archive icon is present. The simplest assertion is `expect(screen.queryByRole('button', { name: /archive/i })).toBeNull();`. If the buttons have no accessible name, fall back to a count assertion: the items row should contain exactly one action button (Edit), not two.

**Step 1.3:** Run the test to confirm RED.
- Command: `cd hms-frontend && npx vitest run src/portals/admin/__tests__/CatalogManagementPage.test.tsx`
- Expected: the new save-error test FAILS (no error message rendered; modal closes silently on error). The new archive-absence test PASSES (Archive buttons exist with no onClick, so they ARE currently in the document — so this test will only pass AFTER the fix).

---

### Task 2: Implement the fix (GREEN)

**Files:**
- Modify: `hms-frontend/src/portals/admin/CatalogManagementPage.tsx`

**Step 2.1:** Remove the unused `Archive` icon from the lucide-react import.
- Old: `import {\n  Plus,\n  Search,\n  Edit2,\n  Archive,\n  CheckCircle2,\n  XCircle,\n  AlertCircle,\n  ChevronRight,\n  Package,\n  Layers,\n} from 'lucide-react';`
- New: remove the `Archive,` line.

**Step 2.2:** Add two new state slots for save errors.
- Add to the state declarations:
  - `const [itemError, setItemError] = useState<string | null>(null);`
  - `const [categoryError, setCategoryError] = useState<string | null>(null);`

**Step 2.3:** Reset errors when the modals open.
- In `openItemModal`, at the end (before `setShowModal('item');`), add `setItemError(null);`.
- In `openCategoryModal`, at the end (before `setShowModal('category');`), add `setCategoryError(null);`.

**Step 2.4:** Rewrite `handleSaveItem` to surface errors and keep the modal open on failure.
- Old:
  ```tsx
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await catalogService.updateItem(editingId, itemForm);
      } else {
        await catalogService.createItem(itemForm);
      }
      setShowModal(null);
      setEditingId(null);
      invalidateCatalog();
    } catch (err) {
      console.error('Failed to save item:', err);
    }
  };
  ```
- New:
  ```tsx
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemError(null);
    try {
      if (editingId) {
        await catalogService.updateItem(editingId, itemForm);
      } else {
        await catalogService.createItem(itemForm);
      }
      setShowModal(null);
      setEditingId(null);
      invalidateCatalog();
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to save item. Please try again.';
      setItemError(message);
    }
  };
  ```

**Step 2.5:** Rewrite `handleSaveCategory` to surface errors and keep the modal open on failure.
- Apply the same pattern as `handleSaveItem` but with `setCategoryError` and `'Failed to save category.'` fallback.

**Step 2.6:** Add the error banner inside the Item modal (just above the submit button, below the form fields). Use the same rose-50/rose-200 styling pattern as the existing error state.
- Insert this JSX inside the Item modal `<form>`, immediately after the active checkbox div and before the submit button div:
  ```tsx
  {itemError && (
    <div
      role="alert"
      data-testid="catalog-item-error"
      className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800"
    >
      <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-black text-[10px] uppercase tracking-widest">Save failed</p>
        <p className="mt-0.5 leading-relaxed">{itemError}</p>
      </div>
    </div>
  )}
  ```

**Step 2.7:** Add the error banner inside the Category modal (same pattern as Step 2.6 but for `categoryError` with `data-testid="catalog-category-error"`).

**Step 2.8:** Remove the dead Archive button from the items table row.
- Old (around line 308-310):
  ```tsx
  <button
    onClick={() => openItemModal(item)}
    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
  >
    <Edit2 className="h-4 w-4" />
  </button>
  <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
    <Archive className="h-4 w-4" />
  </button>
  ```
- New: keep only the Edit button. Delete the second `<button>` (the Archive one).

**Step 2.9:** Remove the dead Archive button from the categories table row (around line 343-345).
- Apply the same pattern as Step 2.8.

**Step 2.10:** Run the test to confirm GREEN.
- Command: `cd hms-frontend && npx vitest run src/portals/admin/__tests__/CatalogManagementPage.test.tsx`
- Expected: all 6 tests pass (4 existing + 2 new).

---

### Task 3: Validate

**Step 3.1:** Run focused test.
- Command: `cd hms-frontend && npx vitest run src/portals/admin/__tests__/CatalogManagementPage.test.tsx`
- Expected: 6/6 pass.

**Step 3.2:** Run full frontend test suite.
- Command: `cd hms-frontend && npx vitest run`
- Expected: 84 files (was 83), 470 tests (was 468), 0 new failures.

**Step 3.3:** Lint the touched file.
- Command: `cd hms-frontend && npx eslint src/portals/admin/CatalogManagementPage.tsx src/portals/admin/__tests__/CatalogManagementPage.test.tsx`
- Expected: 0 errors.

**Step 3.4:** Typecheck.
- Command: `cd hms-frontend && npm run typecheck`
- Expected: exit 0.

**Step 3.5:** `git diff --check`.
- Command: `git diff --check`
- Expected: clean (or only the standard CRLF/LF informational notice).

---

### Task 4: Senior review (self)

- Issue was real: live-API page with dead Archive buttons + silent error swallowing (fake success).
- Fix is narrow: 1 file modified, 1 test file extended. No new files, no new dependencies, no scope expansion.
- Silent-failure problem is removed: error message renders in the modal; modal stays open so user can retry.
- Dead-button problem is removed: Archive buttons are deleted; same effect achievable via Edit modal's Active checkbox.
- No regressions expected: full suite goes 83/468 → 84/470. +1 file, +2 tests, 0 regressions.
- Tracked tree will be clean after commit (only the 2 untracked plan docs and 1 new untracked plan doc remain).
- Local commit justified.

---

### Task 5: Commit (local only)

**Step 5.1:** Stage only the two files.
- `git add hms-frontend/src/portals/admin/CatalogManagementPage.tsx hms-frontend/src/portals/admin/__tests__/CatalogManagementPage.test.tsx`

**Step 5.2:** Commit locally.
- `git commit -m "fix(frontend): surface catalog save errors and remove dead archive buttons"`

**Step 5.3:** Verify.
- `git log --oneline -n 3` shows new commit.
- `git status` shows only the 3 untracked plan docs.

---

## Non-Goals (do not do these in this lane)

- Do NOT wire an Archive flow (confirmation dialog, separate service method, etc.).
- Do NOT add new admin pages, redesign the catalog table, or change the data shape.
- Do NOT modify any other file outside `CatalogManagementPage.tsx` and its existing test file.
- Do NOT change the Edit modal's "Active" checkbox behavior.
- Do NOT add a toast/notification system.
- Do NOT push or open a PR.
- Do NOT amend previous commits.

## Required Validation Evidence (before declaring done)

- `npx vitest run src/portals/admin/__tests__/CatalogManagementPage.test.tsx` → 6/6 pass
- `npx vitest run` → 84 files / 470 tests pass, 0 new failures
- `npx eslint <touched files>` → 0 errors
- `npm run typecheck` → exit 0
- `git diff --check` → clean
- `git status` → 3 untracked plan docs only
- `git log --oneline -n 1` → new commit
