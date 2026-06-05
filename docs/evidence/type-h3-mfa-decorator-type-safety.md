# TYPE-H-3 — MFA / Decorator Type-Safety Cleanup

## Phase

TYPE-H-3 — MFA / Decorator Type-Safety Cleanup

## Branch

`type/type-h3-mfa-decorator-type-safety`

## Scope

- Auth controller MFA endpoint typing
- MFA challenge guard typing
- `MfaChallengePayload` type definition
- Test files only where necessary
- No runtime behavior change
- No schema/migration/deployment/dependency changes

## Baseline

| Metric | Before | After |
|--------|--------|-------|
| Lint errors | 0 | 0 |
| Total warnings | 140 | 123 |
| `no-unsafe-argument` warnings | 97 | 80 |
| Auth controller warnings | 16 | 0 |
| MFA guard warnings | 1 | 0 |

## Files Changed

| File | Change | Type |
|------|--------|------|
| `src/common/types/authenticated-request.type.ts` | Added `MfaChallengePayload` interface | Type definition |
| `src/auth/auth.controller.ts` | Replace `user: any` with `MfaChallengePayload` in 3 MFA endpoints; narrow `setAuthCookies` `result` type; cast cookie/header values to `string \| undefined`; remove `result as any` casts | Type narrowing |
| `src/auth/guards/mfa-challenge.guard.ts` | `token` cast to `string` before `jwtService.verify` | Type narrowing |

## Fix Details

### 1. MFA Challenge Payload Type

Defined `MfaChallengePayload` interface matching the JWT payload signed by `AuthService.login()`:

```ts
interface MfaChallengePayload {
  sub: string;       // user.id
  sid: string;       // session.id
  tenantId: string;
  email?: string;
  tokenVersion?: number;
  roles?: string[];
  scope: string;
  challenge?: string; // 'MFA_VERIFY' | 'MFA_SETUP'
}
```

This replaces `user: any` in `mfaSetup`, `mfaVerify`, and `verifyRecoveryCode` endpoints.

### 2. setAuthCookies type narrowing

Changed `result: any` → `{ accessToken?: string; refreshToken?: string; sessionId?: string }` — only the fields actually accessed by the function.

### 3. Cookie/header type casts

Express `Request.cookies` is typed as `Record<string, any>` by cookie-parser types. Added `as string | undefined` casts at the usage sites to avoid cascading `any` into downstream service calls.

### 4. selectBranch cleanup

Removed unnecessary `(result as any)` casts — after the null guard, TypeScript infers the correct shape from the service method return type.

## Deferred (NEEDS CONTEXT)

3 warnings remain in `auth.service.ts` (lines 264, 305, 392):
- `user as any` cast before `generateTokenPair()` call
- Prisma `User.findUnique()` returns a database model that doesn't match `AuthenticatedUser` interface
- Fixing requires mapping Prisma User → AuthenticatedUser, which is a deeper refactor of the auth service flow
- Documented but not changed per master prompt constraint

## Security-Sensitive Files Touched

- `src/auth/auth.controller.ts` — All changes are type-only. Cookie comparison logic (`csrfCookie !== csrfHeader`), cookie setting, and auth flow preserved.
- `src/auth/guards/mfa-challenge.guard.ts` — `token as string` cast preserves the existing guard check behavior. No weakening.
- `src/common/types/authenticated-request.type.ts` — New type only, no runtime code added.

## Verification

```bash
npm run lint → 0 errors, 123 warnings (80 no-unsafe-argument)
npm run typecheck → PASS
npm test → 1516/1516 PASS, 77 suites
npm run build → PASS
npx prisma validate → PASS
git diff --check → clean
```

## Final Verdict

STAGING-ONLY / TYPE-H-3 MFA DECORATOR TYPE-SAFETY COMPLETE
