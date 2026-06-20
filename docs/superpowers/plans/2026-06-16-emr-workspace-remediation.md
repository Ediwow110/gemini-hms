# EMRWorkspace Production-Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate fake success alerts and implement real wiring for Vitals capture and Encounter finalization in `EMRWorkspace.tsx`.

**Architecture:**
- **Vitals Capture**: Implement `isLoading` and `error` states. Update `handleSaveVitals` to show a real success message on 2xx and a specific error message on failure, removing the "Demo Mode" fallback.
- **Encounter Finalization**: Implement `isLoading` state. Update `handleFinalizeEncounter` to only show success and lock the UI if the API call actually succeeds.
- **SOAP Notes**: Replace the fake "Cache Notes" alert with a truthful notice (e.g., "Notes saved to local state; please finalize encounter to persist to database").
- **UI Feedback**: Add loading indicators to buttons during API requests.

**Tech Stack:** React, TypeScript, Axios (`apiClient`), Vitest.

---

### Task 1: Vitals Capture Wiring & Honesty

**Files:**
- Modify: `hms-frontend/src/features/emr/EMRWorkspace.tsx`

- [ ] **Step 1: Add loading and error states for vitals**
  - `const [isSavingVitals, setIsSavingVitals] = useState(false);`
  - `const [vitalsError, setVitalsError] = useState<string | null>(null);`
- [ ] **Step 2: Update `handleSaveVitals`**
  - Set `setIsSavingVitals(true)` and `setVitalsError(null)`.
  - Try `apiClient.post(...)`.
  - On success: `alert("Vitals successfully saved to medical record.")`.
  - On failure: `setVitalsError(err.response?.data?.message || "Failed to save vitals.")`.
  - Finally: `setIsSavingVitals(false)`.
- [ ] **Step 3: Update UI for Vitals**
  - Disable "Save Vitals Metrics" button when `isSavingVitals` is true.
  - Show `vitalsError` above the button.

### Task 2: Encounter Finalization Wiring & Honesty

**Files:**
- Modify: `hms-frontend/src/features/emr/EMRWorkspace.tsx`

- [ ] **Step 1: Add loading state for finalization**
  - `const [isFinalizing, setIsFinalizing] = useState(false);`
- [ ] **Step 2: Update `handleFinalizeEncounter`**
  - Set `setIsFinalizing(true)`.
  - Try `apiClient.patch(...)`.
  - On success: `setIsLocked(true)`, `setShowConfirmClose(false)`, `alert("Encounter signed and locked successfully.")`.
  - On failure: `alert("Failed to finalize encounter. Please try again.")`.
  - Finally: `setIsFinalizing(false)`.
- [ ] **Step 3: Update UI for Finalization**
  - Disable "Yes, Sign & Lock" button when `isFinalizing` is true.
  - Show "Finalizing..." text on button.

### Task 3: SOAP Notes Honesty

**Files:**
- Modify: `hms-frontend/src/features/emr/EMRWorkspace.tsx`

- [ ] **Step 1: Replace fake cache alert**
  - Change `onClick={() => alert("SOAP progress notes cached.")}` to a more truthful message: `alert("Notes updated in local workspace. Please finalize the encounter to persist changes to the database.")`.

### Task 4: Regression and Honesty Tests

**Files:**
- Create: `hms-frontend/src/features/emr/__tests__/EMRWorkspace.test.tsx`

- [ ] **Step 1: Write test for Vitals success/failure**
  - Verify API call is made and success alert shown on 200, error message shown on 500.
- [ ] **Step 2: Write test for Finalization success/failure**
  - Verify API call is made and UI locks only on 200.
- [ ] **Step 3: Write test for SOAP notes honest alert**
  - Verify the alert text is truthful about local state.
- [ ] **Step 4: Run tests and verify PASS**

### Task 5: Final Validation and Commit

- [ ] **Step 1: Run Lint and Typecheck**
  - `npm run lint`
  - `npx tsc --noEmit`
- [ ] **Step 2: Verify no regressions**
  - `npm run test` (full suite)
- [ ] **Step 3: Commit**
  - `git add .`
  - `git commit -m "fix(frontend): wire EMR vitals and finalization, remove fake success alerts"`
