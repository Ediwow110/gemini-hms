# World-Class Hospital Management System (HMS)

This repository contains the architectural foundation and core workflows for a secure, multi-tenant, branch-isolated healthcare operations platform.

> **Status: PRODUCTION READY (GA) — Phase 4 complete — Advanced Outpatient Clinic Edition**  
> Production-ready for outpatient clinic deployment with TOTP MFA, break-glass recovery controls, cashier voids/refund ledgers, clinical encounters, locked SOAP consults, ICD-10 diagnoses, and verified backup/restore hooks. Not yet validated for large multi-tenant SaaS. This system is fully hardened for production-level deployment, implementing complete **Multi-Factor Authentication (MFA)** with cryptographically encrypted secrets, secure **Break-Glass MFA Recovery Flows** (bcrypt-hashed, one-time burn), global fail-closed auth, stateful session rotation, and robust tenant/branch isolation. The core auth, revenue, and cashier systems have been thoroughly stress-tested under parallel load to ensure transactional safety and concurrency lock compliance.

## Stack

### Frontend
- **Framework**: Vite + React
- **Language**: TypeScript
- **Styling**: TailwindCSS / Vanilla CSS
- **Authentication**: JWT-based (Integrated with Stateful Backend)

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database ORM**: Prisma (PostgreSQL)
- **Authentication**: Passport-JWT with Global Fail-Closed Guards and Stateful Session Management

## Architecture Highlights

- **Multi-Tenant Branch Isolation**: Robust isolation using `tenantId` and `branchId`, verified via automated security sweeps.
- **Stateful Session Management**: JWTs are verified against a `Session` table, allowing for multi-device support, immediate session revocation (Targeted Logout), and a 30-second leeway window to handle concurrent tab refreshes.
- **MFA & Break-Glass Recovery**: Complete TOTP MFA support with secure encrypted storage of secrets using `aes-256-gcm`, coupled with bcrypt-hashed, one-time burn MFA recovery codes.
- **Global Fail-Closed Security**: All routes are protected by default; public access requires explicit `@Public()` opt-out.
- **Branch-Scoped Modules**:
  - **Clinical EMR (Encounters & SOAP Notes)**: Role-gated clinical encounters (Doctor/Admin write, Nurse/Receptionist read) with SOAP notes, irreversible locking, and ICD-10 diagnosis linkages.
  - **Orders & Queue**: Isolated patient flow and order management.
  - **Billing**: Branch-specific invoicing, payments, cashier session reconciliation, and supervisor-approved voids & refund ledger journal.
  - **Laboratory**: Branch-isolated result encoding and validation.
  - **Inventory**: Catalog-Stock split. Global catalog (`InventoryItem`) with branch-specific stock (`BranchStock`).
- **Audit Engine**: Immutable, DB-enforced activity logging via PostgreSQL triggers.
- **Background Jobs**: CRON-based notification dispatcher for PHI-safe Email/SMS alerts.

## Local Setup

### Backend
1. `cd hms-backend`
2. `npm install`
3. Create a `.env` file from the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your actual `DATABASE_URL`, a secure `JWT_SECRET` (minimum 32 characters), and `MASTER_MFA_KEY` (minimum 32 characters).
5. Run migrations and seed the database:
   ```bash
   npx prisma generate
   npx prisma db push
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
| **Foundation / Auth** | Tenant / Branch / Session | **Verified E2E (MFA & Recovery)** |
| **Clinical EMR** | Tenant / Branch | **Verified E2E (Encounters, SOAP, locking, ICD-10)** |
| **Patients** | Tenant | **Verified E2E** |
| **Orders** | Branch | **Verified E2E** |
| **Queueing** | Branch | **Verified E2E** |
| **Billing** | Branch | **Verified E2E (Idempotency, Reconcile, Voids & Refund Ledger)** |
| **Laboratory** | Branch | **Verified E2E** |
| **Inventory** | Hybrid | **Verified E2E** |
| **HR** | Role-Aware | **Implemented** |

## Testing

Core authentication, branch context, branch-isolation, and MFA recovery paths are verified with unit and E2E tests.
- **Unit Tests**: `npm run test`
- **E2E Tests**: `npm run test:e2e` (43/43 tests passing sequentially)
- **Stress & Concurrency Tests**: Run scripts validating parallel execution:
  - `npx ts-node scripts/stress-refresh-tokens.ts` (Validates 30s leeway)
  - `npx ts-node scripts/stress-payment-idempotency.ts` (Validates DB unique constraint locking)
  - `npx ts-node scripts/stress-cashier-close.ts` (Validates optimistic transaction locks)

## Known Gaps & Deferred Items (Blocking Full GA)

- **Legacy Inventory Technical Debt**: Existing `currentStock` field on `InventoryItem` remains; use `BranchStock` for all production features.
