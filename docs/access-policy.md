# Access Control Policy - HMS

## Role Hierarchy & Scoping

| Role | Scope | Multi-Branch Access |
| :--- | :--- | :--- |
| **Super Admin** | Tenant-wide | **YES**. Can access any branch by providing `branchId` in request. |
| **Branch Admin** | Branch-limited | **NO**. Strictly limited to assigned `branchId` in session. |
| **Doctor/Clinical** | Branch-limited | **NO**. Strictly limited to assigned `branchId` in session. |
| **Receptionist** | Branch-limited | **NO**. Strictly limited to assigned `branchId` in session. |

## Guard Implementation

### 1. `JwtAuthGuard` (Global)
- Enforces valid JWT on all routes.
- Performs stateful session lookup in `Session` table.
- Invalidate sessions immediately upon logout or password change.

### 2. `PermissionsGuard` (Controller-level)
- Enforces `@RequirePermissions(...)` metadata.
- Queries database in real-time to check active role permissions.

### 3. `BranchGuard` (Controller-level)
- Enforces `@RequireBranchContext()` metadata.
- If user is NOT **Super Admin**:
    - `branchId` MUST be present in session token.
    - If `branchId` is present in Request (Body/Param/Query), it MUST match session `branchId`.
- If user IS **Super Admin**:
    - Session `branchId` is optional.
    - If `branchId` is present in Request, it MUST be consistent across all inputs (Body/Param/Query).

## Audit Trail
- All access-denied events (403) and authentication failures (401/429) are logged to the immutable `audit_logs` table.
