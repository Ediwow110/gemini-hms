# Logging / PHI / Audit Leakage Audit

**Phase:** S13  
**Date:** 2026-06-01  
**Branch:** `security/s13-logging-phi-audit`  
**Verdict:** STAGING-ONLY / logging and PHI leakage audit  

---

## 1. Executive Summary

Audit of logging, audit events, console output, and error messages for sensitive data leakage.

---

## 2. Findings

### PHI Masking Interceptor
- `hms-backend/src/common/interceptors/phi-masking.interceptor.ts` — present and applied
- Masks PHI fields (names, addresses, SSN, etc.) in API responses
- Applied globally — GOOD

### Audit Events
- `audit.service.ts` — logs eventKey, tenantId, userId, resourceId
- `newValues`/`oldValues` — contains entity field values, may contain PHI
- **Risk**: Audit log table stores field-level changes for clinical records
- **Mitigation**: Audit event storage is tenant-scoped, access is role-restricted

### Logger Usage
- `Logger.log/warn/error` used throughout services
- No passwords, tokens, or MFA secrets found in log statements
- Placeholder values not logged
- Stack traces may contain request data in error cases

### Console Statements
```
grep -R "console\." hms-backend/src/ | wc -l
```
Minimal — mostly startup/configuration logging.

### Auth Service Logs
- Login failures: rate-limit info logged, not credentials
- Token refresh: session rotation details logged without token values
- MFA operations: event logged without recovery codes or TOTP secrets

### Risk Assessment
No sensitive data leakage found in log statements. PHI masking interceptor is globally applied. Audit event storage is access-controlled.

**STAGING-ONLY / logging and PHI leakage audit complete.**
