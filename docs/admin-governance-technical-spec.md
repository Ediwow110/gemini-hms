# Admin/User/Role Management Governance Specification

## Status
This document is the implementation-readiness specification for governed runtime administration of users, roles, and role permissions.

This document does **not** authorize immediate endpoint implementation unless the schema prerequisites listed here are addressed or explicitly deferred in the implementation plan.

## Current Codebase Reality

### Current schema that already exists
- `User`: `id`, `tenantId`, `email`, `passwordHash`, `isMfaEnabled`, `status`, optional deactivation metadata, `tokenVersion`, timestamps
- `Role`: `id`, `tenantId`, `name`, `status`, `isSystem`, optional archive metadata
- `Permission`: `id`, `tenantId`, `name`, `scope`
- `UserRole`: `(userId, roleId)` composite key
- `RolePermission`: `(roleId, permissionId)` composite key
- `UserBranch`: tenant-scoped branch assignment rows with `isActive`
- `ApprovalRequest`: tenant-scoped workflow record with freeform `type`, `riskLevel`, `recordId`, `status`, `reason`, `remarks`, `details`
- `AuditLog`: tenant-scoped audit record with optional `branchId`, `eventKey`, `recordType`, `recordId`, `oldValues`, `newValues`

### Current auth/session behavior
- JWT contains `sub`, `email`, `tenantId`, `roles`, and optional `branchId`
- `/api/v1/auth/me` re-derives **permissions from the database** at request time
- JWT `roles` can become stale until the client refreshes its token
- `branchId` in JWT is present only when exactly one active branch assignment exists or after explicit `/api/v1/auth/select-branch`
- `User.tokenVersion` is included in new JWTs and compared during JWT validation
- There is **no persisted session table**, refresh-token table, or revoked-token table

### Current scope/security model
- `PermissionsGuard` is tenant-scoped only by design
- Branch isolation is enforced in `BranchGuard` and domain service mutation predicates
- High-risk workflows already use `ApprovalRequest` plus transactional `AuditLog`
- Report export governance already exists and requires a non-empty `reason`

## Decision
Runtime admin endpoints remain **deferred** until the rules below are followed.

Implemented backend slice:
- `POST /api/v1/admin/users/:id/deactivate`
- `POST /api/v1/admin/users/:id/activate`

This slice directly processes only non-privileged users. Targets with `Super Admin` or any role carrying `admin.role.change` remain blocked until maker-checker processing for privileged admin lifecycle changes is implemented.

## Required permission
Every mutation in this document requires:
- `admin.role.change`

Read-only admin discovery endpoints may later use a separate permission, but that permission does not exist yet and is out of scope for this document.

## Governance principles
- All admin writes are tenant-scoped.
- Branch-bound administrators cannot mutate users, assignments, roles, or approval requests outside their authorized branch view.
- Every mutation requires a non-empty reason.
- No self-escalation is allowed.
- No direct runtime mutation may bypass audit.
- High-risk role and permission changes must use maker-checker workflow.
- Mutation safety must follow the repository write-boundary rule: authorization pre-read is not enough; the mutation itself must fail closed if scope no longer matches.

## API surfaces

### A. User management
- `POST /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id`
- `POST /api/v1/admin/users/:id/deactivate` - implemented for non-privileged users
- `POST /api/v1/admin/users/:id/activate` - implemented for non-privileged users

### B. User role assignment
- `POST /api/v1/admin/users/:id/roles`
- `DELETE /api/v1/admin/users/:id/roles/:roleId`

### C. Role management
- `POST /api/v1/admin/roles`
- `PATCH /api/v1/admin/roles/:id`
- `POST /api/v1/admin/roles/:id/archive`

### D. Role permission management
- `POST /api/v1/admin/roles/:id/permissions`
- `DELETE /api/v1/admin/roles/:id/permissions/:permissionId`

## Scope rules

### Tenant scope
- All targets must belong to `request.user.tenantId`.
- `Role`, `Permission`, `User`, `UserBranch`, `UserRole`, `RolePermission`, `ApprovalRequest`, and `AuditLog` all remain tenant-owned.

### Branch scope
- Branch scope does **not** come from `PermissionsGuard`.
- Branch scope must be enforced explicitly in each admin domain service.
- A branch-bound admin may only manage users whose active branch assignments are fully visible to that admin's allowed branch context.
- A branch-bound admin may only assign or revoke roles for users within the same allowed branch context.
- If an approval request is branch-scoped, its `details.branchId` must match the authenticated branch at process time. This matches the existing `ApprovalsService` pattern.

### Super Admin vs Branch Admin behavior
- `Super Admin` may mutate any user/role/assignment in the tenant.
- `Branch Admin` may mutate only branch-visible targets in their current branch scope.
- If a request is tenant-wide and not representable within a single branch scope, only `Super Admin` may initiate it.

## Reason requirements

Every mutation request body must include:
- `reason: string`

Rules:
- required
- trimmed
- non-empty
- minimum 8 characters
- stored in `ApprovalRequest.reason` when approval-backed
- copied into audit `newValues.reason`

Endpoints that do not naturally carry a JSON body, such as `DELETE /users/:id/roles/:roleId`, must still accept a body DTO with `reason`.

## Self-escalation prevention

The backend must reject any mutation where the actor would directly or indirectly increase their own power.

Blocked cases:
- actor creates or reactivates their own higher-privilege admin account
- actor assigns a role to themselves
- actor revokes a role from themselves if that would bypass maker-checker or reduce separation-of-duties enforcement during the same flow
- actor grants a permission to a role they currently hold
- actor creates a new role containing permissions they do not already possess
- actor archives or mutates a role currently assigned to themselves if that action could alter their own authorization envelope inside the same transaction window

Implementation rule:
- compare actor `userId` against target `userId`
- compare actor effective permission set from DB against requested permission delta
- reject before mutation and before approval request creation if the request itself is self-escalating

## Maker-checker policy

### Approval required
The following actions require `ApprovalRequest` creation and later processing by a different user:
- privileged user deactivation
- privileged user reactivation
- user role assignment
- user role revocation
- role creation
- role archive
- role permission grant
- role permission revoke

### Approval optional / direct execution
These may execute directly with audit only, unless policy is later tightened:
- user profile update limited to email and MFA flag
- non-privileged user deactivation/reactivation with `admin.role.change`, tenant/branch scope enforcement, self-change block, audit, and `tokenVersion` invalidation

If implementation chooses to require approval for user profile update too, that is allowed, but the code must follow this document consistently.

### Approval request typing
Current schema supports freeform string `ApprovalRequest.type`. Use explicit values:
- `ADMIN_USER_DEACTIVATE`
- `ADMIN_USER_REACTIVATE`
- `ADMIN_USER_ROLE_ASSIGN`
- `ADMIN_USER_ROLE_REVOKE`
- `ADMIN_ROLE_CREATE`
- `ADMIN_ROLE_UPDATE`
- `ADMIN_ROLE_ARCHIVE`
- `ADMIN_ROLE_PERMISSION_GRANT`
- `ADMIN_ROLE_PERMISSION_REVOKE`

Suggested `riskLevel`:
- `MEDIUM`: user profile update, user create
- `HIGH`: user deactivate/reactivate, role assignment/revocation
- `CRITICAL`: role permission grant/revoke, role archive, role create with privileged permissions

### Approval request details payload
`ApprovalRequest.details` must include enough data to replay or verify the intended mutation safely.

Required base fields:
```json
{
  "action": "ADMIN_USER_ROLE_ASSIGN",
  "tenantId": "<tenant uuid>",
  "branchId": "<branch uuid or null>",
  "targetUserId": "<uuid>",
  "targetRoleId": "<uuid>",
  "requesterId": "<uuid>",
  "reason": "..."
}
```

Add action-specific fields as needed:
- user create: `email`, `initialBranchIds`, `initialRoleIds`, `isMfaEnabled`
- user update: `before`, `after`
- role create/update: `roleName`, `permissionIds`
- role permission grant/revoke: `permissionId`, `permissionName`

## DTO contracts

### User create
`POST /api/v1/admin/users`
```ts
{
  email: string
  password: string
  isMfaEnabled?: boolean
  branchIds: string[]
  roleIds: string[]
  reason: string
}
```

### User update
`PATCH /api/v1/admin/users/:id`
```ts
{
  email?: string
  isMfaEnabled?: boolean
  reason: string
}
```

### User deactivate/reactivate
`POST /api/v1/admin/users/:id/deactivate`
`POST /api/v1/admin/users/:id/reactivate`
```ts
{
  reason: string
}
```

### User role assign
`POST /api/v1/admin/users/:id/roles`
```ts
{
  roleId: string
  reason: string
}
```

### User role revoke
`DELETE /api/v1/admin/users/:id/roles/:roleId`
```ts
{
  reason: string
}
```

### Role create
`POST /api/v1/admin/roles`
```ts
{
  name: string
  reason: string
}
```

### Role update
`PATCH /api/v1/admin/roles/:id`
```ts
{
  name?: string
  reason: string
}
```

### Role archive
`POST /api/v1/admin/roles/:id/archive`
```ts
{
  reason: string
}
```

### Role permission grant
`POST /api/v1/admin/roles/:id/permissions`
```ts
{
  permissionId: string
  reason: string
}
```

### Role permission revoke
`DELETE /api/v1/admin/roles/:id/permissions/:permissionId`
```ts
{
  reason: string
}
```

## Audit events

Use explicit event keys:
- `ADMIN_USER_CREATED`
- `ADMIN_USER_UPDATED`
- `ADMIN_USER_DEACTIVATION_REQUESTED`
- `ADMIN_USER_DEACTIVATED`
- `ADMIN_USER_REACTIVATION_REQUESTED`
- `ADMIN_USER_REACTIVATED`
- `ADMIN_USER_ROLE_ASSIGNMENT_REQUESTED`
- `ADMIN_USER_ROLE_ASSIGNED`
- `ADMIN_USER_ROLE_REVOCATION_REQUESTED`
- `ADMIN_USER_ROLE_REVOKED`
- `ADMIN_ROLE_CREATED`
- `ADMIN_ROLE_UPDATED`
- `ADMIN_ROLE_ARCHIVE_REQUESTED`
- `ADMIN_ROLE_ARCHIVED`
- `ADMIN_ROLE_PERMISSION_GRANT_REQUESTED`
- `ADMIN_ROLE_PERMISSION_GRANTED`
- `ADMIN_ROLE_PERMISSION_REVOKE_REQUESTED`
- `ADMIN_ROLE_PERMISSION_REVOKED`

Current implemented user lifecycle slice uses:
- `USER_DEACTIVATED`
- `USER_ACTIVATED`

### Audit payload contract
Current `AuditLog` schema stores:
- `tenantId`
- optional `branchId`
- `userId`
- `eventKey`
- `recordType`
- `recordId`
- `oldValues`
- `newValues`

Therefore the spec must not require standalone columns for `ipAddress` or `userAgent`.

If request metadata is needed, store it inside `newValues.requestContext`:
```json
{
  "reason": "...",
  "targetUserId": "...",
  "targetRoleId": "...",
  "before": { ... },
  "after": { ... },
  "requestContext": {
    "ipAddress": "optional",
    "userAgent": "optional"
  }
}
```

## Transaction boundaries

### Direct-execution mutations
These must be wrapped in a single transaction containing:
- scoped read/verification if needed
- mutation write(s)
- audit log creation

### Approval-backed mutations
Request creation transaction must include:
- validation
- self-escalation check
- optional scoped target pre-read
- `ApprovalRequest.create`
- audit log for `*_REQUESTED`

Approval processing transaction must include:
- scoped request fetch
- tenant and branch validation
- status transition using conditional `updateMany`
- resulting domain write(s)
- post-apply audit log

All state-changing writes must fail closed at the mutation predicate.

## Session and token behavior

### Current limitation
The current codebase has stateless JWT access tokens and no token revocation store.

Consequences:
- DB-derived permissions in `/auth/me` reflect changes immediately
- JWT `roles` claim may remain stale until re-login or branch reselection
- implemented user activation/deactivation increments `User.tokenVersion`, invalidating existing target-user JWTs
- future role changes must increment affected users' `User.tokenVersion` before claiming forced token invalidation for authorization changes

### Required implementation behavior
Until token invalidation is wired into each admin mutation, the admin implementation must:
- document that role/permission changes take effect immediately for DB-derived permissions checks
- document that displayed roles in the JWT response may be stale until token refresh
- return a response flag like `requiresReauth: true` for target-user role/permission changes
- not claim immediate universal token invalidation

### Schema prerequisite for true revocation
One of the following is required before promising forced logout or token invalidation:
- `User.tokenVersion` and JWT version checking. New JWTs include `tokenVersion`, and JWT validation rejects mismatches.
- persistent session table with revocation status
- revoked token / `jti` denylist store

## /auth/me compatibility rules

The spec must align with current auth behavior:
- `/auth/me` re-derives permissions from DB, so permission changes are visible there immediately
- JWT `roles` in the request context are stale until new token issuance
- code implementing admin role/permission changes must never trust JWT role names alone for escalation checks; it must read current DB roles/permissions

## Report governance compatibility

This document must acknowledge that report export governance is already implemented and requires:
- `report.export`
- tenant and branch scoping
- non-empty `reason`
- transactional audit creation

Admin governance should mirror those patterns for high-risk actions.

## Test matrix requirements

At minimum, tests must exist for:

### User create/update/deactivate/reactivate
- rejects missing permission
- rejects empty reason
- rejects cross-tenant target
- rejects branch-invisible target for branch admin
- rejects self-escalation scenarios
- creates approval request when required
- writes expected audit event

### User role assignment/revocation
- rejects self-assignment and self-revocation when blocked by policy
- rejects assigning role from another tenant
- rejects branch-out-of-scope target user
- approval request stores exact details payload
- processing requires different approver
- scoped mutation uses tenant predicates

### Role create/update/archive
- rejects duplicate tenant role name where policy requires uniqueness
- rejects archiving role assigned to protected actors if policy blocks it
- rejects privileged permission deltas actor does not currently possess

### Role permission grant/revoke
- rejects cross-tenant role/permission links
- rejects self-escalation via owned role mutation
- approval-backed flow works end-to-end

### Session/token behavior
- `/auth/me` reflects permission changes after approval application
- JWT role claim staleness is documented and tested where observable

## Schema prerequisites

### Required before full endpoint implementation
The current schema is not sufficient for the full behavior implied by the original admin spec.

Required additions or explicit deferrals:

1. `User` lifecycle fields: implemented as schema foundations
- `status` defaults to `ACTIVE`
- optional `deactivatedAt`
- optional `deactivatedReason`
- `tokenVersion` defaults to `0`

2. `Role` lifecycle fields: implemented as schema foundations
- `status` defaults to `ACTIVE`
- optional `archivedAt`
- optional `archivedReason`
- `isSystem` defaults to `false`; seeded built-in roles are marked `true`

3. Token/session invalidation support: partially implemented
- `User.tokenVersion` exists and is enforced for JWT validation
- future governed user or role mutations must increment `User.tokenVersion` in the same transaction as approval application, domain mutation, and audit creation

### Not required immediately
- no new approval table is needed; existing `ApprovalRequest` is sufficient
- no new audit table is needed; existing `AuditLog` is sufficient

## Implementation path

### Phase 0: schema prerequisite pass
- user lifecycle fields: schema foundation implemented
- role archive/system fields: schema foundation implemented
- token/session invalidation: `User.tokenVersion` schema foundation and auth enforcement implemented; mutation-time increments remain deferred

### Phase 1: admin user lifecycle backend
- user create
- user update
- non-privileged user deactivate/activate: implemented with direct audit and transactionally incremented `User.tokenVersion`
- privileged user deactivate/reactivate: deferred pending maker-checker
- user create/update: deferred

### Phase 2: user-role mutation backend
- assign role
- revoke role
- self-escalation blocks
- approval processing
- increment `User.tokenVersion` transactionally for affected users when role assignments change

### Phase 3: role and role-permission backend
- create/update/archive role
- grant/revoke permissions
- protected seeded role behavior

## Final implementation guardrail
Do not implement admin/user/role mutation endpoints until the schema prerequisites and the DTO/audit/approval/session rules in this document are accepted.
