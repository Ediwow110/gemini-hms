# Local Auth & Routing Troubleshooting Guide

This guide is designed to help local developers diagnose and resolve white screens, infinite redirects, and authentication loops in the local development environment.

## 1. Quick Start & URLs

To ensure auth behaves correctly, start both servers consistently using `localhost`:

**Start Backend:**
```bash
cd hms-backend
npm run start:dev
# Expected API URL: http://localhost:3000
```

**Start Frontend:**
```bash
cd hms-frontend
npm run dev
# Expected Frontend URL: http://localhost:5173
```

**CRITICAL RULE:** Avoid mixing `localhost` and `127.0.0.1`. If you access the frontend via `localhost`, the backend must also be accessed via `localhost`. Mixing them will cause CORS and Cookie issues.

## 2. Inspecting Authentication State

If you experience login failures, use the Browser DevTools (Network Tab):

1. **Check `/v1/auth/login`:**
   - Should return `200 OK` or `202 Accepted` (MFA).
   - Response should contain `requiresBranchSelection` boolean.
   - Response headers should set cookies: `access_token`, `refresh_token`, and `csrf_token`.

2. **Check `/v1/auth/me`:**
   - Should return `200 OK`.
   - Response should contain user roles, permissions, and `defaultPortalPath`.

**Expected Cookies in Application/Storage Tab:**
- `access_token` (HTTPOnly)
- `refresh_token` or session ID (HTTPOnly)
- `csrf_token`

*If cookies are missing, clear site data for both `localhost` and `127.0.0.1` and log in again.*

## 3. Expected Role Login Routes

Depending on the assigned role, users should be routed to:
- Super Admin -> `/admin`
- Branch Admin -> `/branch-admin`
- Marketplace Admin -> `/marketplace-admin`
- Compliance -> `/compliance`
- IT -> `/it`
- HR -> `/hr`
- Procurement -> `/procurement`
- Doctor -> `/doctor`
- Nurse -> `/nurse`
- Med-Tech/Lab -> `/lab`
- Pharmacist -> `/pharmacy`
- Cashier -> `/cashier`
- Supplier -> `/supplier`
- Field Tech -> `/field-service`
- Patient -> `/patient`

## 4. Symptoms & Fixes

### A. White Screen after Login
**Cause:** The application successfully authenticated you but failed to resolve a valid route for your role.
**Resolution:**
- Check the **Developer Details** in the Route Error Boundary.
- Ensure the user's role is correctly defined in `hms-frontend/src/app/role-portal-resolver.ts`.

### B. Infinite Redirect Loop
**Cause:** `RoleRedirect` maps you to a portal path, but `PermissionRoute` rejects access and sends you back to `/`.
**What to capture if a loop happens:**
- Current URL toggling state.
- Browser Console errors.
- Network status for `/v1/auth/me`.
- Cookies present (Yes/No).
- The JSON response from `/v1/auth/me` (capture roles, permissions, defaultPortalPath).

### C. "Authenticated, but no portal is assigned to your role"
**Cause:** The user's primary role is not registered in the `ROLE_PORTAL_PATHS` matrix.
**Resolution:** Check the user's roles in your local database.

### D. Continuous "Network Error" or "401"
**Cause:** CORS origin mismatch or missing `access_token` cookie.
**Resolution:**
- Open the **Auth Diagnostics Panel**.
- Clear cookies if switching between frontend origins.
- Ensure backend `CORS_ALLOWED_ORIGINS` includes your frontend origin.
