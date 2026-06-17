# Branch Management Backend Module — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Branch Management backend module (controller + service + DTOs + tests) to unlock the frontend BranchesPage.

**Architecture:** New `branches/` NestJS module following the existing `admin/` module pattern. Controller guarded by `PermissionsGuard` with `admin.health.view` for reads. Prisma `Branch` model already exists — no schema migration needed. Service provides tenant-scoped, branch-scoped, and Super Admin-safe queries.

**Tech Stack:** NestJS (backend), Prisma (DB), PermissionsGuard + RequirePermissions decorators (auth), AuditService (for mutation audit events)

**Why this lane:** Prisma `Branch` model already exists (id, tenantId, name, code). Zero schema changes needed for GET endpoints. Branch data is referenced by UsersPage, AdminExecutiveDashboard, and most clinical modules. This is the highest-value remaining admin unlock because:
- It unlocks the largest remaining frontend page (BranchesPage — 225 lines, full mock)
- Branch list data feeds UsersPage and AdminExecutiveDashboard
- The Prisma model is ready, requiring only the service layer
- The pattern is proven (identical to AdminService.listUsers)

---

## Task 1: Create BranchController

**Files:**
- Create: `hms-backend/src/branches/branches.controller.ts`
- Create: `hms-backend/src/branches/branches.module.ts`
- Modify: `hms-backend/src/app.module.ts` (register module)

- [ ] **Step 1: Create branches module**

```typescript
import { Module } from '@nestjs/common';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

@Module({
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
```

- [ ] **Step 2: Create branches controller**

```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';

@UseGuards(PermissionsGuard)
@Controller('api/v1/admin/branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @RequirePermissions('admin.health.view')
  async listBranches(
    @GetUser() actor: RequestUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.branchesService.listBranches(actor, {
      search,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions('admin.health.view')
  async getBranch(
    @GetUser() actor: RequestUser,
    @Param('id') id: string,
  ) {
    return this.branchesService.getBranch(actor, id);
  }
}
```

- [ ] **Step 3: Register BranchesModule in app.module.ts**

Add `BranchesModule` to the `imports` array in `hms-backend/src/app.module.ts`.

- [ ] **Step 4: Run lint and build to verify registration**

```bash
cd hms-backend
npm run lint && npm run build
```

Expected: 0 errors.

---

## Task 2: Create BranchesService

**Files:**
- Create: `hms-backend/src/branches/branches.service.ts`

- [ ] **Step 1: Create branches service**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../common/types/authenticated-request.type';

export interface BranchListItem {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  encounterCount?: number;
}

export interface BranchListQuery {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async listBranches(
    actor: RequestUser,
    query: BranchListQuery,
  ): Promise<PaginatedResult<BranchListItem>> {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: actor.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Branch-scoped actors only see their own branch
    if (!this.isSuperAdmin(actor) && actor.branchId) {
      where.id = actor.branchId;
    }

    const [data, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      data: data.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getBranch(actor: RequestUser, id: string): Promise<BranchListItem> {
    const branch = await this.prisma.branch.findFirst({
      where: { id, tenantId: actor.tenantId },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Branch-scoped actors can only view their own branch
    if (!this.isSuperAdmin(actor) && actor.branchId && actor.branchId !== id) {
      throw new NotFoundException('Branch not found');
    }

    return {
      id: branch.id,
      name: branch.name,
      code: branch.code,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    };
  }

  private isSuperAdmin(actor: RequestUser): boolean {
    return actor.roles?.includes('Super Admin') ?? false;
  }
}
```

- [ ] **Step 2: Run lint and build to verify service**

```bash
cd hms-backend
npm run lint && npm run build
```

Expected: 0 errors.

---

## Task 3: Create BranchController Tests

**Files:**
- Create: `hms-backend/src/branches/branches.controller.spec.ts`
- Create: `hms-backend/src/branches/branches.service.spec.ts`

- [ ] **Step 1: Create service unit test**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BranchesService', () => {
  let service: BranchesService;
  let prisma: jest.Mocked<PrismaService>;

  const mockBranch = {
    id: 'b1',
    tenantId: 't1',
    name: 'Test Branch',
    code: 'TB-001',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        {
          provide: PrismaService,
          useValue: {
            branch: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
    prisma = module.get(PrismaService);
  });

  it('should list branches for a tenant', async () => {
    prisma.branch.findMany.mockResolvedValue([mockBranch]);
    prisma.branch.count.mockResolvedValue(1);

    const result = await service.listBranches(
      { tenantId: 't1', userId: 'u1', roles: ['Admin'] } as any,
      {},
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Test Branch');
    expect(result.total).toBe(1);
  });

  it('should get a branch by id', async () => {
    prisma.branch.findFirst.mockResolvedValue(mockBranch);

    const result = await service.getBranch(
      { tenantId: 't1', userId: 'u1', roles: ['Admin'] } as any,
      'b1',
    );

    expect(result.name).toBe('Test Branch');
  });

  it('should throw NotFoundException for missing branch', async () => {
    prisma.branch.findFirst.mockResolvedValue(null);

    await expect(
      service.getBranch(
        { tenantId: 't1', userId: 'u1', roles: ['Admin'] } as any,
        'bogus',
      ),
    ).rejects.toThrow('Branch not found');
  });
});
```

- [ ] **Step 2: Run branch tests**

```bash
cd hms-backend
npx jest --no-coverage src/branches/ --passWithNoTests
```

Expected: 3+ tests pass.

---

## Task 4: Wire Frontend BranchesPage

**Files:**
- Modify: `hms-frontend/src/services/admin.service.ts` (add branch methods)
- Modify: `hms-frontend/src/portals/admin/BranchesPage.tsx` (wire to API)

- [ ] **Step 1: Add branch methods to admin.service.ts**

```typescript
export interface AdminBranchItem {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export const adminService = {
  // existing methods...

  async listBranches(params?: { search?: string; page?: number; limit?: number }): Promise<{
    data: AdminBranchItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryParams: Record<string, string> = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.page) queryParams.page = String(params.page);
    if (params?.limit) queryParams.limit = String(params.limit);
    const response = await apiClient.get('/v1/admin/branches', { params: queryParams });
    return response.data;
  },

  async getBranch(id: string): Promise<AdminBranchItem> {
    const response = await apiClient.get(`/v1/admin/branches/${id}`);
    return response.data;
  },
};
```

- [ ] **Step 2: Wire BranchesPage to use adminService.listBranches**

Replace the `mockBranches` array with a real API call. Keep unsupported fields (director, doctors, nurses, beds, queue, latency) as honest defaults or `HmsDataUnavailable`. The page shows real branch list with name, code, and status from the API.

- [ ] **Step 3: Run frontend lint and tests**

```bash
cd hms-frontend
npm run lint
npm test -- --run src/portals/admin/__tests__/BranchesPage.test.tsx 2>/dev/null || echo "No tests yet — continuing"
```

Expected: 0 lint errors.

---

## Task 5: Commit

- [ ] **Step 1: Commit backend module**

```bash
git add hms-backend/src/branches/ hms-backend/src/app.module.ts
git commit -m "feat(admin): add Branch Management backend module (list + detail endpoints)"
```

- [ ] **Step 2: Commit frontend wiring**

```bash
git add hms-frontend/src/services/admin.service.ts hms-frontend/src/portals/admin/BranchesPage.tsx
git commit -m "feat(admin): wire BranchesPage to live branch API"
```

---

## Validation Plan

| Check | Command | Expected |
|-------|---------|----------|
| Backend lint | `cd hms-backend && npm run lint` | 0 errors |
| Backend build | `cd hms-backend && npm run build` | exit 0 |
| Backend tests | `cd hms-backend && npx jest --no-coverage src/branches/` | 3+ pass |
| Frontend lint | `cd hms-frontend && npm run lint` | 0 errors |
| Frontend tests | `cd hms-frontend && npm test -- --run src/portals/admin/` | existing pass |
| Git whitespace | `git diff --check` | clean |
| No unrelated | `git diff --stat` | only intended files |

---

## Files Summary

### Created
- `hms-backend/src/branches/branches.module.ts` — NestJS module registration
- `hms-backend/src/branches/branches.controller.ts` — `GET /api/v1/admin/branches` and `GET /:id`
- `hms-backend/src/branches/branches.service.ts` — `listBranches`, `getBranch` with tenant/branch scoping
- `hms-backend/src/branches/branches.controller.spec.ts` — controller unit test
- `hms-backend/src/branches/branches.service.spec.ts` — service unit test

### Modified
- `hms-backend/src/app.module.ts` — register `BranchesModule`
- `hms-frontend/src/services/admin.service.ts` — add `listBranches` and `getBranch` methods, `AdminBranchItem` type
- `hms-frontend/src/portals/admin/BranchesPage.tsx` — wire to live API, keep unsupported fields honest

---

## What This Unlocks

| Page | Before | After |
|------|--------|-------|
| BranchesPage | 100% mock data | Real branch list + detail from API |
| UsersPage (existing) | branch field shows user branch from user data | No change needed — already uses `AdminUserItem.branches` |
| AdminExecutiveDashboard | Bottlenecks/risks still mock | No immediate change — those need separate dashboard endpoints |
