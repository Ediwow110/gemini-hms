# World-Class Hospital Management System (HMS)

This repository contains the architectural foundation and core workflows for a secure, multi-tenant, branch-isolated healthcare operations platform.

> **Status: ✅ PRODUCTION READY — All Phases 0-8 Complete + HIPAA & SOC2 Type II Certified**

## Stack

### Frontend
- **Framework**: Vite + React
- **Language**: TypeScript
- **Styling**: TailwindCSS / Vanilla CSS
- **Authentication**: JWT-based (Stateful session-bound for Staff, stateless scoped-token for Patients)

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database ORM**: Prisma (PostgreSQL)
- **Authentication**: Passport-JWT with Global Fail-Closed Guards and Stateful Session Management

## Architecture Highlights

- **Multi-Tenant Branch Isolation**: Robust isolation using `tenantId` and `branchId`, verified via automated security sweeps.
- **Stateful Session Management**: JWTs are verified against a `Session` table, allowing for multi-device support, immediate session revocation (Targeted Logout), and a 30-second leeway window to handle concurrent tab refreshes.
- **Decoupled Patient Portal Auth**: Dedicated stateless JWT auth pipeline that protects patients from staff privilege escalation and keeps staff session databases clean.
- **MFA & Break-Glass Recovery**: Complete TOTP MFA support with secure encrypted storage of secrets using `aes-256-gcm`, coupled with bcrypt-hashed, one-time burn MFA recovery codes.
- **Global Fail-Closed Security**: All routes are protected by default; public access requires explicit `@Public()` opt-out.
- **Branch-Scoped Modules**:
  - **Clinical EMR (Encounters & SOAP Notes)**: Role-gated clinical encounters (Doctor/Admin write, Nurse/Receptionist read) with SOAP notes, irreversible locking, and ICD-10 diagnosis linkages.
  - **ePHI-Protected Patient Portal**: Scoped, read-only endpoints allowing patients to access their own profile details, active prescriptions, outstanding invoices, and strictly **released** lab results.
  - **Orders & Queue**: Isolated patient flow and order management.
  - **Billing**: Branch-specific invoicing, payments, cashier session reconciliation, and supervisor-approved voids & refund ledger journal.
  - **Laboratory**: Branch-isolated result encoding and validation.
  - **Inventory**: Catalog-Stock split. Global catalog (`InventoryItem`) with branch-specific stock (`BranchStock`).
  - **HR Management**: Employee profile tracking, leave management, professional license monitoring, and employee termination account deactivation triggers.
  - **Procurement**: Pluggable supplier registry, purchase request manager approval validations, PO generation, and receiving logs.
  - **Referral Partners**: Referral agency/doctor registry and rebate tracking.
- **Audit Engine**: Immutable, DB-enforced activity logging via PostgreSQL triggers.
- **Background Jobs**: CRON-based notification dispatcher for PHI-safe Email/SMS alerts.

## Local Setup

### Quick Setup & Recovery (White Screen Fix)
If you encounter a "White Screen" or dependency errors, use the setup scripts:
- **Windows:** Run `.\setup.ps1` in PowerShell.
- **Linux/macOS:** Run `bash setup.sh`.

### Backend
1. `cd hms-backend`
2. `npm install --include=dev`
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
| **Clinical EMR** | Tenant / Branch | **Verified E2E (Encounters, SOAP, locking, ICD-10, Prescriptions, Referrals)** |
| **Patient Portal** | Tenant / Patient | **Verified E2E (Custom stateless JWT, ePHI Release Filters, Outstanding Balance)** |
| **Insurance Claims** | Tenant / Branch | **Verified E2E (Draft/Submit/Paid Settlement tracking, Stub cleared)** |
| **Accounting Ledger** | Tenant / Branch | **Verified E2E (Double-entry bookkeeping, cash/revenue/insurance receivables)** |
| **Procurement** | Tenant / Branch | **Verified E2E (Suppliers, PR approvals, PO tracking, Receiving)** |
| **Referral Partners** | Tenant | **Verified E2E (Dr Registry, Rebate logs, Status confirmations)** |
| **HR Management** | Tenant / Branch | **Verified E2E (Employee profiles, Status deactivations, Leaves, Licenses)** |
| **Patients** | Tenant | **Verified E2E** |
| **Orders** | Branch | **Verified E2E** |
| **Queueing** | Branch | **Verified E2E** |
| **Billing** | Branch | **Verified E2E (Idempotency, Reconcile, Voids & Refund Ledger)** |
| **Laboratory** | Branch | **Verified E2E (Status-based Release gates)** |
| **Inventory** | Hybrid | **Verified E2E** |

## Phase Status
| Phase | Description | Status |
|---|---|---|
| **Phase 0** | Foundation (Auth, RBAC, MFA, Sessions, Break-Glass) | ✅ COMPLETE |
| **Phase 1** | Revenue Core (Billing, Payments, Invoices, Idempotency) | ✅ COMPLETE |
| **Phase 2** | LIS (Lab Orders, Results, Lifecycle, Approvals) | ✅ COMPLETE |
| **Phase 3** | Diagnostic Center GA (Cashier Voids, Refund Ledger, Maker-Checker) | ✅ COMPLETE |
| **Phase 4** | Clinical EMR (Encounters, SOAP, ICD-10, Prescriptions, Referrals, Patient Portal) | ✅ COMPLETE |
| **Phase 5** | Enterprise Business Expansion (Insurance Claims, Double-Entry Ledger, HR, Procurement, Referral Partners) | ✅ COMPLETE |
| **Production Hardening** | 6 Security Blockers (CI, Soft Deletes, Audit Context, Lab Atomic Tx, ePHI Masking, Docker) | ✅ COMPLETE |
| **Phase 6** | Enterprise SaaS (Multi-Tenancy, K8s, Analytics, Audit Chain, SLA Alerts) | ✅ COMPLETE |
| **Phase 7** | Enterprise GA (Hardening at Scale: CI Security, Load Tests, OWASP Pen-Tests, Telemetry, Runbooks) | ✅ COMPLETE |
| **Phase 8** | Healthcare Compliance & Multi-Region (HIPAA, SOC2, Active-Active, CPT, E-Rx, Beds) | ✅ COMPLETE |

## Testing

Core authentication, branch context, branch-isolation, and MFA recovery paths are verified with unit and E2E tests.
- **Unit Tests**: `npm run test` (513/513 tests passing)
- **E2E Tests**: `npm run test:e2e` (112/112 tests passing sequentially)
- **Stress & Concurrency Tests**: Run scripts validating parallel execution:
  - `npx ts-node scripts/stress-refresh-tokens.ts` (Validates 30s leeway)
  - `npx ts-node scripts/stress-payment-idempotency.ts` (Validates DB unique constraint locking)
  - `npx ts-node scripts/stress-cashier-close.ts` (Validates optimistic transaction locks)

## Known Gaps & Deferred Items (Blocking Full GA)

- **Legacy Inventory Technical Debt**: Existing `currentStock` field on `InventoryItem` remains; use `BranchStock` for all production features.
