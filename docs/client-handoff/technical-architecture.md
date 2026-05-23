# Gemini-HMS Technical Architecture Summary

## Overview
Gemini-HMS is a decoupled web application with a React-based frontend and a NestJS-based backend, utilizing PostgreSQL for persistent storage and Prisma as the ORM.

## Frontend Architecture
- **Framework**: React (TypeScript).
- **State Management**: React Query (TanStack) for server-state, Context API for UI-state.
- **Styling**: Vanilla CSS / Tailwind (where applicable).
- **Security**: 
  - Zero sensitive tokens in `localStorage`.
  - Content Security Policy (CSP) headers ready.
  - Automatic session timeout logic.

## Backend Architecture
- **Framework**: NestJS (Node.js).
- **API Style**: RESTful with DTO validation.
- **Security Hardening**:
  - `httpOnly` and `Secure` cookies for all sessions.
  - Custom CSRF guards for all unsafe methods.
  - PHI Masking interceptors for unauthorized data access.
- **Audit System**: Forensically signed audit logs with HMAC-SHA256 chain of custody.

## Database Model
- **Engine**: PostgreSQL 15+.
- **ORM**: Prisma.
- **Isolation**: Row-level-like isolation enforced via `tenantId` and `branchId` requirements in all repository queries.
- **Concurrency**: Optimistic locking on clinical records and inventory.

## Security & Privacy Posture
- **Staff/Patient Separation**: Entirely separate auth guards and token domains for staff and patients.
- **Mutation Boundary**: A strict allowlist of exactly 13 mutations prevents "shadow" clinical changes.
- **PII Handling**: Synthetic data is used for all development and demonstration. No production data has been ingested.

## Infrastructure Requirements
- **Runtime**: Docker & Docker Compose.
- **Compute**: Minimum 2 vCPU / 4GB RAM (Staging).
- **Storage**: SSD-backed PostgreSQL.
- **Networking**: Cloud Load Balancer with SSL Termination (Terminates at 443, proxies to internal 3000/5173).

## CI/CD Pipeline
- **Provider**: GitHub Actions.
- **Stages**:
  1. `guard`: Repository hygiene and secret scanning.
  2. `build`: Containerization of frontend and backend.
  3. `test`: Full unit and E2E test suites.
  4. `verifiers`: Custom scripts that enforce the mutation boundary and security config.
