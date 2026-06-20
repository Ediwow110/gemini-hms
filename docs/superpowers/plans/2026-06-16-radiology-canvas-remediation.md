# RadiologyCanvas Honesty Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate fake success alerts and misleading persistence claims in `RadiologyCanvas.tsx`, marking the finalization workflow as Read-Only/WIP since backend support is missing.

**Architecture:**
- **Read-Only Mode**: The "Finalize Report" action will be disabled and marked as "WIP".
- **Removal of Mocks**: The `fetchRadiologyOrders` function will no longer use fallback mocks on error, ensuring backend failures are visible.
- **Honesty Hardening**: Remove the fake "finalized and signed off" alert and the local-state mutation that locks the report.
- **UI Feedback**: Add a global WIP banner and a `fetchError` state.

**Tech Stack:** React, TypeScript, Vitest.

---

### Task 1: Remove Mocking and Fake Alerts

**Files:**
- Modify: `hms-frontend/src/features/radiology/RadiologyCanvas.tsx`

- [ ] **Step 1: Add `fetchError` state**
  - `const [fetchError, setFetchError] = useState<string | null>(null);`
- [ ] **Step 2: Remove fallback mocks in `fetchRadiologyOrders`**
  - Remove the `catch` block that sets `setOrders([...])`.
  - Add `setFetchError(err.response?.data?.message || "Failed to fetch radiology orders.")` in the catch block.
- [ ] **Step 3: Remove fake success in `handleSaveReport`**
  - Remove the local state update: `const updatedOrders = ...`, `setOrders(updatedOrders)`, `setSelectedOrder(...)`.
  - Remove `alert("Radiology interpretation finalized and signed off.");`.
  - Keep the API call but handle error with a truthful alert.

### Task 2: UI Hardening (Read-Only / WIP)

**Files:**
- Modify: `hms-frontend/src/features/radiology/RadiologyCanvas.tsx`

- [ ] **Step 1: Disable "Finalize Report" button**
  - Add `disabled={true}`.
  - Change text to "Finalize Report (WIP)".
- [ ] **Step 2: Add a global "Read-Only" banner**
  - Add a notice at the top of the page: "This module is currently in read-only mode. Report finalization is not yet available in the live environment."
- [ ] **Step 3: Display `fetchError` if it exists**
  - Show the error message above the worklist.

### Task 3: Verification Tests

**Files:**
- Create: `hms-frontend/src/features/radiology/__tests__/RadiologyCanvas.test.tsx`

- [ ] **Step 1: Test that no mock data is shown on API failure**
  - Mock API to fail.
  - Verify that no radiology orders are rendered.
- [ ] **Step 2: Test that the finalize button is disabled**
  - Verify the button is disabled and contains "(WIP)".
- [ ] **Step 3: Test that no fake success alert is shown**
  - (Since button is disabled, verify it cannot be clicked to trigger an alert).
- [ ] **Step 4: Run tests and verify PASS**

### Task 4: Final Validation and Commit

- [ ] **Step 1: Run Lint and Typecheck**
  - `npm run lint`
  - `npx tsc --noEmit`
- [ ] **Step 2: Commit**
  - `git add .`
  - `git commit -m "fix(frontend): remove fake success alerts in RadiologyCanvas, mark as read-only"`
