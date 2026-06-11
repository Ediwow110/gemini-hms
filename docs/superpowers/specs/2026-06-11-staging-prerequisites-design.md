# Design Spec: Staging Environment Prerequisites

**Date**: 2026-06-11
**Status**: Draft
**Topic**: Staging / Deployment Readiness - Task 1

## 1. Overview
Formalize the explicit requirements for the staging environment to guide the platform/DevOps teams. This document serves as the technical handoff for provisioning cloud infrastructure.

## 2. Requirements

### 2.1 Compute Environment
- **Runtime**: OCI-compliant container runtime (Docker, containerd).
- **Resources**: 
    - Minimum: 2 vCPU, 4GB RAM.
    - Recommended: 4 vCPU, 8GB RAM (to handle spike loads during E2E).
- **Registry Access**: The environment must have authenticated access to a private container registry.
- **Isolation**: Dedicated environment (e.g., K8s namespace `hms-staging` or a standalone VPC/Subnet for VM-based deployment).

### 2.2 Database Requirements
- **Engine**: PostgreSQL 15.x+.
- **Connectivity**: Private network access only; no public IP unless via a secure VPN/Bastion.
- **Data Integrity**: Automated daily snapshots; 7-day retention minimum.
- **Extensions**: `uuid-ossp` and standard Prisma-compatible extensions must be supported.

### 2.3 Network Requirements
- **Termination**: TLS termination at the edge (Load Balancer or Ingress).
- **Protocols**: HTTPS/WSS (WebSockets) support.
- **DNS**: Dedicated staging subdomains (e.g., `api.staging.hms.local`, `app.staging.hms.local`).
- **Firewall**: Egress restricted to necessary external APIs; Ingress restricted to 80/443.

### 2.4 Secret Management
- **Provider**: Managed vault service (e.g., GCP Secret Manager, AWS Secrets Manager).
- **Injection**: Secrets must be injected as environment variables at runtime, never stored in images.
- **Mandatory Keys**:
    - `DATABASE_URL`
    - `JWT_SECRET`
    - `MASTER_MFA_KEY`
    - `AUDIT_HMAC_SECRET`
    - `CORS_ALLOWED_ORIGINS`

### 2.5 Infrastructure/IAM Blockers
- **Identity**: Dedicated `hms-staging-deployer` service account.
- **Role Scope**:
    - `Compute Admin` (Scoped to staging namespace/VPC).
    - `Artifact Registry Reader`.
    - `Cloud SQL Client`.
    - `Secret Manager Secret Accessor`.
- **Constraint**: Zero permissions on production projects/resources.

## 3. Implementation Plan
1. Create `docs/deployment/` directory.
2. Create `docs/deployment/STAGING_PREREQUISITES.md` with the finalized requirements.
3. Verify the document against the initial task description.
4. Commit and report.
