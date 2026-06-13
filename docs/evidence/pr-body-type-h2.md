## Summary

Fixes 235 `@typescript-eslint/no-unsafe-argument` warnings in E2E test files by properly typing NestJS test applications with the supertest `App` generic parameter.

## Scope

- E2E test files only (`test/` directory, 52 files)
- Test helper files (typed `app` parameter in `auth.helper.ts`, `create-test-app.helper.ts`)
- No production source changes
- No schema/migration/deployment/dependency changes

## Baseline

- `no-unsafe-argument` warnings before: 332
- `no-unsafe-argument` warnings after: **97**
- Warnings reduced: **235**
- Lint errors: 0 before and after

## Fix Pattern

Changed `let app: INestApplication;` → `let app: INestApplication<App>;` with proper import of `App` from `supertest/types`. This matches the pattern already used by `test/app.e2e-spec.ts` which had zero warnings.

## Verification

- `npm run lint`: 0 errors, 140 warnings (down from 375)
- `npm run typecheck`: PASS
- `npm test`: 1516/1516 PASS, 77 suites
- `npm run build`: PASS
- `npx prisma validate`: PASS

## Evidence

- `docs/evidence/type-h2-e2e-supertest-app-typing.md`

## Verdict

STAGING-ONLY / TYPE-H-2 E2E SUPERTEST APP TYPING COMPLETE
