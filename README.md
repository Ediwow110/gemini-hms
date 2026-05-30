# World-Class Hospital Management System (HMS)

This repository contains the architectural foundation and core workflows for a secure, multi-tenant, branch-isolated healthcare operations platform.

> **Status: Pre-production release candidate.** Core local/CI gates are passing, but production deployment, external compliance certification, staging validation, backup/restore drills, and operational readiness sign-off are not yet complete.

## Current Production Readiness Position

The system is suitable for local development, demos, internal review, and staging preparation. It should **not** be represented as production-deployed, HIPAA certified, SOC 2 certified, or ready for real patient PHI until the required external and operational gates are completed.

GCP production deployment is intentionally deferred for now. The immediate focus is keeping the codebase stable, removing unsupported compliance branding, and preserving a clean release-candidate baseline.

## Stack

### Frontend
- **Framework**: Vite + React
- **Language**: TypeScript
- **Styling**: TailwindCSS / Vanilla CSS
- **Authentication**: JWT-based client integration for staff and patient workflows

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database ORM**: Prisma (PostgreSQL)
- **Authentication**: Passport-JWT with global fail-closed guards and stateful session management

## Architecture Highlights

- **Multi-Tenant Branch Isolation**: Isolation model built around `tenantId` and `branchId`, with automated verification coverage.
- **Stateful Session Management**: JWTs are verified against a `Session` table, supporting multi-device sessions, session revocation, and refresh-token rotation safeguards.
- **Decoupled Patient Portal Auth**: Dedicated patient auth flow designed to reduce staff/patient privilege-mixing risk.
- **MFA & Break-Glass Recovery**: TOTP MFA support with protected secret storage and bcrypt-hashed one-time recovery codes.
- **Global Fail-Closed Security**: Routes are protected by default; public access requires explicit `@Public()` opt-out.
- **Branch-Scoped Modules**:
  - **Clinical EMR (Encounters & SOAP Notes)**: Role-gated encounters, SOAP notes, locking workflows, diagnosis linkages, prescriptions, and referrals.
  - **Patient Portal**: Scoped patient-facing endpoints for released/allowed patient data.
  - **Orders & Queue**: Branch-aware patient flow and order management.
  - **Billing**: Invoicing, payments, cashier reconciliation, voids, refunds, and ledger-oriented controls.
  - **Laboratory**: Branch-isolated result encoding, validation, and release gating.
  - **Inventory**: Global catalog with branch-specific stock.
  - **HR Management**: Employee profiles, leave tracking, licensing, and termination-driven account controls.
  - **Procurement**: Supplier registry, purchase requests, approvals, purchase orders, and receiving logs.
  - **Referral Partners**: Referral registry and rebate tracking.
- **Audit Engine**: Activity logging and audit-context middleware for sensitive workflows.
- **Background Jobs**: Scheduled notification dispatch for operational alerts.

## Local Setup

### Quick Setup & Recovery (White Screen Fix)
If you encounter a white screen or dependency errors, use the setup scripts:
- **Windows:** Run `./setup.ps1` in PowerShell.
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
| **Foundation / Auth** | Tenant / Branch / Session | Verified by local/CI tests |
| **Clinical EMR** | Tenant / Branch | Verified by local/CI tests |
| **Patient Portal** | Tenant / Patient | Verified by local/CI tests |
| **Insurance Claims** | Tenant / Branch | Verified by local/CI tests |
| **Accounting Ledger** | Tenant / Branch | Verified by local/CI tests |
| **Procurement** | Tenant / Branch | Verified by local/CI tests |
| **Referral Partners** | Tenant | Verified by local/CI tests |
| **HR Management** | Tenant / Branch | Verified by local/CI tests |
| **Patients** | Tenant | Verified by local/CI tests |
| **Orders** | Branch | Verified by local/CI tests |
| **Queueing** | Branch | Verified by local/CI tests |
| **Billing** | Branch | Verified by local/CI tests |
| **Laboratory** | Branch | Verified by local/CI tests |
| **Inventory** | Hybrid | Verified by local/CI tests |

## Readiness Gates

| Gate | Status |
|---|---|
| Local backend/frontend checks | Passing |
| CI build/test/verification | Passing on recent release-candidate work |
| Docker build readiness | Present |
| Staging deployment | Deferred / not yet proven |
| GCP infrastructure | Deferred |
| Backup and restore drill | Not yet proven against staging/production data |
| External security review / penetration test | Not yet completed |
| HIPAA/SOC 2 certification | Not claimed |
| Production operations sign-off | Not yet complete |

## Testing

Core authentication, branch context, branch isolation, and MFA recovery paths are covered by unit and E2E tests.

- **Backend Unit Tests**: `npm run test`
- **Backend E2E Tests**: `npm run test:e2e`
- **Frontend Tests**: `npm run test`
- **Frontend Typecheck**: `npm run typecheck`
- **Frontend Build**: `npm run build`
- **Security/Clinical Verifiers**: project-specific verification scripts under the backend/frontend package scripts

## Known Gaps & Deferred Items

- **Production deployment**: GCP deployment is intentionally deferred until the release-candidate baseline is stable.
- **Compliance**: The project contains compliance-oriented controls, but it is not certified and should not be marketed as certified.
- **Operations**: Backup/restore drills, incident drills, alerting proof, and staging smoke tests still need real-environment evidence.
- **Legacy Inventory Technical Debt**: Existing `currentStock` field on `InventoryItem` remains; use `BranchStock` for production-facing stock workflows.
