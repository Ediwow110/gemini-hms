# World-Class Hospital Management System (HMS) Blueprint

This repository contains the foundation and core workflows for a secure, permission-first, audit-ready healthcare operations platform.

> **Status: NOT PRODUCTION READY**
> This codebase represents the architectural foundation and critical security workflows (Permissions, Audit, Approvals). It is a highly-structured starting point, but requires further hardening, deployment configuration, and exhaustive testing before real clinical or financial use.

## Stack

### Frontend
- **Framework**: Vite + React
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Hooks (Mocked Context)

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Database Engine**: PostgreSQL
- **Authentication**: Passport-JWT

## Local Setup

### Backend
1. `cd hms-backend`
2. `npm install`
3. Set up environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/hms_db?schema=public"
   JWT_SECRET="YOUR_MINIMUM_32_CHAR_SECRET_HERE_DO_NOT_USE_DEFAULT"
   ```
   *(Note: The server will fail to start if `JWT_SECRET` is missing, less than 32 characters, or using a placeholder).*
4. Run migrations: `npx prisma db push`
5. Start development server: `npm run start:dev`

### Frontend
1. `cd hms-frontend`
2. `npm install`
3. Start development server: `npm run dev`

## Core Modules Implemented

- **Granular Permissions Guard**: Replaced basic role checks with strict `RequirePermissions` matching tenant-scoped data.
- **Idempotent Numbering Engine**: Transaction-safe ID generation (e.g., `PT-2026-0001`) preventing race conditions.
- **Maker-Checker Approvals Engine**: Centralized workflow requiring peer review for high-risk actions (refunds, lab amendments).
- **LIS Amendment Versioning**: Immutable lab results with formal amendment request and archival workflows.
- **Audit Logging Engine**: Atomic transaction logging for critical actions (Dispensing, Cashier closing).
- **Low-Stock Alerts**: Database triggers generating `PENDING` notifications to Pharmacists upon dropping below reorder levels.

## Known Gaps & Deferred Items

- **HR & Payroll**: Schema exists but is explicitly deferred. Do not build payroll logic or UI yet.
- **True Auth Integration**: Frontend currently uses a mocked `use-user.ts` hook instead of a real `/api/v1/auth/login` HTTP call.
- **Notification Dispatch**: The `Notification` table captures alerts, but no background worker exists to dispatch real emails/SMS.
- **Cashier Reconciliation**: The UI calculates variance, but requires physical hardware integration and real HTTP wiring.
- **Tests**: Core logic has basic tests, but e2e and coverage are severely lacking.
