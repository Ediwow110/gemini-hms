# Local Auth & Routing Troubleshooting Guide

This guide is designed to help local developers diagnose and resolve white screens, infinite redirects, and authentication loops in the local development environment.

## Symptoms & Fixes

### 1. White Screen after Login
**Cause:** The application successfully authenticated you but failed to resolve a valid route for your role, causing a render error, or the `App` component threw an unhandled error.
**Resolution:**
- Check the **Developer Details** in the Route Error Boundary.
- Ensure the user's role is correctly defined in `hms-frontend/src/app/role-portal-resolver.ts`.
- Ensure the `ROLE_PORTAL_PATHS` points to a registered route in `App.tsx`.

### 2. Infinite Redirect Loop
**Cause:** 
- You are accessing the root route `/` which maps to `RoleRedirect`.
- `RoleRedirect` directs you to a path (e.g. `/branch-admin`).
- `PermissionRoute` for `/branch-admin` rejects you (lack of roles/permissions).
- It renders `<UnauthorizedState />`, which directs you back to `/` (loop completes).
**Resolution:**
- Use the **Auth Diagnostics Panel** in the bottom right corner (only visible in DEV mode on errors).
- Ensure your seeded user roles match the roles required in `App.tsx` routes.
- Specifically, check `role-portal-resolver.ts` -> `ROLE_ALIASES` and `ROLE_PRIORITY`.
- Ensure that the path computed by `getSafePortalPath()` is explicitly granted to your user.

### 3. "Authenticated, but no portal is assigned to your role"
**Cause:** The `LoginForm` successfully authenticated the user, but the user's primary role is not registered in the `ROLE_PORTAL_PATHS` matrix, or the resolved path is not recognized by `isKnownPortalPath`.
**Resolution:**
- Check the user's roles in your local database.
- Ensure `isKnownPortalPath` accounts for their assigned portal path.

### 4. Continuous "Network Error" or "401"
**Cause:** CORS origin mismatch, expired session, or missing `access_token` cookie.
**Resolution:**
- Open the **Auth Diagnostics Panel**.
- Check if the Frontend Origin matches the Backend API Origin (e.g., avoid mixing `localhost` and `127.0.0.1`).
- Clear site data/cookies and log in again.
- Ensure the backend `CORS_ALLOWED_ORIGINS` environment variable includes your frontend origin.

## Diagnostic Tools Included
- **Route Error Boundary:** Catches React render errors in routes and displays a friendly error page with stack traces in DEV mode.
- **Auth Diagnostics Panel:** A small floating panel that appears if `/v1/auth/me` fails or encounters CORS/network errors during application bootstrap.
- **Console Warnings:** The AuthProvider logs detailed debug data when API requests fail, including the HTTP status and whether the access cookie is present.
