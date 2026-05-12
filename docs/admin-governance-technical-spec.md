# Admin/User/Role Management Governance Specification

## Overview
This document outlines the governance requirements for implementing runtime API endpoints to manage Users, Roles, and Permissions. Given the privilege-escalation risks involved in these operations, this specification mandates strict adherence to security-first design patterns.

## API Surfaces

### A. User Management
- `POST /api/v1/admin/users`: Create user.
- `PATCH /api/v1/admin/users/:id`: Update user profile.
- `POST /api/v1/admin/users/:id/deactivate`: Deactivate/archive user.
- `POST /api/v1/admin/users/:id/activate`: Re-activate user.

### B. User Role Assignment
- `POST /api/v1/admin/users/:id/roles`: Assign role to user.
- `DELETE /api/v1/admin/users/:id/roles/:roleId`: Remove role from user.

### C. Role Management
- `POST /api/v1/admin/roles`: Create new role.
- `PATCH /api/v1/admin/roles/:id`: Update role info.
- `POST /api/v1/admin/roles/:id/archive`: Soft-delete/archive role.

### D. Role Permission Management
- `POST /api/v1/admin/roles/:id/permissions`: Grant permission to role.
- `DELETE /api/v1/admin/roles/:id/permissions/:permissionId`: Revoke permission from role.

## Governance Controls

### 1. Permissions & Scoping
- **Require Permission:** All endpoints require `admin.role.change`.
- **Tenant Scope:** Every operation must be restricted to the `tenantId` of the authenticated actor.
- **Branch Scope:** Admin users are confined to their assigned branches; lateral branch mutation is forbidden unless explicitly permitted.

### 2. Safeguards
- **Reason Requirement:** A non-empty reason string must accompany every mutation request, which is recorded in the audit event.
- **Self-Escalation Block:** The backend must explicitly reject any request that results in:
  - Actor assigning/revoking roles for themselves.
  - Actor increasing their own access via role/permission mutation.
  - Actor creating a role with permissions they do not themselves possess.

### 3. Auditing
- **Required Events:** `USER_CREATED`, `USER_UPDATED`, `USER_DEACTIVATED`, `ROLE_CHANGED`, `ROLE_CREATED`, `ROLE_ARCHIVED`, `ADMIN_PERMISSION_GRANTED`, `ADMIN_PERMISSION_REVOKED`.
- **Payload:** Must include `tenantId`, `actorId`, `targetId`, `reason`, `beforeValues`, `afterValues`, `createdAt`, `ipAddress`, and `userAgent`.

### 4. Implementation Plan
- **Phase 1 (Governance):** Implement `Audit` logging for existing static seed-based changes if possible, and build the infrastructure for approval-based workflows if required for high-risk operations.
- **Phase 2 (User Mgmt):** Implement the API surface for `Users` and `UserRole` assignments with full reason validation and audit coverage.
- **Phase 3 (Role/Perm Mgmt):** Implement `Roles` and `Permissions` mutation endpoints with self-escalation guards.

## Production Gap Note
The current implementation of the system relies on `seed.ts` for role definition. Runtime modification of these roles is currently a production gap that should not be bypassed via raw DB manipulation.
