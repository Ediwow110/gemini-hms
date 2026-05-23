# Auth Token Storage Migration Plan

## Status: DEFERRED — BLOCKING BEFORE PRODUCTION

## Current Risk

Authentication tokens (JWT) are stored in `localStorage` across the application. This is a **P0 security risk** because:
- XSS attacks can exfiltrate tokens from `localStorage` and hijack sessions
- `localStorage` is accessible to any JavaScript running on the same origin
- No httpOnly, Secure, or SameSite protections apply

## Current Token Storage Sites (42 total)

| File | Operation | Risk |
|------|-----------|------|
| `src/features/auth/LoginForm.tsx` | Writes `token` and `user` | P0 - token written after login, MFA, and branch select |
| `src/hooks/use-user.tsx` | Reads `token`, reads/writes `user`, removes on logout | P0 - initial bootstrap, 401 interceptor |
| `src/lib/api.ts` | Reads `token` for Authorization header | P0 - every API request |
| `src/app/ProtectedRoute.tsx` | Reads `token` for route guard | P0 - route access control |
| `src/features/logistics/InstallationChecklist.tsx` | Uses `localStorage` for offline caching | P2 - non-auth data |

## Migration Plan: httpOnly Cookie + CSRF

### Phase 1 (Future Gate): Backend Changes

1. **Add cookie-based JWT delivery**
   - On successful login, set an httpOnly, Secure, SameSite=Strict cookie containing the JWT
   - The cookie should use a dedicated cookie name like `hms_session`
   - Keep the JSON response `accessToken` field for backward compatibility during migration

2. **Add CSRF protection**
   - Generate a CSRF token (cryptographically random, tied to session)
   - Return CSRF token in a separate non-httpOnly cookie (`hms_csrf_token`)
   - Also return CSRF token in the login response body
   - Backend validates CSRF token header for all state-changing requests (POST, PUT, PATCH, DELETE)

3. **JWT configuration**
   - Cookie name: `hms_session`
   - httpOnly: true
   - Secure: true (production only; allow http for local dev)
   - SameSite: Strict
   - Path: /
   - MaxAge: match JWT expiry (e.g., 24h for access, 7d for refresh)

### Phase 2 (Future Gate): Frontend Changes

1. **Remove localStorage writes**
   - Delete all `localStorage.setItem('token', ...)` calls in:
     - `LoginForm.tsx` (3 sites)
     - `use-user.tsx` (1 site: `localStorage.setItem('user', ...)` stays for user profile cache)

2. **Update api.ts interceptor**
   - Remove `localStorage.getItem('token')` from request interceptor
   - Axios will automatically send cookies with `withCredentials: true`
   - Add `withCredentials: true` to the axios instance config

3. **Add CSRF token header injection**
   - Read CSRF token from `document.cookie` (non-httpOnly cookie)
   - Inject as `X-CSRF-Token` header on all state-changing requests
   - Parse CSRF cookie using a small utility function

4. **Update ProtectedRoute.tsx**
   - Replace `localStorage.getItem('token')` check with a server-side session check or a cookie presence check

5. **Update use-user.tsx**
   - Remove `localStorage.getItem('token')` for bootstrap
   - Remove `localStorage.getItem('user')` fallback (or keep as non-sensitive cache)
   - Remove `localStorage.removeItem('token')` calls

6. **Update LoginForm.tsx**
   - Remove `localStorage.clear()` on back-to-login buttons
   - Keep the branch selection flow but rely on cookies

### Testing the Migration

1. **Unit tests**: Update all auth-related tests to work with cookie auth
2. **E2E tests**: Verify login flow creates the cookie, API calls use it, logout clears it
3. **Manual test**: Verify all auth flows (login, MFA, branch select, logout) work end-to-end
4. **Security test**: Verify CSRF token validation works for state-changing requests

### Rollback Plan

1. Keep `localStorage` writes as fallback for 1 release
2. Add a feature flag: `AUTH_METHOD=localstorage|cookie`
3. Monitor auth error rates after migration

## Immediate Mitigation (Applied in Gate 19A)

- CSP headers are already set in `main.ts`:
  ```
  Content-Security-Policy: default-src 'self'
  ```
- This helps mitigate XSS but does not fully protect against all vectors
- Queue.tsx XSS has been fixed (replaced innerHTML with React state)
- console.log in production paths replaced with production-safe logger (suppressed in production)

## Classification

**BLOCKING BEFORE PRODUCTION** — This risk must be addressed before any production deployment.

### Why not fixed in Gate 19A?
- Migration requires both backend and frontend changes
- Backend needs new cookie-setting endpoints and CSRF infrastructure
- Frontend needs `withCredentials`, CSRF token handling, and storage refactoring
- The scope is too large for a single hardening gate
- Tests and auth flows would need comprehensive updates
- Risk of breaking login if half-migrated

## Carryover

This item is tracked as a permanent carryover until the migration is complete. It must be prioritized in the next development sprint.
