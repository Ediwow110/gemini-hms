# Revenue Trend Dashboard Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable live Revenue Trend visualization on the Admin Executive Dashboard by sourcing data from the backend `payments` table.

**Architecture:** Extend the existing `getAdminTrends` API to support a `dimension` parameter ('volume' vs 'revenue'). Use raw SQL queries in the backend to perform efficient date truncation and aggregation. Update the frontend to fetch both dimensions and render the corresponding charts.

**Tech Stack:** NestJS, Prisma (PostgreSQL), React, Recharts.

---

### Task 1: Backend DTO & Controller Updates

**Files:**
- Modify: `hms-backend/src/dashboard/dto/dashboard-query.dto.ts`
- Modify: `hms-backend/src/dashboard/controllers/dashboard.controller.ts`

- [ ] **Step 1: Add dimension to DashboardQueryDto**

```typescript
// hms-backend/src/dashboard/dto/dashboard-query.dto.ts
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class DashboardQueryDto {
  // ... existing fields ...
  @IsString()
  @IsOptional()
  @IsEnum(['volume', 'revenue'])
  dimension?: 'volume' | 'revenue';
}
```

- [ ] **Step 2: Update Controller to pass query to service**

```typescript
// hms-backend/src/dashboard/controllers/dashboard.controller.ts
  @Get('admin/trends')
  @Roles('Super Admin', 'Admin')
  async getTrends(@Query() query: DashboardQueryDto, @GetUser() user: User) {
    return this.dashboardService.getAdminTrends(query, user.tenantId);
  }
```

- [ ] **Step 3: Commit**

```bash
git add hms-backend/src/dashboard/dto/dashboard-query.dto.ts hms-backend/src/dashboard/controllers/dashboard.controller.ts
git commit -m "feat(backend): add dimension support to dashboard trends API"
```

---

### Task 2: Backend Service Implementation

**Files:**
- Modify: `hms-backend/src/dashboard/services/dashboard.service.ts`

- [ ] **Step 1: Update getAdminTrends with dynamic query and filtering**

```typescript
// hms-backend/src/dashboard/services/dashboard.service.ts
  async getAdminTrends(query: DashboardQueryDto, tenantId: string) {
    const { dimension = 'volume', branchId, dateFrom, dateTo } = query;
    
    // Base filters
    const table = dimension === 'revenue' ? 'payments' : 'encounters';
    const dateField = dimension === 'revenue' ? 'created_at' : 'encountered_at';
    const valueExpr = dimension === 'revenue' ? 'SUM(amount)' : 'COUNT(*)';
    
    // We use Prisma.sql for safe raw queries or dynamic SQL builder
    // Given the complexity of dynamic table names in raw SQL, we'll branch the logic
    
    if (dimension === 'revenue') {
      const rows = await this.prisma.$queryRaw<Array<{ day: Date; value: number }>>`
        SELECT DATE_TRUNC('day', created_at) AS day, SUM(amount)::FLOAT AS value
        FROM payments
        WHERE tenant_id = ${tenantId}::uuid
          AND status = 'POSTED'
          ${branchId ? Prisma.sql`AND branch_id = ${branchId}::uuid` : Prisma.empty}
          ${dateFrom ? Prisma.sql`AND created_at >= ${new Date(dateFrom)}` : Prisma.empty}
          ${dateTo ? Prisma.sql`AND created_at <= ${new Date(dateTo)}` : Prisma.empty}
        GROUP BY day
        ORDER BY day DESC
        LIMIT 90
      `;
      return rows.map(row => ({
        label: row.day.toISOString().split('T')[0],
        value: row.value,
      }));
    } else {
      const rows = await this.prisma.$queryRaw<Array<{ day: Date; value: number }>>`
        SELECT DATE_TRUNC('day', encountered_at) AS day, COUNT(*)::FLOAT AS value
        FROM encounters
        WHERE tenant_id = ${tenantId}::uuid
          ${branchId ? Prisma.sql`AND branch_id = ${branchId}::uuid` : Prisma.empty}
          ${dateFrom ? Prisma.sql`AND encountered_at >= ${new Date(dateFrom)}` : Prisma.empty}
          ${dateTo ? Prisma.sql`AND encountered_at <= ${new Date(dateTo)}` : Prisma.empty}
        GROUP BY day
        ORDER BY day DESC
        LIMIT 90
      `;
      return rows.map(row => ({
        label: row.day.toISOString().split('T')[0],
        value: row.value,
      }));
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add hms-backend/src/dashboard/services/dashboard.service.ts
git commit -m "feat(backend): implement revenue trend aggregation with filtering"
```

---

### Task 3: Frontend Service & Types Update

**Files:**
- Modify: `hms-frontend/src/types/analytics.ts`
- Modify: `hms-frontend/src/services/dashboard.service.ts`

- [ ] **Step 1: Update ScopeFilter type**

```typescript
// hms-frontend/src/types/analytics.ts
export interface ScopeFilter {
  // ... existing ...
  dimension?: 'volume' | 'revenue';
}
```

- [ ] **Step 2: Update DashboardService frontend interface and implementation**

```typescript
// hms-frontend/src/services/dashboard.service.ts
  async getAdminTrends(filters) {
    const params = this.buildQueryParams(filters);
    if (filters.dimension) params.dimension = filters.dimension;
    const response = await apiClient.get('/v1/dashboard/admin/trends', { params });
    return response.data;
  },
```

- [ ] **Step 3: Commit**

```bash
git add hms-frontend/src/types/analytics.ts hms-frontend/src/services/dashboard.service.ts
git commit -m "feat(frontend): update dashboard service to support trend dimensions"
```

---

### Task 4: Frontend Dashboard Wiring

**Files:**
- Modify: `hms-frontend/src/pages/admin/AdminExecutiveDashboard.tsx`

- [ ] **Step 1: Update state and fetch logic**

```typescript
// hms-frontend/src/pages/admin/AdminExecutiveDashboard.tsx
  const [trends, setTrends] = useState<TrendPoint[] | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<TrendPoint[] | null>(null);

  const fetchData = async () => {
    // ...
    try {
      const filters = { dateRange, branch: selectedBranch };

      const [summaryRes, alertsRes, topListsRes, trendsRes, revTrendsRes] = await Promise.all([
        dashboardService.getAdminSummary(filters),
        dashboardService.getAdminAlerts(),
        dashboardService.getAdminTopLists(),
        dashboardService.getAdminTrends(filters),
        dashboardService.getAdminTrends({ ...filters, dimension: 'revenue' }),
      ]);

      setSummary(summaryRes);
      setAlerts(alertsRes);
      setTopLists(topListsRes);
      setTrends(trendsRes);
      setRevenueTrends(revTrendsRes);
      // ...
    }
    // ...
  };
```

- [ ] **Step 2: Wire the Revenue Trend chart**

```tsx
// hms-frontend/src/pages/admin/AdminExecutiveDashboard.tsx
          <div className="col-span-12 xl:col-span-6">
            <HmsTrendChart
              title="Revenue Trend"
              description="Daily revenue aggregation over the selected period"
              chart={
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrends || []}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(val) => `₱${val.toLocaleString()}`} />
                    <Tooltip formatter={(val: number) => [`₱${val.toLocaleString()}`, 'Revenue']} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              }
              loading={loading}
              empty={!revenueTrends || revenueTrends.length === 0}
            />
          </div>
```

- [ ] **Step 3: Commit**

```bash
git add hms-frontend/src/pages/admin/AdminExecutiveDashboard.tsx
git commit -m "feat(frontend): wire live Revenue Trend chart to AdminExecutiveDashboard"
```

---

### Task 5: Verification

- [ ] **Step 1: Run backend tests**
- [ ] **Step 2: Verify API response manually**
- [ ] **Step 3: Run lint and typecheck**
