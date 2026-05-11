# World-Class Hospital Management System (HMS)

This repository contains the architectural foundation and core workflows for a secure, multi-tenant, branch-isolated healthcare operations platform.

> **Status: NOT PRODUCTION READY**
> This codebase represents the architectural foundation and critical security workflows (Permissions, Audit, Approvals, Branch Isolation). It is a highly-structured starting point, but requires further hardening, deployment configuration, and exhaustive testing before real clinical or financial use.

## Stack

### Frontend
- **Framework**: Vite + React
- **Language**: TypeScript
- **Styling**: TailwindCSS / Vanilla CSS
- **Authentication**: JWT-based (Frontend integration in progress)

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database ORM**: Prisma (PostgreSQL)
- **Authentication**: Passport-JWT with Role-Based Access Control (RBAC)

## Architecture Highlights

- **Multi-Tenant Branch Isolation**: Robust isolation using `tenantId` and `branchId`. 
- **Branch Context Selection**: Users must select an authorized branch context via `/api/v1/auth/select-branch` to access branch-scoped resources.
- **Granular Permissions & Roles**: Strict `RolesGuard` and `PermissionsGuard` enforcement.
- **Branch-Scoped Modules**:
  - **Orders & Queue**: Isolated patient flow and order management.
  - **Billing**: Branch-specific invoicing and payments.
  - **Laboratory**: Branch-isolated result encoding and validation.
  - **Inventory**: Catalog-Stock split. Global catalog (`InventoryItem`) with branch-specific stock (`BranchStock`).
- **Hybrid HR Model**: Multi-branch assignment via `EmployeeBranch`, supporting both tenant-wide oversight and branch-scoped administration.
- **Audit & Approvals**: Centralized audit logging and Maker-Checker approval workflows.
- **Idempotent Numbering Engine**: Transaction-safe sequence generation (e.g., `PT-000001`).

## Local Setup

### Backend
1. `cd hms-backend`
2. `npm install`
3. Create a `.env` file from the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your actual `DATABASE_URL` and a secure `JWT_SECRET` (minimum 32 characters).
5. Run migrations and seed the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```
6. Start development server: `npm run start:dev`

### Frontend
1. `cd hms-frontend`
2. `npm install`
3. Start development server: `npm run dev`

## Core Modules & Isolation Status

| Module | Isolation Level | Status |
|---|---|---|
| **Foundation / Auth** | Tenant / Branch | Implemented |
| **Patients** | Tenant | Implemented |
| **Orders** | Branch | Implemented |
| **Queueing** | Branch | Implemented |
| **Billing** | Branch | Implemented |
| **Laboratory** | Branch | Implemented |
| **Inventory** | Hybrid (Catalog Global / Stock Branch) | Implemented |
| **HR** | Role-Aware (Tenant or Branch) | Implemented |

## Testing

Core authentication, branch context, and branch-isolation paths are verified with unit and E2E tests.
- **Unit Tests**: `npm run test`
- **E2E Tests**: `npm run test:e2e`

*Note: While core paths are tested, production-grade coverage is still incomplete.*

## Known Gaps & Deferred Items

- **Frontend Auth Integration**: Real JWT handling and route guarding in the frontend are still pending.
- **Notification Dispatch**: Background workers for real Email/SMS dispatch are not yet implemented.
- **Production Readiness**: Deployment scripts, monitoring, and detailed runbooks are pending.
- **Legacy Inventory Migration**: Existing `currentStock` field on `InventoryItem` remains as prototype technical debt; use `BranchStock` for new features.
- **HR Expansion**: Full payroll, attendance, and leave management are deferred. `Employee.userId` link for self-service is pending.
- **Cross-Branch Admin Policy**: Detailed policy for multi-branch administrative overrides is deferred.
