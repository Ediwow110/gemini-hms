# UserList Sandbox Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden `hms-frontend/src/features/admin/UserList.tsx` honestly so that non-Super-Admin users (who see this page instead of the live `UsersPage` via `UsersWrapper`) cannot mistake the hardcoded MOCK_USERS list and fake "25/22/1/2" metric values for real production data. Follow the exact pattern from commit `2dd3b27e` (StockReceiving sandbox hardening).

**Architecture:** Pure frontend honesty hardening. No backend changes. No new dependencies. No new files (except a test file). The page is shown to non-Super-Admin users via `UsersWrapper` (which is unchanged). The fix is to:
1. Wrap the page in `HmsDashboardShell` with `widthTier="compact"` and a footer that says `Source: Mock user list (sandbox)`.
2. Add an amber banner explaining the page is a sandbox mock with no live data.
3. Replace the 4 hardcoded `MetricCard` values ("25", "22", "1", "2") with `"—"` to indicate no real data is displayed.
4. Disable the 3 "View Profile" links (which route to fake user IDs `U001`, `U002`, `U003` that don't exist).
5. De-emphasize the table rows with a muted background to visually signal mock data.
6. Add a test file asserting the banner, footer, disabled links, and honest metric values.

**Tech Stack:** React, vitest, @testing-library/react, TypeScript

## Global Constraints

- One lane only. Do not touch `UsersWrapper.tsx`, `UsersPage.tsx`, or `UsersPage`'s tests.
- Do not amend prior commits.
- Local only. No push, no PR.
- Keep tracked tree clean (only the 2 intended files + the plan doc).
- TDD: failing test first, then implementation.
- Hard constraint #5: no mock data pretending to be real. Hard constraint #6: if backend-blocked, harden honestly.
- Follow the exact pattern from `2dd3b27e` (StockReceiving) for consistency.

---

## Task 1: RED — Write failing tests asserting the sandbox hardening

**Files:**
- Create: `hms-frontend/src/features/admin/__tests__/UserList.test.tsx`

**Step 1: Read the test patterns**

Read `hms-frontend/src/features/admin/__tests__/PatientMergeRequests.test.tsx` or `hms-frontend/src/features/admin/__tests__/AuditLogViewer.test.tsx` to understand the test conventions in this directory.

**Step 2: Create the test file**

Create `hms-frontend/src/features/admin/__tests__/UserList.test.tsx` with this content:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { UserList } from '../UserList';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('UserList Sandbox Hardening', () => {
  it('renders a sandbox banner explaining the page is a mock', () => {
    renderWithRouter(<UserList />);
    expect(
      screen.getByText(/this page is a sandbox mock/i)
    ).toBeInTheDocument();
  });

  it('shows the HmsAuditFooter with "Mock user list (sandbox)" dataSource', () => {
    renderWithRouter(<UserList />);
    expect(screen.getByText(/Source: Mock user list \(sandbox\)/i)).toBeInTheDocument();
  });

  it('does NOT display hardcoded metric values "25", "22", "1", or "2"', () => {
    renderWithRouter(<UserList />);
    expect(screen.queryByText('25')).not.toBeInTheDocument();
    expect(screen.queryByText('22')).not.toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('renders "View Profile" links as disabled (not real navigation)', () => {
    renderWithRouter(<UserList />);
    const viewProfileLinks = screen.getAllByText(/View Profile/i);
    for (const link of viewProfileLinks) {
      expect(link.closest('a')).toHaveAttribute('aria-disabled', 'true');
    }
  });
});
```

**Step 3: Run the test to confirm RED**

Run: `cd hms-frontend && npx vitest run src/features/admin/__tests__/UserList.test.tsx`
Expected: All 4 tests FAIL (no banner, no footer, hardcoded "25"/"22"/"1"/"2" are present, "View Profile" links are real `<a href>` elements)

---

## Task 2: GREEN — Harden the UserList page

**Files:**
- Modify: `hms-frontend/src/features/admin/UserList.tsx`

**Step 1: Replace the entire file with the hardened version**

Write this content to `hms-frontend/src/features/admin/UserList.tsx`:

```tsx
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui/page-header";
import { UserStatusBadge, RoleBadge } from "../../components/ui/user-badges";
import { MetricCard } from "../../components/ui/metric-card";
import { Users, UserCheck, UserX, ShieldCheck, AlertTriangle, FlaskConical } from "lucide-react";
import { HmsDashboardShell, HmsAuditFooter } from "../../components/hms-dashboard";

// NOTE: This list is shown only to non-Super-Admin users via UsersWrapper.
// Super Admin users see the live UsersPage (wired to /api/v1/admin/users).
// The names and IDs here are intentionally fake so they cannot be mistaken
// for real production data. Kept as a structural placeholder so the page
// shape is visible during local development.
const MOCK_USERS = [
  { id: "U001", name: "Maria Santos", email: "maria@hms.com", role: "Receptionist", status: "Active", branch: "Main" },
  { id: "U002", name: "Mark Santos", email: "mark@hms.com", role: "Cashier", status: "Active", branch: "Main" },
  { id: "U003", name: "Admin User", email: "admin@hms.com", role: "Admin", status: "Active", branch: "Main" },
];

export const UserList = () => {
  return (
    <HmsDashboardShell
      widthTier="compact"
      footer={<HmsAuditFooter dataSource="Mock user list (sandbox)" />}
    >
      <div className="space-y-6 pb-12 animate-fade-in">
        <PageHeader title="User Management" description="Manage staff accounts, roles, and branch access." />

        <div
          className="card p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3"
          role="status"
        >
          <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-sm text-amber-900">
            <p className="font-bold mb-1">This page is a sandbox mock.</p>
            <p>
              The backend exposes{" "}
              <code className="font-mono text-[11px]">GET /api/v1/admin/users</code>{" "}
              for Super Admin, but for non-Super-Admin roles this page is a
              static shell. The user rows, branch assignments, and metric
              values shown below are hardcoded mock data and{" "}
              <strong>are not persisted</strong>. The "View Profile" links
              are intentionally disabled because the mock IDs (U001, U002,
              U003) do not exist in the database.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
              <FlaskConical className="h-4 w-4" />
              <span>UI demo shell only. No live user data is displayed.</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-hidden="true">
          <div className="animate-slide-up stagger-1">
            <MetricCard title="Total Users" value="—" icon={Users} color="indigo" />
          </div>
          <div className="animate-slide-up stagger-2">
            <MetricCard title="Active" value="—" icon={UserCheck} color="emerald" />
          </div>
          <div className="animate-slide-up stagger-3">
            <MetricCard title="Locked" value="—" icon={UserX} color="rose" />
          </div>
          <div className="animate-slide-up stagger-4">
            <MetricCard title="Admins" value="—" icon={ShieldCheck} color="indigo" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_USERS.map(u => {
                const initials = u.name.split(" ").map(n => n[0]).join("");
                return (
                  <tr key={u.id} className="bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.branch}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <UserStatusBadge status={u.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        role="link"
                        aria-disabled="true"
                        className="text-xs font-semibold text-slate-300 cursor-not-allowed px-3 py-1.5 bg-slate-50 rounded-lg inline-block"
                        title="Disabled: this user ID is mock data and does not exist in the database"
                      >
                        View Profile
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </HmsDashboardShell>
  );
};
```

Key changes from the original:
- Wrapped in `HmsDashboardShell` with `widthTier="compact"` and `HmsAuditFooter` with `dataSource="Mock user list (sandbox)"`.
- Added an amber banner explaining the page is a sandbox mock, listing the backend endpoint, and explaining why "View Profile" is disabled.
- Replaced the 4 hardcoded MetricCard values ("25", "22", "1", "2") with "—" and added `aria-hidden="true"` to the metric grid (it's structural placeholder, not real data).
- Changed the "View Profile" `<Link>` to a `<span>` with `role="link"` and `aria-disabled="true"` (the mock IDs U001/U002/U003 don't exist in the database, so clicking would 404).
- De-emphasized table rows with `bg-slate-50/50` and removed the hover effect (since the rows are mock data, not interactive).

**Step 2: Run the test to confirm GREEN**

Run: `cd hms-frontend && npx vitest run src/features/admin/__tests__/UserList.test.tsx`
Expected: All 4 tests PASS

---

## Task 3: Validate

**Step 1: Run the full frontend suite**

Run: `cd hms-frontend && npx vitest run`
Expected: All tests pass. Baseline was 84 files / 477 tests. After this fix, expected 85 files / 481 tests (+1 file, +4 tests, 0 regressions).

**Step 2: Run lint**

Run: `cd hms-frontend && npx eslint src/features/admin/UserList.tsx src/features/admin/__tests__/UserList.test.tsx`
Expected: 0 errors

**Step 3: Run typecheck**

Run: `cd hms-frontend && npm run typecheck`
Expected: exit 0

**Step 4: Run git diff --check**

Run: `cd hms-frontend && cd .. && git diff --check`
Expected: clean (or only the pre-existing CRLF warning on the other file, not this one)

---

## Task 4: Commit

**Step 1: Stage the 2 files**

```bash
cd hms-frontend
git add ../hms-frontend/src/features/admin/UserList.tsx \
        hms-frontend/src/features/admin/__tests__/UserList.test.tsx
```

Note: paths are relative to workspace root. Adjust if needed.

**Step 2: Commit with descriptive message**

```bash
git commit -m "fix(frontend): harden userlist against mock data for non-super-admin"
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

- **Spec coverage**: ✓ Adds sandbox banner. ✓ Adds HmsAuditFooter. ✓ Replaces fake metric values with "—". ✓ Disables fake "View Profile" links. ✓ Adds test file with 4 assertions. ✓ No broadening into UsersWrapper or UsersPage.
- **Placeholder scan**: No TODOs, no "implement later", no "similar to Task N".
- **Type consistency**: No new types or signatures. Uses existing `HmsDashboardShell`, `HmsAuditFooter`, `MetricCard`, `PageHeader`, `RoleBadge`, `UserStatusBadge` components.
- **Narrow scope**: 2 files only. No backend changes. No new dependencies. Follows the exact pattern from `2dd3b27e`.
