# Production-Readiness Remediation Lane 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 active production-readiness findings related to auth, audit, HR, and inventory.

**Architecture:** 
- Auth: Update `BranchGuard` to respect tenant-wide roles (Tenant Admin, Compliance Officer, etc.).
- Audit: Align `AuditService.findOne` with `findAll` permissions.
- HR: Migrate to atomic `NumberingService` for employee numbers.
- Inventory: Add ACTIVE status checks in `receiveStock` and `adjustStock`.
- Frontend: Wire `AuditLogViewer` search to backend query parameters.

**Tech Stack:** NestJS, React, Prisma, TypeScript.

---

### Task 1: Allow Global Roles in BranchGuard

**Files:**
- Modify: `hms-backend/src/auth/guards/branch.guard.ts`
- Test: `hms-backend/test/auth-branches.e2e-spec.ts` (if exists) or create new test

- [ ] **Step 1: Update BranchGuard to allow tenant-wide roles**
Modify `BranchGuard` to allow users with 'Tenant Admin' or 'Compliance Officer' roles (or any role that should have global access) to bypass the mandatory `branchId` requirement, while still enforcing consistent target branch if provided.

- [ ] **Step 2: Add/Update tests for BranchGuard**
Verify that a 'Compliance Officer' without a `branchId` can pass the guard, while a 'Branch Admin' without a `branchId` still fails.

---

### Task 2: Global Audit Detail Access

**Files:**
- Modify: `hms-backend/src/audit/audit.service.ts`

- [ ] **Step 1: Align findOne with tenant-wide viewer logic**
Update `AuditService.findOne` to allow roles defined as `isTenantWideViewer` (Super Admin, Compliance Officer, Tenant Admin) to view branch-scoped logs.

- [ ] **Step 2: Verify fix with tests**
Add a test case where a `Compliance Officer` successfully retrieves a branch-scoped audit log.

---

### Task 3: HR Atomic Employee Numbering

**Files:**
- Modify: `hms-backend/src/hr/hr.service.ts`
- Modify: `hms-backend/src/hr/hr.module.ts` (if NumberingModule needs to be imported)

- [ ] **Step 1: Import NumberingModule into HrModule**
Ensure `NumberingService` is available to `HrService`.

- [ ] **Step 2: Replace race-prone numbering with NumberingService**
Update `HrService.createEmployee` to use `NumberingService.getNextValue` (or equivalent atomic method) for `EMPLOYEE` type.

- [ ] **Step 3: Update tests**
Prove that employee creation no longer uses a manual count.

---

### Task 4: Inventory ACTIVE-State Enforcement

**Files:**
- Modify: `hms-backend/src/inventory/inventory.service.ts`

- [ ] **Step 1: Add ACTIVE check to receiveStock**
Ensure `receiveStock` throws `BadRequestException` if the item is `INACTIVE`.

- [ ] **Step 2: Add ACTIVE check to adjustStock**
Ensure `adjustStock` throws `BadRequestException` if the item is `INACTIVE`.

- [ ] **Step 3: Verify with tests**
Add tests to ensure stock mutations fail for inactive items.

---

### Task 5: Backend-Backed Audit Search

**Files:**
- Modify: `hms-frontend/src/features/admin/AuditLogViewer.tsx`
- Modify: `hms-frontend/src/hooks/use-compliance.ts`
- Modify: `hms-frontend/src/services/compliance.service.ts`

- [ ] **Step 1: Update compliance service and hook to accept search parameters**
Add `searchText` or specific filter params to `getAuditLogs`.

- [ ] **Step 2: Update AuditLogViewer to pass search to hook**
Replace page-local filtering with state passed to `useAuditEvents`.

- [ ] **Step 3: Remove "page-local" warning/UI noise**
Update UI to reflect that global search is active.

---

### Task 6: Final Validation

- [ ] **Step 1: Run full validation suite**
Backend lint, typecheck, tests. Frontend lint, typecheck, tests.
