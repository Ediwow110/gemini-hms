# Rate-Limit and Abuse-Resistance Audit

**Phase:** S15  
**Date:** 2026-06-01  
**Branch:** `security/s15-rate-limit-abuse-audit`  
**Verdict:** STAGING-ONLY / rate-limit and abuse-resistance audit  

---

## 1. Executive Summary

Audit of rate-limiting, brute-force protection, enumeration prevention, and abuse resistance.

---

## 2. Findings

### Rate-Limiting Configuration
- Global: 100 requests/min (ThrottlerGuard)
- Auth endpoints: 5 requests/60s
- Sensitive operations: 20 requests/min
- Login: 5 requests/60s (rate-limited)

### Authentication Endpoints
- **Login**: rate-limited (5/60s), lockout after 5 failures (15 min)
- **MFA verify**: rate-limited via global throttle
- **MFA recovery**: rate-limited via global throttle
- **Password reset**: Not implemented in this version
- **Activation**: Not implemented in this version
- **Patient portal login**: rate-limited

### Search/Enumeration Risk
- Patient search: authenticated, role-checked
- No unauthenticated enumeration endpoints
- User/email existence not exposed in error messages (generic "Invalid credentials")

### Expensive Endpoints
- Dashboard endpoints: paginated, tenant-scoped
- Reports: role-checked, paginated
- Exports: not implemented in API

### `@SkipThrottle` Usage
- No `@SkipThrottle` found in codebase — all endpoints are throttled

### Assessment
Rate-limiting is properly applied to auth endpoints. No unauthenticated enumeration vectors found. Expensive endpoints are authenticated and paginated.

**STAGING-ONLY / rate-limit and abuse-resistance audit complete.**
