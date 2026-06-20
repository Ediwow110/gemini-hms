# RegisterPatient Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the silent data discard in `RegisterPatient.tsx` with real API integration (`POST /api/v1/patients`), implementing state binding, validation, and loading/error handling.

**Architecture:**
- Implement local state management for the registration form using `useState`.
- Integrate with the existing `apiClient` from `src/lib/api.ts` to perform the `POST /v1/patients` request.
- Add client-side validation to ensure required fields (`firstName`, `lastName`, `dob`) are present before submission.
- Implement loading and error states to provide feedback during the API request.

**Tech Stack:** React, TypeScript, Axios (`apiClient`), Vitest.

---

### Task 1: Form State and Binding

**Files:**
- Modify: `hms-frontend/src/features/patients/RegisterPatient.tsx`

- [ ] **Step 1: Define `formData` state**
  - Add state for: `firstName`, `lastName`, `dob`, `contactNumber`, `address`, `gender`.
- [ ] **Step 2: Implement `handleInputChange`**
  - Create a generic handler to update `formData` based on the input `name`.
- [ ] **Step 3: Bind form fields**
  - Add `name` and `value` props to all `input` and `select` elements.
  - Add `onChange={handleInputChange}` to all fields.

### Task 2: API Integration and Submission Logic

**Files:**
- Modify: `hms-frontend/src/features/patients/RegisterPatient.tsx`
- Import: `apiClient` from `../../lib/api`

- [ ] **Step 1: Add loading and error states**
  - `const [isLoading, setIsLoading] = useState(false);`
  - `const [error, setError] = useState<string | null>(null);`
- [ ] **Step 2: Update `handleSubmit`**
  - Add basic validation for required fields.
  - Set `isLoading(true)` and `setError(null)`.
  - Perform `await apiClient.post('/v1/patients', formData)`.
  - On success: `navigate('/patients')`.
  - On failure: `setError("Failed to register patient. Please try again.")`.
  - Finally: `setIsLoading(false)`.
- [ ] **Step 3: Update UI for Loading/Error**
  - Disable "Save Patient" button when `isLoading` is true.
  - Display the `error` message above the submit buttons if it exists.

### Task 3: Regression and Honesty Tests

**Files:**
- Create: `hms-frontend/src/features/patients/__tests__/RegisterPatient.test.tsx`

- [ ] **Step 1: Write test for "Silent Discard" removal**
  - Verify that submitting the form triggers an API call, not just navigation.
- [ ] **Step 2: Write test for successful registration**
  - Mock `apiClient.post` to resolve $\rightarrow$ verify `navigate('/patients')` is called.
- [ ] **Step 3: Write test for validation error**
  - Submit with missing required fields $\rightarrow$ verify API is NOT called and error is shown.
- [ ] **Step 4: Write test for API failure**
  - Mock `apiClient.post` to reject $\rightarrow$ verify error message is displayed.
- [ ] **Step 5: Run tests and verify PASS**
  - Run: `npm run test src/features/patients/__tests__/RegisterPatient.test.tsx`

### Task 4: Final Validation and Commit

- [ ] **Step 1: Run Lint and Typecheck**
  - `npm run lint`
  - `npx tsc --noEmit`
- [ ] **Step 2: Verify no regressions**
  - `npm run test` (full suite)
- [ ] **Step 3: Commit**
  - `git add .`
  - `git commit -m "fix(frontend): wire RegisterPatient form to API and remove silent data discard"`
