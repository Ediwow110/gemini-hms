# PatientMergeRequests Honesty Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all fake success behavior and misleading alerts from `PatientMergeRequests.tsx`, marking the feature as Read-Only/WIP since backend support is missing.

**Architecture:**
- **Read-Only Mode**: The page will still fetch data (if available) but all mutation actions (Execute/Reject) will be disabled and marked as "Coming Soon" or "WIP".
- **Removal of Mocks**: The `fetchMergeRequests` function will no longer use fallback mocks on error, as this hides backend failures.
- **Honesty Hardening**: Remove all `alert()` calls that claim a successful merge or rejection.
- **UI Feedback**: Disable action buttons and provide a truthful explanation in the UI.

**Tech Stack:** React, TypeScript, Vitest.

---

### Task 1: Remove Mocking and Fake Alerts

**Files:**
- Modify: `hms-frontend/src/features/admin/PatientMergeRequests.tsx`

- [ ] **Step 1: Remove fallback mocks in `fetchMergeRequests`**
  - Remove the `catch` block that sets `mockList`.
  - Add a state for `fetchError` to show a truthful message if the API fails.
- [ ] **Step 2: Remove fake success logic in `handleExecuteMerge`**
  - Remove the `alert` and the local `setRequests` filter.
  - (Optional) Keep the function but mark it as disabled in UI.
- [ ] **Step 3: Remove fake success logic in `handleRejectMerge`**
  - Remove the `alert` and the local `setRequests` filter.

### Task 2: UI Hardening (Read-Only / WIP)

**Files:**
- Modify: `hms-frontend/src/features/admin/PatientMergeRequests.tsx`

- [ ] **Step 1: Disable "Authorize & Execute Merge" button**
  - Add `disabled={true}`.
  - Change text to "Execute (Coming Soon)" or similar.
- [ ] **Step 2: Disable "Reject Merge Request" button**
  - Add `disabled={true}`.
  - Change text to "Reject (Coming Soon)" or similar.
- [ ] **Step 3: Add a global "Read-Only" or "WIP" banner**
  - Add a notice at the top of the page: "This module is currently in read-only mode. Merge execution is not yet available in the live environment."

### Task 3: Verification Tests

**Files:**
- Create: `hms-frontend/src/features/admin/__tests__/PatientMergeRequests.test.tsx`

- [ ] **Step 1: Test that no fake alerts are shown**
  - Mock API to fail.
  - Verify that clicking "Execute" or "Reject" (if enabled) does not trigger a "success" alert.
- [ ] **Step 2: Test that buttons are disabled**
  - Verify that "Authorize & Execute Merge" and "Reject Merge Request" are disabled.
- [ ] **Step 3: Test that mocks are gone**
  - Verify that an API failure does not result in the display of "Jannette Smythe" or "Robert Chase" (the mock data).
- [ ] **Step 4: Run tests and verify PASS**

### Task 4: Final Validation and Commit

- [ ] **Step 1: Run Lint and Typecheck**
  - `npm run lint`
  - `npx tsc --noEmit`
- [ ] **Step 2: Commit**
  - `git add .`
  - `git commit -m "fix(frontend): remove fake success alerts in PatientMergeRequests, mark as read-only"`
