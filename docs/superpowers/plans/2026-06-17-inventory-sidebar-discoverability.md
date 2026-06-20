# /inventory Sidebar Discoverability — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Inventory & Stock" group to `hms-frontend/src/config/roleNavigation.ts` with a single entry pointing to `/inventory`, making the now-real inventory catalog discoverable to all roles with `INVENTORY_VIEW` permission (Super Admin, Branch Admin, Pharmacist). The page is live (wired in `4257afe9` to `GET /api/v1/inventory/catalog`) and gated by `inventory.item.view`, but currently has NO sidebar entry.

**Architecture:** Pure frontend navigation config update. No backend changes. No new dependencies. No new pages. The fix is to:
1. Add 1 new group "Inventory & Stock" to the `roleNavigation` array in `roleNavigation.ts`.
2. Add 1 entry in the new group: `Catalog` → `/inventory`, gated by `PERMISSIONS.INVENTORY_VIEW`, visible to Super Admin / Branch Admin / Pharmacist, branch-scoped.
3. Add 2 tests to `RoleBasedSidebar.test.tsx`:
   - Sidebar shows "Catalog" for Branch Admin (has INVENTORY_VIEW)
   - Sidebar hides "Catalog" for Doctor (no INVENTORY_VIEW)

**Tech Stack:** React, vitest, @testing-library/react, TypeScript

## Global Constraints

- One lane only. Do not touch other pages, other sidebar groups, or backend services.
- Do not amend prior commits.
- Local only. No push, no PR.
- Keep tracked tree clean (only the 2 intended files + the plan doc).
- TDD: failing test first, then implementation.
- `/inventory/receiving` should NOT appear in the sidebar (no default role has `inventory.stock.receive`; reachable from `/inventory` via the "Receive Stock" button).
- No duplicate entries (do not add the same entry to multiple groups).
- Follow the existing pattern from other groups in `roleNavigation.ts`.

---

## Task 1: RED — Write failing tests for the sidebar entry

**Files:**
- Modify: `hms-frontend/src/app/__tests__/RoleBasedSidebar.test.tsx`

**Step 1: Read the existing test patterns**

Already read. The file uses `mockUseUser`, `mockUseAuth`, `mockUsePermissions` mocks. The `canAccess` mock can be customized to return true/false based on permission, role, and branch scope.

**Step 2: Add 2 new tests at the end of the `describe` block**

Append these tests after the last test in the file:

```tsx
  it('shows the "Catalog" inventory entry for Branch Admin (has INVENTORY_VIEW)', () => {
    const user = {
      id: 'ba-1',
      email: 'branch-admin@hospital.com',
      roles: ['Branch Admin'],
      branchId: 'branch-1',
    };
    mockUseUser.mockReturnValue(user);
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: false,
      canAccess: (opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
        if (opts.permission === 'inventory.item.view') return true;
        return false;
      },
    });

    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <RoleBasedSidebar pathname="/inventory" />
      </MemoryRouter>
    );

    expect(screen.getByText('Catalog')).toBeInTheDocument();
  });

  it('hides the "Catalog" inventory entry for Doctor (no INVENTORY_VIEW)', () => {
    const user = {
      id: 'doc-1',
      email: 'doctor@hospital.com',
      roles: ['Doctor'],
      branchId: 'branch-1',
    };
    mockUseUser.mockReturnValue(user);
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: false,
      canAccess: (opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
        if (opts.permission === 'inventory.item.view') return false;
        return true;
      },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <RoleBasedSidebar pathname="/" />
      </MemoryRouter>
    );

    expect(screen.queryByText('Catalog')).not.toBeInTheDocument();
  });
```

**Step 3: Run the tests to confirm RED**

Run: `cd hms-frontend && npx vitest run src/app/__tests__/RoleBasedSidebar.test.tsx`
Expected: The 2 new tests FAIL. The existing 8 tests should still pass.
- "shows the 'Catalog' inventory entry" — FAILS because the sidebar doesn't have a "Catalog" entry yet
- "hides the 'Catalog' inventory entry" — actually PASSES (because the entry doesn't exist, so it's correctly hidden). Wait, this test will PASS even before the fix. That's a problem.

**Step 3 (corrected):** The "hides" test will pass trivially before the fix. To make it a meaningful RED test, I need to make it assert the POSITIVE case (that Doctor sees other items but NOT Catalog). Let me revise:

```tsx
  it('does not show the "Catalog" inventory entry for Doctor (no INVENTORY_VIEW)', () => {
    const user = {
      id: 'doc-1',
      email: 'doctor@hospital.com',
      roles: ['Doctor'],
      branchId: 'branch-1',
    };
    mockUseUser.mockReturnValue(user);
    mockUsePermissions.mockReturnValue({
      isSuperAdmin: false,
      canAccess: (opts: { permission?: string; allowedRoles?: string[]; isBranchScoped?: boolean; zone?: string }) => {
        if (opts.permission === 'inventory.item.view') return false;
        if (opts.permission === 'patient.view') return true;
        return false;
      },
    });

    render(
      <MemoryRouter initialEntries={['/doctor']}>
        <RoleBasedSidebar pathname="/doctor" />
      </MemoryRouter>
    );

    // Doctor should see "Patient Queue" (has patient.view) but NOT "Catalog" (no inventory.item.view)
    expect(screen.getByText('Patient Queue')).toBeInTheDocument();
    expect(screen.queryByText('Catalog')).not.toBeInTheDocument();
  });
```

This test will FAIL before the fix because:
- "Patient Queue" IS in the sidebar (it's in roleNavigation.ts line 216 with permission PATIENT_VIEW)
- But the test asserts both "Patient Queue" exists AND "Catalog" does not exist
- Before the fix, "Catalog" doesn't exist (trivially passes the not.toBeInTheDocument assertion)
- After the fix, "Catalog" would be added but filtered out for Doctor (because canAccess returns false for inventory.item.view)

Wait, this test would PASS before the fix too (trivially). Let me think again.

The real RED test is: the "shows" test. The "hides" test is a regression test that should pass both before and after the fix. That's fine — it's a guard against future regressions.

Actually, the "hides" test is still useful as a regression test. It asserts that after the fix, Doctor doesn't see Catalog. If someone later changes the `allowedRoles` or `permission` to be too broad, this test will catch it.

So the plan is:
- "shows" test: FAILS before fix (no Catalog entry), PASSES after fix
- "hides" test: PASSES before fix (trivially), PASSES after fix (Doctor filtered out)

This is acceptable. The "shows" test is the primary RED test. The "hides" test is a regression guard.

Run: `cd hms-frontend && npx vitest run src/app/__tests__/RoleBasedSidebar.test.tsx`
Expected: 1 new test FAILS ("shows"), 1 new test PASSES ("hides", trivially), 8 existing tests PASS.

**Step 4: Implement the fix**

**Files:**
- Modify: `hms-frontend/src/config/roleNavigation.ts`

Add a new group "Inventory & Stock" to the `roleNavigation` array. Place it after the "Pharmacy Workspace" group and before the "Marketplace (Buyer)" group (logical grouping: clinical/operational workspaces first, then marketplace).

Find this block in `roleNavigation.ts`:

```ts
  {
    label: 'Pharmacy Workspace',
    items: [
      { label: 'Dispensing Hub', to: '/pharmacy', icon: Pill, permission: PERMISSIONS.INVENTORY_DISPENSE, allowedRoles: ['Pharmacist'], zone: 'staff', isBranchScoped: true },
      { label: 'Pharmacy Dashboard', to: '/pharmacy/dashboard', icon: LayoutDashboard, permission: PERMISSIONS.INVENTORY_VIEW, allowedRoles: ['Pharmacist'], zone: 'staff', isBranchScoped: true },
    ],
  },
```

Add this new group after it:

```ts
  {
    label: 'Inventory & Stock',
    items: [
      {
        label: 'Catalog',
        to: '/inventory',
        icon: Package,
        permission: PERMISSIONS.INVENTORY_VIEW,
        allowedRoles: ['Super Admin', 'Branch Admin', 'Pharmacist'],
        zone: 'staff',
        isBranchScoped: true,
      },
    ],
  },
```

**Step 5: Run the tests to confirm GREEN**

Run: `cd hms-frontend && npx vitest run src/app/__tests__/RoleBasedSidebar.test.tsx`
Expected: All 10 tests PASS (8 existing + 2 new).

---

## Task 2: Validate

**Step 1: Run the full frontend suite**

Run: `cd hms-frontend && npx vitest run`
Expected: All tests pass. Baseline was 85 files / 483 tests. After this fix, expected 85 files / 485 tests (no new file, +2 tests, 0 regressions).

**Step 2: Run lint**

Run: `cd hms-frontend && npx eslint src/config/roleNavigation.ts src/app/__tests__/RoleBasedSidebar.test.tsx`
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
git add hms-frontend/src/config/roleNavigation.ts \
        hms-frontend/src/app/__tests__/RoleBasedSidebar.test.tsx
```

**Step 2: Commit with descriptive message**

```bash
git commit -m "fix(frontend): add /inventory to sidebar for roles with inventory view"
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

- **Spec coverage**: ✓ /inventory in sidebar. ✓ /inventory/receiving NOT in sidebar. ✓ Visible to Super Admin, Branch Admin, Pharmacist. ✓ New "Inventory & Stock" group. ✓ 2 new tests. ✓ No broadening into other pages or other sidebar groups.
- **Placeholder scan**: No TODOs, no "implement later", no "similar to Task N".
- **Type consistency**: No new types or signatures. Uses existing `PERMISSIONS` constant, existing `Package` icon (already imported in roleNavigation.ts), existing `NavGroupConfig`/`NavItemConfig` interfaces.
- **Narrow scope**: 2 files only. No backend changes. No new dependencies. No new pages.
- **No duplicate entries**: The "Catalog" entry is only in the new "Inventory & Stock" group, not duplicated in any other group.
- **Permission truth**: `permission: PERMISSIONS.INVENTORY_VIEW` matches the route gate (`App.tsx:314`). `allowedRoles: ['Super Admin', 'Branch Admin', 'Pharmacist']` matches the roles that have `INVENTORY_VIEW` in `permissions.ts` (lines 85, 138, plus Super Admin gets all permissions).
- **Branch scope**: `isBranchScoped: true` is correct because the backend filters by `branchId` (verified in `inventory.controller.ts:40`).
