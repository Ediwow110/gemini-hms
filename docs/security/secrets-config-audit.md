# Secrets and Sensitive Config Audit

**Phase:** S12  
**Date:** 2026-06-01  
**Branch:** `security/s12-secrets-config-audit`  
**Verdict:** STAGING-ONLY / secrets and config audit  

---

## 1. Executive Summary

Audit of secrets, environment variables, demo credentials, and sensitive configuration exposure.

---

## 2. Findings

### .env.example Files
- `hms-backend/.env.example` — present, contains placeholder values, no real secrets
- `hms-frontend/.env.example` — present, contains placeholder values, no real secrets

### Committed Secrets
- No real secrets found in committed files
- No API keys, passwords, tokens, or private keys in source code
- git-secrets scan: PASS (no committed secrets)

### Demo Credentials
- Demo data scripts clearly labeled as `demo` in filenames
- `scripts/check-demo-data.ts` — checks for demo data presence
- `scripts/fix-demo-data.ts` — fixes demo data issues
- All demo credentials use placeholder values

### CI Environment Variables
- CI workflows use GitHub Secrets for sensitive values
- `JWT_SECRET`, `DATABASE_URL`, `MASTER_MFA_KEY` set via GitHub Secrets
- `DISABLE_AUTH_VERIFICATION` explicitly set to `'false'` in CI

### Production Config Enforcement
- `docker-compose.prod.yml` requires `CORS_ALLOWED_ORIGINS` — fail-closed
- `JWT_SECRET` min 32 chars enforced in `jwt.strategy.ts:29`
- `MASTER_MFA_KEY` min 32 chars enforced in `mfa.service.ts:27`

### CORS Configuration
- `main.ts`: requires `CORS_ALLOWED_ORIGINS` in production
- Falls back to `http://localhost:5173` for development
- Production deploy requires explicit environment variable

### DISABLE_AUTH_VERIFICATION Guard
- `auth.service.ts:198`: checks `process.env.DISABLE_AUTH_VERIFICATION === 'true'`
- CI: explicitly set to `'false'`
- Production compose: not set (defaults to undefined, treated as disabled)
- `scripts/check_runtime_config.py`: checks for this bypass flag

---

## 3. Assessment

No real secrets committed. Demo credentials are clearly labeled. Production secrets are enforced. No critical issues found.

**Low-risk recommendations:**
1. Add a pre-commit hook to scan for potential secrets
2. Document all required env vars in a single reference file

**STAGING-ONLY / secrets and config audit complete.**
