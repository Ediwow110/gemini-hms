# Inventory Page Real Wiring Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Single-lane surgical fix to `features/inventory/Inventory.tsx`.

**Goal:** Replace the hardcoded `MOCK_STOCK`, hardcoded `STATS` metrics, and dead "Review Items" button in `features/inventory/Inventory.tsx` with live data from the existing backend endpoint `GET /api/v1/inventory/catalog`. The page is currently reachable at `/inventory` (protected by `inventory.item.view` permission) and shows fake data with no sandbox notice — a violation of hard constraint #5 (no mock data pretending to be real).

**Architecture:** Follow the same pattern as the prior `CatalogManagementPage` lane (commit `ca7408d7`):
1. New service file `services/inventory.service.ts` calling the existing backend endpoint via `apiClient`
2. New react-query hook file `hooks/use-inventory.ts` exposing `useInventoryCatalog`
3. Component rewrite of `features/inventory/Inventory.tsx` to consume the hook, with loading/error/empty states and computed metrics
4. New test file `features/inventory/__tests__/Inventory.test.tsx` covering loading, error, empty, and data states, plus regression test for absence of the dead "Review Items" button

**Tech Stack:** React 18, TypeScript, axios (`apiClient`), `@tanstack/react-query`, vitest, @testing-library/react, lucide-react.

## Global Constraints

- **Hard constraint #5:** No mock data pretending to be real. All data on live pages must come from real backend or be honestly marked. This plan eliminates MOCK_STOCK from `Inventory.tsx` entirely.
- **Hard constraint #6:** Backend has support, so real wiring is required (not honest hardening).
- **No subagents.**
- **No push, no PR, no amend.**
- **Plan doc stays untracked** (intentional, matches AGENTS.md convention for `docs/superpowers/plans/*.md`).
- **Narrow scope:** 3 new files, 1 modified file, ~155 lines.
- **No new dependencies.**
- **No backend changes.**
- **Do not edit other inventory pages** (`InventoryDetail.tsx`, `StockReceiving.tsx` are out of scope for this lane).

## Backend Contract (reference, not modified)

`GET /api/v1/inventory/catalog` — returns `InventoryCatalogItem[]`:
- `id: string` (UUID)
- `name: string`
- `sku?: string | null`
- `category: string` (e.g., "Lab", "Drug", "Consumable")
- `unit: string` (e.g., "bottle", "box")
- `reorderLevel: number`
- `price: number`
- `status: 'ACTIVE' | 'INACTIVE'`
- `stock: number` (computed from `branchStocks[0]?.quantity` for the actor's branch)

Backend already enforces tenant + branch scope via `BranchGuard` + `tenantId`/`branchId` from JWT.

## File Structure

| File | Action | Lines | Responsibility |
|---|---|---|---|
| `hms-frontend/src/services/inventory.service.ts` | **CREATE** | ~30 | Type `InventoryCatalogItem`, method `getCatalog()` |
| `hms-frontend/src/hooks/use-inventory.ts` | **CREATE** | ~20 | `useInventoryCatalog()` react-query hook |
| `hms-frontend/src/features/inventory/Inventory.tsx` | **MODIFY** | ~80 net change | Use live data, computed stats, remove dead button, keep "Receive Stock" |
| `hms-frontend/src/features/inventory/__tests__/Inventory.test.tsx` | **CREATE** | ~50 | Loading / error / empty / data states + no dead-button test |

---

## Task 1: Write the failing test (TDD RED)

**Files:**
- Create: `hms-frontend/src/features/inventory/__tests__/Inventory.test.tsx`

**Goal:** Write the tests that the new implementation must satisfy. Confirm they fail before implementing.

- [ ] **Step 1: Create the test file**

Write tests for:
1. Renders loading skeleton when `useInventoryCatalog` returns `isLoading: true`
2. Renders error state when `useInventoryCatalog` returns an error
3. Renders empty state when data is `[]`
4. Renders real item names from live data
5. Renders computed stats: Total Items, Low Stock, Critical, Out of Stock (counts derived from live data, not hardcoded)
6. Has no dead "Review Items" button (no button without onClick in the low-stock alert)
7. Renders "Low-Stock Action Required" alert only when live data has items at or below reorder level

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd hms-frontend && npx vitest run src/features/inventory/__tests__/Inventory.test.tsx`
Expected: FAIL — test file imports non-existent `useInventoryCatalog` from `../../../hooks/use-inventory` and non-existent `inventoryService` from `../../../services/inventory.service`.

---

## Task 2: Create the inventory service

**Files:**
- Create: `hms-frontend/src/services/inventory.service.ts`

**Goal:** Type-safe service module that calls the existing backend endpoint.

- [ ] **Step 1: Write the service**

```ts
import { apiClient } from '../lib/api';

export type InventoryStatus = 'ACTIVE' | 'INACTIVE';

export interface InventoryCatalogItem {
  id: string;
  name: string;
  sku?: string | null;
  category: string;
  unit: string;
  reorderLevel: number;
  price: number;
  status: InventoryStatus;
  stock: number;
}

export const inventoryService = {
  getCatalog: async (): Promise<InventoryCatalogItem[]> => {
    const response = await apiClient.get('/v1/inventory/catalog');
    return response.data;
  },
};
```

- [ ] **Step 2: Run typecheck to verify**

Run: `cd hms-frontend && npx tsc --noEmit`
Expected: PASS (no consumers yet, but types are valid).

---

## Task 3: Create the react-query hook

**Files:**
- Create: `hms-frontend/src/hooks/use-inventory.ts`

**Goal:** React-query wrapper around the service for caching, retries, and consistent loading/error state.

- [ ] **Step 1: Write the hook**

```ts
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';

export const useInventoryCatalog = () => {
  return useQuery({
    queryKey: ['inventory', 'catalog'],
    queryFn: () => inventoryService.getCatalog(),
    retry: false,
  });
};
```

- [ ] **Step 2: Run typecheck to verify**

Run: `cd hms-frontend && npx tsc --noEmit`
Expected: PASS.

---

## Task 4: Rewrite `Inventory.tsx` to use live data

**Files:**
- Modify: `hms-frontend/src/features/inventory/Inventory.tsx` (replaces MOCK_STOCK, hardcoded STATS, and dead button with live data + computed values)

**Goal:** Live data on a live route. No more fake stats, fake alerts, or dead buttons.

- [ ] **Step 1: Remove the `MOCK_STOCK` and `STATS` constants and the unused `RequirePermission` wrapper (if it has no other use)**

The page is already permission-gated by the route (`/inventory` requires `inventory.item.view`).

- [ ] **Step 2: Add the `useInventoryCatalog` hook call**

```tsx
const { data: items = [], isLoading, error } = useInventoryCatalog();
```

- [ ] **Step 3: Compute stats from live data**

```tsx
const totalItems = items.length;
const lowStock = items.filter((i) => i.stock <= i.reorderLevel && i.stock > 0).length;
const critical = items.filter((i) => i.stock === 0).length;
const outOfStock = items.filter((i) => i.stock === 0).length;
const lowStockItems = items.filter((i) => i.stock <= i.reorderLevel);
```

- [ ] **Step 4: Render loading / error / empty states**

Use `HmsLoadingSkeleton` (from `../../components/hms-dashboard`) for loading.
Use a rose-colored error message for error state (consistent with other admin pages).
Use `HmsEmptyState` for empty data (consistent with other admin pages).

- [ ] **Step 5: Render the table with live data**

Columns (replacing the MOCK_STOCK columns that don't exist in the backend):
| Old column | New column | Source |
|---|---|---|
| Item (name + cat) | Item (name + cat) | `item.name`, `item.category` |
| Batch (fake) | **SKU** | `item.sku ?? '—'` |
| Qty | Qty | `item.stock` |
| Expiry (fake) | **Unit** | `item.unit` |
| Status (computed from fake) | Status (computed from live) | computed from `item.stock` vs `item.reorderLevel` |
| Actions (View Details → fake ID) | Actions (View Details → real ID) | `item.id` |

Status computation:
- `stock === 0` → "Critical" (rose)
- `stock <= reorderLevel` → "Low" (amber)
- `stock > reorderLevel` → "In Stock" (emerald)

- [ ] **Step 6: Update the "Low-Stock Action Required" alert to use live data**

Keep the alert. Compute `lowStockItems` from live data. Remove the dead "Review Items" button (no onClick — see constraint #5). Replace its visual with a non-button text "Showing in table below."

- [ ] **Step 7: Remove the `alertTriangle` icon import if it becomes unused**

- [ ] **Step 8: Run the test to verify it passes (TDD GREEN)**

Run: `cd hms-frontend && npx vitest run src/features/inventory/__tests__/Inventory.test.tsx`
Expected: 7/7 PASS.

---

## Task 5: Run full validation

- [ ] **Step 1: Targeted test**

Run: `cd hms-frontend && npx vitest run src/features/inventory/__tests__/Inventory.test.tsx`
Expected: 7/7 PASS.

- [ ] **Step 2: Full frontend suite**

Run: `cd hms-frontend && npx vitest run`
Expected: 84 files / 477 tests PASS (was 83/470, +1 file, +7 tests, 0 regressions).

- [ ] **Step 3: Lint touched files**

Run: `cd hms-frontend && npx eslint src/services/inventory.service.ts src/hooks/use-inventory.ts src/features/inventory/Inventory.tsx src/features/inventory/__tests__/Inventory.test.tsx`
Expected: 0 errors.

- [ ] **Step 4: Typecheck**

Run: `cd hms-frontend && npm run typecheck`
Expected: exit 0, no output.

- [ ] **Step 5: Whitespace check**

Run: `git diff --check`
Expected: clean, no output.

---

## Task 6: Commit

- [ ] **Step 1: Stage the 4 files (NOT the plan doc, NOT the AGENTS.md)**

```bash
git add hms-frontend/src/services/inventory.service.ts hms-frontend/src/hooks/use-inventory.ts hms-frontend/src/features/inventory/Inventory.tsx hms-frontend/src/features/inventory/__tests__/Inventory.test.tsx
```

- [ ] **Step 2: Commit**

```bash
git commit -m "fix(frontend): wire inventory page to live api and remove dead actions"
```

---

## Self-Review

- **Spec coverage:** Hard constraint #5 (no mock data pretending to be real) → MOCK_STOCK removed from `Inventory.tsx`. Dead "Review Items" button → removed. ✓
- **Placeholder scan:** All step code is concrete. No "TBD", "TODO", "implement later", or "fill in details". ✓
- **Type consistency:** `InventoryCatalogItem` defined once in service, consumed by hook and component. ✓
- **Adjacent silent bug sweep:** Loading/error/empty states added (no silent failures). View Details uses real IDs. Status computed from live data. ✓

## Execution Handoff

Single-lane inline execution. No subagents. No push. No PR.
