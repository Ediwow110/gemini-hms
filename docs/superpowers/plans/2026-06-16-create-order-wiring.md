# CreateOrder Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake success flow in `CreateOrder.tsx` with real API integration (`POST /api/v1/orders`), implementing real patient search, real service fetching, state binding, and success/error handling.

**Architecture:**
- Replace hardcoded patient search with `GET /api/v1/patients?search=...`.
- Replace `MOCK_SERVICES` with `GET /api/v1/catalog`.
- Bind order item fields (quantity, discount, remarks) to state.
- Implement `handleSubmit` to call `apiClient.post('/v1/orders', payload)`.
- Handle loading/error states and navigate to `/queue` on success.

**Tech Stack:** React, TypeScript, Axios (`apiClient`), Vitest.

---

### Task 1: Patient Search and Service Catalog Wiring

**Files:**
- Modify: `hms-frontend/src/features/orders/CreateOrder.tsx`
- Import: `apiClient` from `../../lib/api`

- [ ] **Step 1: Implement real patient search**
  - Update `handleSearch` to call `apiClient.get('/v1/patients', { params: { search: value } })`.
  - Set `patient` state from the first search result.
- [ ] **Step 2: Implement real service fetching**
  - Add `services` state.
  - Use `useEffect` to fetch services from `apiClient.get('/v1/catalog')` on mount.
  - Replace `MOCK_SERVICES` usage with `services` state.

### Task 2: Order Item State and Binding

**Files:**
- Modify: `hms-frontend/src/features/orders/CreateOrder.tsx`

- [ ] **Step 1: Update `OrderItem` interface**
  - Ensure it matches `OrderItemDto` (itemType, itemId, quantity).
- [ ] **Step 2: Implement `updateItem` handler**
  - Create a function to update quantity, discount, or remarks for a specific item index.
- [ ] **Step 3: Bind item inputs**
  - Update the table cells to use `input` elements bound to `items` state via `updateItem`.
- [ ] **Step 4: Implement real total calculation**
  - Calculate subtotal and total based on `items` and their fetched prices.

### Task 3: Order Submission and Feedback

**Files:**
- Modify: `hms-frontend/src/features/orders/CreateOrder.tsx`

- [ ] **Step 1: Add loading and error states**
  - `const [isLoading, setIsLoading] = useState(false);`
  - `const [error, setError] = useState<string | null>(null);`
- [ ] **Step 2: Update `handleSubmit`**
  - Construct `CreateOrderDto` (patientId, branchId, items).
  - Note: `branchId` will be fetched from user context or a constant for now if not available.
  - Set `isLoading(true)` and `setError(null)`.
  - Call `apiClient.post('/v1/orders', payload)`.
  - On success: `navigate('/queue')`.
  - On failure: `setError("Failed to create order. Please try again.")`.
  - Finally: `setIsLoading(false)`.
- [ ] **Step 3: Update UI**
  - Show error message above the "Create Order" button.
  - Disable button and show "Creating..." when `isLoading` is true.

### Task 4: Regression and Honesty Tests

**Files:**
- Create: `hms-frontend/src/features/orders/__tests__/CreateOrder.test.tsx`

- [ ] **Step 1: Write test for "Fake Alert" removal**
  - Verify that clicking "Create Order" triggers an API call, not an `alert()`.
- [ ] **Step 2: Write test for successful order creation**
  - Mock `apiClient.get` (patients, catalog) and `apiClient.post` (orders).
  - Verify `navigate('/queue')` is called on success.
- [ ] **Step 3: Write test for API failure**
  - Mock `apiClient.post` to reject $\rightarrow$ verify error message is displayed.
- [ ] **Step 4: Run tests and verify PASS**
  - Run: `npm run test src/features/orders/__tests__/CreateOrder.test.tsx`

### Task 5: Final Validation and Commit

- [ ] **Step 1: Run Lint and Typecheck**
  - `npm run lint`
  - `npx tsc --noEmit`
- [ ] **Step 2: Verify no regressions**
  - `npm run test` (full suite)
- [ ] **Step 3: Commit**
  - `git add .`
  - `git commit -m "fix(frontend): wire CreateOrder form to API and remove fake success flow"`
