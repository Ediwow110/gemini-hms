# Access Control Policy

## Overview
This document defines the backend and frontend access control models for the Gemini HMS platform. Real security is enforced server-side, with the frontend acting as a user experience guard.

## Core Rules
1. **Frontend vs. Backend**: Frontend route guards (e.g. `portalRoutes.ts`) manage navigation visibility. All NestJS API endpoints enforce identity, role, permission, tenant, and branch-level boundaries independently.
2. **Tenant Scoping**: All database operations must explicitly scope queries to `tenantId` resolved from the validated request JWT.
3. **Branch Scoping**: Staff actions and EMR access are strictly bounded to the user's active `branchId` configuration, preventing cross-branch data access.
4. **Patient Own-Data**: Patient endpoints resolve patient identity directly from the validated JWT token rather than accepting arbitrary request parameters.

## Roles Matrix
- **Super Admin**: Platform-wide governance (tenants, branches, RBAC catalog, system settings). No direct access to patient EMR or supplier listings unless explicitly assigned.
- **Branch Admin**: Scoped branch management (staff, equipment, departments, local rules).
- **Clinical Staff (Doctor, Nurse, Lab Tech, Pharmacist)**: Workflow execution within their active branch scope.
- **Patient**: Read-only self-service to finalized and released records only.
- **Supplier**: Management of own product listings, quotes, and orders.
- **Marketplace Buyer / Customer**: Cart, checkout, and RFQs for own profile.
- **Marketplace Admin**: Moderation of listings, suppliers, and order arbitration.
