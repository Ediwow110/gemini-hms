# HMS Clinical Dashboard Redesign — Phase 1

## Status
**Date:** 2026-06-07
**Phase:** 1 (Doctor + Nurse + Lab)
**PR scope:** New shared HMS dashboard primitives under `hms-frontend/src/components/hms-dashboard/`

---

## 1. Architecture & Constraints

### Preserved (no changes)
- All existing route paths, lazy imports, permission guards (`ProtectedRoute`, `PermissionRoute`, `@Roles`)
- All existing hooks (`useClinicalDashboardSummary`, `useClinicalWorkQueue`, `useNursingTasks`, `usePendingSpecimens`, `useCriticalResults`, `useTurnaroundMetrics`)
- All existing API service contracts and query key scoping
- All existing Recharts chart components in `analytics/charts/`
- All existing page module boundaries (lazy imports in `App.tsx`)
- All existing backend integration points
- All existing role/permission model

### New directory
`hms-frontend/src/components/hms-dashboard/` — shared HMS dashboard primitives

### Installation required
```bash
npm install @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
```

---

## 2. Shared Component Inventory

### 2.1 Layout Primitives

#### `HmsDashboardShell`
- **Purpose:** Page-level wrapper that constrains content width, provides consistent padding, and slots toolbar/footer.
- **Props:** `toolbar?: ReactNode`, `children`, `footer?: ReactNode`, `maxWidth?: 'full' | '1440'` (default `1440`)
- **Behavior:** Renders a max-width container centered with `mx-auto`, `px-4` horizontal padding, `py-4` vertical padding. The toolbar renders above the children, the footer below.

#### `HmsToolbar`
- **Purpose:** Top bar showing branch context, current user role, current timestamp, and action controls.
- **Props:** `branchName?: string`, `role?: string`, `lastRefreshed?: Date`, `onRefresh?: () => void`, `children?: ReactNode` (for filter controls)
- **Internals:** `font-mono` for timestamp, compact horizontal layout with `justify-between`.
- **No rounding** — toolbar is edge-to-edge within the shell, separated by a bottom border.
- **Role badge** uses `HmsStatusChip`.

#### `HmsAuditFooter`
- **Purpose:** Bottom bar showing data source attribution, last-refreshed timestamp, and version.
- **Props:** `lastRefreshed?: Date`, `dataSource?: string`, `version?: string`
- **Styling:** `text-[11px] text-slate-400 font-medium`, top border, compact padding.

### 2.2 KPI & Status

#### `HmsKpiStrip`
- **Purpose:** Horizontal metric bar (not a card grid). Dense, compact, readable at a glance.
- **Props:** `metrics: Array<{ id: string; label: string; value: string | number; trend?: { direction: 'up' | 'down' | 'flat'; value: string }; severity?: 'info' | 'success' | 'warning' | 'critical'; href?: string; onClick?: () => void }>`
- **Layout:** `flex flex-wrap gap-x-6 gap-y-2` — each metric is a `<div>` with `label` (uppercase 10px, slate-400), `value` (18px bold, slate-900), optional `trend` indicator (arrow + text, colored by direction), and optional drilldown chevron.
- **Severity coloring:** Border-left accent on each metric block: blue for info, emerald for success, amber for warning, rose for critical.
- **No card shadow**, no rounded container — these are inline metrics, not floating cards.

#### `HmsStatusChip`
- **Purpose:** Compact status badge for tables and lists.
- **Props:** `status: string`, `variant?: 'default' | 'success' | 'warning' | 'critical' | 'neutral'`, `icon?: ReactNode`, `count?: number`
- **Styling:** `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold leading-none`. Variants map to bg/text/border Tailwind colors (e.g., `'success' → bg-emerald-50 text-emerald-700 border-emerald-200`).
- **Count badge:** If `count` is provided, renders a small `count` bubble inside the chip.

#### `HmsPriorityBadge`
- **Purpose:** Queue priority indicator for worklists.
- **Props:** `level: 'emergency' | 'critical' | 'urgent' | 'routine'`, `showLabel?: boolean`
- **Styling:** Color-coded dot + optional label:
  - `emergency` → rose-500 dot, "EMERGENCY" label
  - `critical` → amber-500 dot, "CRITICAL" label
  - `urgent` → blue-500 dot, "URGENT" label
  - `routine` → slate-400 dot, "ROUTINE" label
- **Layout:** `flex items-center gap-1.5`. Dot is a `rounded-full h-2 w-2` div. Label is `text-[11px] font-semibold`.

### 2.3 Panels

#### `HmsAlertRail`
- **Purpose:** Vertical alert strip at the top of the dashboard — shows critical and warning alerts that need immediate attention.
- **Props:** `alerts: Array<{ id: string; severity: 'critical' | 'warning' | 'success'; title: string; message: string; timestamp?: string; actionLabel?: string; actionHref?: string; actionOnClick?: () => void }>`, `maxVisible?: number`
- **Layout:** The rail is a single `flex flex-col gap-2` container. Each alert is a compact row with:
  - Severity left-border accent (rose-500, amber-500, emerald-500)
  - Icon (AlertTriangle for critical, AlertCircle for warning, CheckCircle2 for success)
  - Title (semibold, 13px)
  - Message (12px, slate-600)
  - Optional action link (12px, font-semibold, blue-600)
  - Optional timestamp (11px, font-mono, slate-400)
- **Empty state:** If zero alerts, render a single thin green bar: "✓ All clear — no alerts" (emerald-50 bg, emerald-600 text, 12px).
- **Collapsible:** If more than `maxVisible` (default 3), show "Show N more" toggle.

#### `HmsWorkQueue`
- **Purpose:** Dense operational table for worklists — the primary queue component.
- **Props:**
  ```ts
  interface HmsWorkQueueProps<T> {
    title: string;
    description?: string;
    columns: Array<{
      key: string;
      header: string;
      width?: string; // e.g., 'w-16', 'flex-1'
      render: (item: T) => ReactNode;
    }>;
    data: T[];
    keyExtractor: (item: T) => string | number;
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    rowHref?: (item: T) => string;
    maxRows?: number;
    viewAllLink?: string;
    viewAllLabel?: string;
  }
  ```
- **Layout:**
  - Header bar: title (14px font-bold, slate-800) + optional description (12px slate-500) + optional "View All" link
  - Table: full-width, `text-left text-[12px]`, thead with `text-[10px] font-semibold uppercase tracking-wider text-slate-400`, tbody with `divide-y divide-slate-100`
  - Priority column: uses `HmsPriorityBadge`
  - Status column: uses `HmsStatusChip`
  - Action column: blue text link with arrow
  - Row height: `py-2.5 px-3` (compact)
  - Alternating row backgrounds: even rows `bg-slate-50/30`
- **Loading state:** 5 skeleton rows matching column structure
- **Empty state:** Centered "no items" message with icon

#### `HmsSlaPanel`
- **Purpose:** Time-sensitive risk metrics — shows overdue counts, averages, and breach indicators.
- **Props:**
  ```ts
  interface HmsSlaPanelProps {
    title: string;
    items: Array<{
      id: string;
      label: string;
      value: string | number;
      threshold?: number;
      current?: number;
      status: 'on_track' | 'at_risk' | 'breached';
      drilldownHref?: string;
    }>;
    loading?: boolean;
  }
  ```
- **Layout:**
  - Header bar with title
  - Each item is a compact row: label (13px), value (font-mono, 14px), status indicator (green dot = on_track, amber = at_risk, rose = breached), optional bar showing current vs threshold
- **No card decoration** — bordered container with slate-100 border, rounded-lg, bg-white

#### `HmsDrilldownTable`
- **Purpose:** Full-width operational table with row click navigation — used for schedules, lab results, task lists.
- **Props:** Same as `HmsWorkQueue` but supports more columns (5-8), sortable headers, and pagination via "View All".
- **Styling:** Same row density as `HmsWorkQueue`, but with sticky header and optional footer row.

#### `HmsQuickActions`
- **Purpose:** Compact action button grid for rapid navigation.
- **Props:** `actions: Array<{ id: string; label: string; icon: ReactNode; href?: string; onClick?: () => void; variant?: 'default' | 'primary' | 'danger' }>`
- **Layout:** `grid grid-cols-1 gap-2` (or `grid-cols-2` if >4 actions). Each action is a full-width button with icon + label + chevron. Hover state with subtle background shift.

### 2.4 State Components

#### `HmsLoadingSkeleton`
- **Purpose:** Contextual skeleton matching panel shapes.
- **Props:** `variant: 'table' | 'kpi' | 'panel' | 'alert-rail'`, `rows?: number` (for table variant)
- **Table variant:** Renders table-like skeleton with header row + `rows` body rows.
- **KPI variant:** Renders 4-6 metric blocks with shimmer.
- **Panel variant:** Renders a card with 3-4 shimmer lines.

#### `HmsEmptyState`
- **Purpose:** Contextual empty state for queue/table sections.
- **Props:** `title?: string`, `description?: string`, `icon?: ReactNode`, `action?: ReactNode`
- **Styling:** Minimal — centered, compact padding (p-4), 13px title, 12px description, no decorative icon container.

#### `HmsDataUnavailable`
- **Purpose:** Honest placeholder for sections that are not yet connected to real data.
- **Props:** `sectionName: string`, `expectedApi?: string`, `expectedPhase?: string`
- **Content:** "🔒 {sectionName} — data not available yet." + smaller text showing the expected API endpoint and target phase. This replaces all fake mock data in sections that pretend to be live.

### 2.5 Chart Wrapper

#### `HmsTrendChart`
- **Purpose:** HMS-styled wrapper around existing `TrendLineChart`, `ComparisonBarChart`, `StatusDonutChart`, `VolumeAreaChart`.
- **Props:**
  ```ts
  interface HmsTrendChartProps {
    title: string;
    description?: string;
    chart: ReactNode; // the actual Recharts component
    height?: number; // default 240
    loading?: boolean;
    empty?: boolean;
  }
  ```
- **Layout:** Bordered container with title header, chart area below. Skeleton on loading. "Chart data unavailable" on empty.
- **No chart if no real data** — `empty` prop shows the honest placeholder instead of rendering fake chart data.

---

## 3. Doctor Dashboard Layout

### Current hooks kept
- `useClinicalDashboardSummary()` → `summary` (waitingForDoctor, activePatients, pendingTriage, pendingLabResults)
- `useClinicalWorkQueue()` → `queueData`

### Layout structure

```
Page shell: HmsDashboardShell
├── HmsToolbar — "Branch A | Dr. Name | Doctor | 14:32:01"
├── HmsAlertRail — critical results from summary (real)
│   - Critical high results (count from summary)
│   - Unsigned notes count (if >0)
├── HmsKpiStrip
│   - [Assigned Patients] {summary.waitingForDoctor}
│   - [Active Encounters] {summary.activePatients}
│   - [Pending Triage] {summary.pendingTriage}
│   - [Pending Lab Results] {summary.pendingLabResults}
│   - [Unsigned Notes] (data-unavailable if no real endpoint)
│   - [Today's Appointments] (data-unavailable if no real endpoint)
├── Two-column grid (3:1)
│   ├── Left column (2/3)
│   │   ├── HmsWorkQueue — "My Patient Queue"
│   │   │   queueData → priority, patient name, wait time, status, chart button
│   │   ├── HmsDrilldownTable — "Today's Schedule"
│   │   │   (data-unavailable: "Schedule integration — Phase 2")
│   │   └── HmsWorkQueue — "Pending Orders & Results"
│   │       (data-unavailable: "Order tracking — Phase 2")
│   └── Right column (1/3)
│       ├── HmsSlaPanel — "Waiting Thresholds"
│       │   (derived from queueData: longest wait, count over 30min, etc.)
│       ├── HmsDrilldownTable — "Critical Results"
│       │   (real if summary has critical data, else data-unavailable)
│       └── HmsQuickActions — [Queue] [Chart] [Orders] [Patients]
└── HmsAuditFooter — "Last refreshed 14:32 | Source: Clinical API"
```

### What changes from current
| Current | New |
|---------|-----|
| 4 AnalyticsMetricCard grid → | HmsKpiStrip (6 metrics, compact) |
| Mock critical results in rose card → | HmsAlertRail at top (real data or hidden) |
| Mock schedule list → | HmsDrilldownTable with data-unavailable placeholder |
| Indigo color → | Blue primary |
| `rounded-2xl` cards → | `rounded-lg`, no floating shadows |
| PageHeader component → | HmsToolbar (denser, with audit context) |
| Floaty padding margins → | Dense gap-3, p-3 panels |
| Mock "Start Clinic Day" button → | HmsQuickActions (structured action grid) |

---

## 4. Nurse Dashboard Layout

### Current hooks kept
- `useClinicalDashboardSummary()` → `summary`
- `useClinicalWorkQueue()` → `queueData`
- `useNursingTasks()` → `tasks`

### Layout structure

```
HmsDashboardShell
├── HmsToolbar
├── HmsAlertRail — vitals alerts / specimen alerts
│   - (real from queueData: overdue vitals, critical vitals)
│   - If zero: "All clear — no alerts"
├── HmsKpiStrip
│   - [Triage Waiting] {summary.pendingTriage}
│   - [Vitals Due] {derived from queue}
│   - [Specimen Collection] {queue filter}
│   - [Nursing Tasks] {realTaskCount}
│   - [Ready for Doctor] {summary.waitingForDoctor}
│   - [Critical Vitals] (data-unavailable: "Phase 2")
├── Two-column grid (3:1)
│   ├── Left column (2/3)
│   │   ├── HmsWorkQueue — "Triage Queue"
│   │   │   queueData filtered → priority, name, wait time, triage button
│   │   ├── HmsWorkQueue — "Specimen Collection"
│   │   │   queue filtered by LABORATORY from queueData
│   │   └── HmsDrilldownTable — "Nursing Tasks by Urgency"
│   │       nursingTasks → task name, patient, priority, status, action
│   └── Right column (1/3)
│       ├── HmsSlaPanel — "Vitals Compliance"
│       │   (overdue vitals count, last check timestamp)
│       ├── HmsStatusChip set — "Patient Handoff Ready"
│       │   {summary.waitingForDoctor} patients ready
│       └── HmsQuickActions — [Intake] [Vitals] [Tasks] [Specimens]
└── HmsAuditFooter
```

### What changes from current
| Current | New |
|---------|-----|
| 6 AnalyticsMetricCard grid → | HmsKpiStrip (compact horizontal) |
| TriageQueue with manual card layout → | HmsWorkQueue (structured table) |
| Vitals alerts panel (empty array) → | HmsAlertRail (dynamic; shows "all clear" when empty) |
| Mock Quick Navigations → | HmsQuickActions (consistent grid) |
| `rounded-2xl` everywhere → | `rounded-lg`, flat design |
| Indigo accents → | Blue primary |
| TriagePriorityBadge custom → | HmsPriorityBadge (shared) |

---

## 5. Lab Dashboard Layout

### Current hooks kept
- `usePendingSpecimens()` → `specimens`
- `useCriticalResults('OPEN')` → `criticalResults`
- `useTurnaroundMetrics()` → `tatData`

### Layout structure

```
HmsDashboardShell
├── HmsToolbar
├── HmsAlertRail — critical results requiring action
│   - (from criticalResults: count, patient name, test)
│   - If zero: "No critical results — all clear"
├── HmsKpiStrip
│   - [Pending Specimens] {pendingCount}
│   - [In Progress] {pendingResultsCount}
│   - [Released Today] {releasedCount}
│   - [Open Critical] {criticalOpenCount}
│   - [Avg TAT] {avgSpecToRelease ?? '—'}
│   - [Missing Timestamps] {missingTimestampCount}
├── Two-column grid (2:1)
│   ├── Left column (2/3)
│   │   ├── HmsWorkQueue — "Specimen Work Queue"
│   │   │   specimenItems → patient, specimen type, collected, status, action
│   │   ├── HmsWorkQueue — "Pending Validation/Release"
│   │   │   (real if tatData has pending counts, else data-unavailable)
│   │   └── HmsTrendChart — "TAT Trend (14 days)"
│   │       (real chart using existing TrendLineChart wrapped in HmsTrendChart)
│   └── Right column (1/3)
│       ├── HmsSlaPanel — "TAT SLA Compliance"
│       │   tatCards → test name, avg time, breach status, drilldown
│       ├── HmsDrilldownTable — "Critical Results"
│       │   criticalItems → patient, test, value, reported, notify action
│       └── HmsQuickActions — [Orders] [Specimens] [Encode] [Validate] [Release]
└── HmsAuditFooter
```

### What changes from current
| Current | New |
|---------|-----|
| 7 custom metric cards → | HmsKpiStrip (compact horizontal) |
| ChartCard + TrendLineChart → | HmsTrendChart wrapper |
| Standalone SpecimenWorkQueue subcomponent → | HmsWorkQueue panel |
| Standalone CriticalResultPanel → | HmsDrilldownTable |
| Standalone TurnaroundTimeCard → | HmsSlaPanel |
| 3-column insight layout → | 2-column worklist-primary layout |
| Indigo/purple → | Blue primary |
| `rounded-2xl` → | `rounded-lg`, flat |

---

## 6. Visual System

### Typography
```css
/* index.css theme overrides */
--font-sans: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif;
--font-mono: 'IBM Plex Mono', ui-monospace, 'SF Mono', monospace;
```

- Body UI: IBM Plex Sans 400/500/600/700
- Data/IDs: IBM Plex Mono 500
- All headings in IBM Plex Sans 600/700
- No Plus Jakarta Sans or Inter references in HMS dashboard code

### Color palette (Tailwind usage)
- **Info/primary:** blue-50, blue-100, blue-500, blue-600, blue-700
- **Success:** emerald-50, emerald-100, emerald-500, emerald-600, emerald-700
- **Warning:** amber-50, amber-100, amber-500, amber-600, amber-700
- **Critical:** rose-50, rose-100, rose-500, rose-600, rose-700
- **Neutral:** slate-50, slate-100, slate-200, slate-300, slate-400, slate-500, slate-600, slate-700, slate-800, slate-900
- **No indigo, violet, purple, or pink** in any HMS dashboard component

### Spacing & sizing
- Panel padding: `p-3` (12px)
- Panel gap: `gap-3` (12px)
- Table cell padding: `px-3 py-2.5`
- KPI value: `text-lg font-bold` (18px)
- KPI label: `text-[10px] font-semibold uppercase tracking-wider`
- Table text: `text-[12px]`
- Body text: `text-[13px]`
- Alert text: `text-[13px]`
- Chip text: `text-[11px] font-semibold`
- Timestamp text: `text-[11px] font-mono`

### Borders & rounding
- `rounded-lg` (8px) max for all containers
- No `rounded-2xl` anywhere in HMS dashboard code
- `border border-slate-200` for panels
- No glassmorphism, no backdrop-blur, no floating shadows
- Shadows: only `shadow-sm` for panels, no `shadow-md`/`shadow-lg`

---

## 7. Data Honesty

### Sections that get real data
| Dashboard | Real data sections |
|-----------|-------------------|
| Doctor | Patient queue, basic counts from summary, critical results (if available) |
| Nurse | Triage queue, specimen queue, nursing tasks, summary counts |
| Lab | Specimen work queue, critical results, TAT metrics, turnaround cards |

### Sections marked "Data unavailable"
| Dashboard | Placeholder sections |
|-----------|---------------------|
| Doctor | "Today's Schedule" (no real API), "Pending Orders & Results" (Phase 2), "Unsigned Notes" (Phase 2) |
| Nurse | "Critical Vitals Alerts" (Phase 2), "Patient Handoff Timeline" (Phase 2) |
| Lab | "Workbench Analyzer View" (Phase 3), "SLA Breach Forecasting" (Phase 3) |

Each placeholder reads: `"🔒 {Section Name} — not yet connected. Expected integration: {Phase name}."` in the HmsDataUnavailable format.

---

## 8. Error / Loading / Edge Cases

| Condition | Behavior |
|-----------|----------|
| All hooks loading | HmsLoadingSkeleton (full page, panel variant) |
| One hook fails, others succeed | Failed section shows HmsDataUnavailable with error message; others render normally |
| All hooks fail | Full-page error state (existing pattern preserved, with retry button) |
| queueData is empty array | HmsWorkQueue shows HmsEmptyState: "No items in queue" |
| queueData is null/undefined | HmsWorkQueue shows HmsDataUnavailable: "Queue data unavailable" |
| summary is partial (some fields null) | Missing KPI fields show "—" dash, not 0 or NaN |
| Critical results list empty | HmsAlertRail collapses to "All clear — no alerts" |

---

## 9. Tests & Verification

### What to test
- All new components render each variant (default, loading, empty, error)
- Dashboards render with real hooks (existing test patterns preserved)
- Drilldown navigation works (row click → navigate)
- KPI strip shows correct derived values
- Alert rail shows/hides based on data

### What NOT to change
- Existing `useClinicalWorkflow` tests
- Existing `use-lab` tests
- Existing `use-nursing-tasks` tests
- Existing dashboard page tests (DoctorDashboard.test.tsx, NurseDashboard tests, LabDashboard tests)
- Existing backend tests

---

## 10. Implementation Order

1. Install `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono`
2. Update `index.css` — font family and color overrides
3. Build HMS dashboard primitives (by dependency order):
   1. `HmsStatusChip` + `HmsPriorityBadge`
   2. `HmsEmptyState` + `HmsDataUnavailable` + `HmsLoadingSkeleton`
   3. `HmsKpiStrip`
   4. `HmsAlertRail`
   5. `HmsWorkQueue` + `HmsDrilldownTable`
   6. `HmsSlaPanel`
   7. `HmsQuickActions`
   8. `HmsTrendChart`
   9. `HmsToolbar` + `HmsAuditFooter` + `HmsDashboardShell`
4. Export everything from `hms-dashboard/index.ts`
5. Refactor `DoctorDashboard.tsx` — use new primitives, preserve hooks
6. Refactor `NurseDashboard.tsx` — use new primitives, preserve hooks
7. Refactor `LabDashboard.tsx` — use new primitives, preserve hooks
8. Typecheck + lint + build + test
