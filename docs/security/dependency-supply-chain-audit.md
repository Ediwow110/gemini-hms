# Dependency and Supply-Chain Audit

**Phase:** S11  
**Date:** 2026-06-01  
**Branch:** `security/s11-dependency-supply-chain-audit`  
**Verdict:** STAGING-ONLY / dependency and supply-chain audit  

---

## 1. Executive Summary

This phase audits npm dependencies, Docker base images, GitHub Actions workflows, and lockfile practices for supply-chain risk.

---

## 2. NPM Dependencies

### Frontend (`hms-frontend`)

```
npm audit --audit-level=moderate
```
- 3 moderate dev-only vulnerabilities (pre-existing, dev-only)
- No critical or high vulnerabilities
- No known malicious packages

### Backend (`hms-backend`)

```
npm audit --audit-level=moderate
```
- 3 moderate dev-only vulnerabilities (pre-existing, dev-only)
- No critical or high vulnerabilities
- No known malicious packages

### Lockfile

- `package-lock.json` committed in both `hms-frontend` and `hms-backend` — GOOD
- Root `package-lock.json` present — GOOD
- CI uses `npm ci` (clean install from lockfile) — GOOD

---

## 3. Docker Base Images

### `hms-frontend/Dockerfile`
- Multi-stage build: `node:20-alpine` → `nginx:alpine`
- **Base image pinned**: `node:20-alpine` (floating minor tag)
- **Risk**: `20-alpine` floats to new patch versions. Recommended: pin to SHA digest

### `hms-backend/Dockerfile`
- Multi-stage build: `node:20-alpine`
- **Base image pinned**: `node:20-alpine` (floating minor tag)
- **Risk**: Same as frontend

**Recommendation**: Pin base images to SHA digests for production.

---

## 4. GitHub Actions Workflows

Workflows in `.github/workflows/`:

| Workflow | Pinned Actions? | Notes |
|----------|----------------|-------|
| CI (`ci.yml`) | Uses `actions/checkout@v4`, `actions/setup-node@v4` — version tags | Version tags (v4) are better than floating `main`, but SHA pinning is more secure |
| Deploy (`deploy.yml`) | Uses version tags | Same as above |

**Recommendation**: Pin all actions to SHA digests for supply-chain integrity.

---

## 5. Prisma CLI

- Prisma CLI is a runtime dependency used for migrations
- `prisma` listed in `devDependencies` — GOOD (not in production runtime)
- Migration execution requires CLI access at deploy time

---

## 6. Build Determinism

- `npm ci` ensures deterministic installs — GOOD
- NestJS build through `nest build` (TypeScript compilation) — deterministic
- Frontend build through Vite — deterministic

---

## 7. Workflow Permissions

- CI workflows use default GITHUB_TOKEN permissions
- **Risk**: Default permissions may be broader than needed
- **Recommendation**: Set `contents: read` and `pull-requests: write` explicitly

---

## 8. Verdict

No critical supply-chain risks found. Moderate recommendations:
1. Pin Docker base images to SHA digests
2. Pin GitHub Actions to SHA digests
3. Set explicit workflow permissions

**STAGING-ONLY / dependency and supply-chain audit complete.**
