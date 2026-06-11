# Staging Prerequisites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Formalize the explicit requirements for the staging environment to guide the platform/DevOps teams.

**Architecture:** Create a new markdown document `docs/deployment/STAGING_PREREQUISITES.md` that defines compute, database, network, secret management, and IAM requirements.

**Tech Stack:** Markdown

---

### Task 1: Initialize Directory and Document

**Files:**
- Create: `docs/deployment/STAGING_PREREQUISITES.md`

- [ ] **Step 1: Create the docs/deployment directory if it doesn't exist**

Run: `mkdir -p docs/deployment`

- [ ] **Step 2: Create STAGING_PREREQUISITES.md with full content**

```markdown
# HMS Staging Environment Prerequisites

This document formalizes the explicit requirements for the HMS staging environment to guide platform and DevOps teams during infrastructure provisioning.

## 1. Compute Environment Requirements
- **Runtime**: Standard OCI-compliant container runtime (Docker, containerd).
- **Resources**: 
    - Minimum: 2 vCPU, 4GB RAM.
    - Recommended: 4 vCPU, 8GB RAM.
- **Container Registry**: Authenticated access to a private container registry for pulling HMS images.
- **Environment Isolation**: Dedicated staging environment (e.g., Kubernetes namespace `hms-staging` or a standalone VPC/Subnet for VM-based deployment) to ensure cross-environment isolation.

## 2. Database Requirements
- **Engine**: PostgreSQL 15.0 or higher.
- **Network Isolation**: Accessible only from the compute environment; no public IP or public access.
- **Persistence**: Automated daily snapshots with a minimum 7-day retention period.
- **Recovery**: Support for Point-in-Time Recovery (PITR).
- **Migration Support**: The deployment principal must have permissions to execute Prisma migrations (`npx prisma migrate deploy`).

## 3. Network Requirements
- **Ingress**: Load Balancer or Ingress Controller listening on ports 80 (HTTP) and 443 (HTTPS).
- **TLS/HTTPS**: Mandatory TLS 1.2+ termination at the edge.
- **DNS**: Dedicated staging subdomains (e.g., `api.staging.hms.example`, `app.staging.hms.example`).
- **Firewall/Egress**: Restricted egress to necessary external services only.

## 4. Secret Management Strategy
- **Secure Vault**: Requirement for a managed secret vault service (e.g., GCP Secret Manager, AWS Secrets Manager, HashiCorp Vault).
- **Injection**: Secrets must be injected as environment variables at runtime.
- **Mandatory Secrets**:
    - `DATABASE_URL`: Full PostgreSQL connection string.
    - `JWT_SECRET`: Minimum 32-character random string for token signing.
    - `MASTER_MFA_KEY`: Secret key for MFA operations.
    - `AUDIT_HMAC_SECRET`: Key for audit log integrity verification.
    - `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed origins (e.g., staging frontend URL).

## 5. Infrastructure / IAM Blockers
- **Deployment Principal**: A dedicated Service Account or IAM Identity for deployment (e.g., `hms-staging-deployer`).
- **Minimal Permissions**:
    - **Compute**: Permission to create/update pods or VMs in the staging namespace/VPC.
    - **Database**: `Cloud SQL Client` (or equivalent) for database connectivity.
    - **Registry**: `Artifact Registry Reader` (or equivalent) to pull images.
    - **Secrets**: `Secret Manager Secret Accessor` (or equivalent) for the mandatory secrets.
- **Isolation Guarantee**: The deployment principal must have NO permissions on production projects or resources.
```

- [ ] **Step 3: Verify the file exists and has content**

Run: `ls -l docs/deployment/STAGING_PREREQUISITES.md`

- [ ] **Step 4: Commit the document**

```bash
git add docs/deployment/STAGING_PREREQUISITES.md
git commit -m "docs: add staging environment prerequisites"
```
