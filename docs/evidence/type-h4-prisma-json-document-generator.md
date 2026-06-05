# TYPE-H-4 — Prisma JSON / Document Generator Type Narrowing

## Phase

TYPE-H-4 — Prisma JSON / Document Generator Type Narrowing

## Branch

`type/type-h4-prisma-json-document-generator`

## Scope

- `document-generator.service.ts` only
- No schema/migration/deployment/dependency changes
- No runtime behavior change

## Baseline

| Metric | Before | After |
|--------|--------|-------|
| Document-generator lint warnings | 7 | 0 |
| Total `no-unsafe-argument` warnings | 80 | 73 |
| Total lint warnings | 123 | 116 |
| Lint errors | 0 | 0 |

## Fix Strategy

The document-generator used `any` for all method data parameters (`labResult: any`, `patient: any`, `invoice: any`, `payments: any[]`, `prescription: any`, `payment: any`). This cascaded `any` through all field accesses (`labResult.results`, `row.parameter`, etc.) causing 7 `no-unsafe-argument` warnings.

**Fixes:**
1. **Typed all method data parameters** with inline object types matching the fields actually accessed
2. **Replaced `any[]` with `Array<Record<string, unknown>>`** for parsed JSON results
3. **Used `unknown` for Prisma-specific types** (`JsonValue`, `Decimal`) that are passed from Prisma models — these can't be typed narrowly without coupling to Prisma schema
4. **Added `typeof` guards** for row field extraction to avoid implicit `toString()` on objects
5. **Used explicit `String()` conversion** for template literal expressions with `unknown` values

## Files Changed

| File | Change |
|------|--------|
| `src/patient-portal/services/document-generator.service.ts` | Typed all method parameters; replaced `any` with specific types; added type guards |

## Security-Sensitive Changes

None. The document generator only reads data and generates PDF buffers. No auth/CSRF/tenant isolation logic touched.

## Deferred Risks

- The `results` parsing still handles arbitrary JSON shapes (medical lab results can have varying schemas)
- The `payments` loop still accesses optional fields like `receiptNumber`, `amount` — these are typed but could be missing at runtime
- These are pre-existing behaviors, not introduced by this type narrowing

## Verification

```bash
npm run lint → 0 errors, 116 warnings (73 no-unsafe-argument)
npm run typecheck → PASS
npm test → 1516/1516 PASS, 77 suites
npm run build → PASS
npx prisma validate → PASS
git diff --check → clean
```

## Final Verdict

STAGING-ONLY / TYPE-H-4 PRISMA JSON TYPE NARROWING COMPLETE
