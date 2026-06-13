# HMS Frontend Redesign — Combined Handoff Summary (Phases 1–7B)

## Summary

Eight local commits redesign the HMS frontend from Phase 1 through Phase 7B, replacing ad-hoc layout and repeated boilerplate with a shared dashboard-component system (`hms-dashboard`), a shared page-header primitive (`hms-page`), and a consistent visual language. Every redesigned page enforces production-honest unavailable states: when a real API is present the page shows it, but unsupported features are clearly labeled (e.g., "Real — Partial") with explicit scope notes rather than mocked data.

This is a significant refactor of the presentation layer. **It is not a full product redesign.** Phase 7A and Phase 7B remain partial LIS completion — `LabOrdersPage` carries placeholder fields, and no backend LIS integration exists for several sections.

---

## Completed Dashboard Scope

| Dashboard | Status |
|-----------|--------|
| `DoctorDashboard` | Redesigned with `HmsDashboardShell`, production-honest empty states |
| `NurseDashboard` | Redesigned with `HmsDashboardShell`, production-honest empty states |
| `LabDashboard` | Redesigned with `HmsDashboardShell`, production-honest empty states |
| `PharmacyDashboard` | Redesigned with `HmsDashboardShell`, production-honest empty states |
| `BillingDashboard` | Redesigned with `HmsDashboardShell`, production-honest empty states |
| `AdminExecutiveDashboard` | Redesigned with `HmsDashboardShell`, production-honest empty states |

Each dashboard uses the same skeleton: `HmsPageHeader` → `HmsDashboardShell` → conditional loading/error/unavailable → data rendering. Unavailable states carry honesty banners noting which API sections are unavailable rather than simulating them.

---

## Completed Workflow Scope

### Phase 3 — Clinical Workflow Redesign

- `NurseTriageQueuePage`
- `PatientBillingPage`
- `CashierSessionPage`

Shared `hms-page` primitives introduced. Dashboards and workflow pages decoupled.

### Phase 4 — LIS Encoding, Validation, Release

- `ResultEncodingPage`
- `ResultValidationPage`
- `ResultReleasePage`

Direct validation and release tests added.

### Phase 5 — Vitals, Specimen Intake, Invoices

- `NurseVitalsPage`
- `SpecimenReceivingPage`
- `InvoicesPage`

### Phase 6 — Cashier Module

- `PaymentsPage`
- `RefundVoidQueuePage`
- `DailyReconciliationPage`

All Phase 6 pages use HMS dashboard components.

### Phase 7A — Partial Lab Redesign

- `ReleasedResultsPage` — Redesigned, page-level tests added
- `ReleasedResultDetailPage` — Redesigned, page-level tests added
- `ValidatedResultsPage` — Redesigned, page-level tests added
- `LabOrdersPage` — Partial redesign started

Phase 7A brings the first four of six lab pages into the HMS component system with direct test coverage. `LabOrdersPage` is partially redesigned here and continued in 7B.

### Phase 7B — LIS Intake Enrichment

- `CriticalResultsPage` — Refactored to `HmsDrilldownTable` + `HmsStatusChip` + modal polish; error early-return; High Alert Protocol callout banner
- `TurnaroundMonitorPage` — KPI fix (overallAvgMinutes from `specimenToRelease` metric); `HmsKpiStrip` + `HmsDrilldownTable`; honest Real—Partial banner
- `LabOrdersPage` (continued) — Patient age/gender/DOB enriched from real `usePatientClinicalSummary` hook; search/filter moved into `HmsToolbar`; banner updated from "WIP/Mock — Masked Demographics" to "Real — Partial" with explicit disclosure of remaining placeholders

**LabOrdersPage now enriches:**
- `patientAge` (computed from `patientSummary.dob` via `differenceInYears`)
- `patientGender` (from `patientSummary.gender`)
- `dob` (formatted `yyyy-MM-dd`)

**Still placeholder/default:**
- `physician` → `'Attending Physician'` (static)
- `department` → `'Clinical Unit'` (static)
- `billingStatus` → `'Prepaid'` (static)
- `testPanels` → `[]` (empty; panel UI shows a dashed placeholder box "Panel details itemization pending LIS integration")

Page-level tests added for:
- `LabOrdersPage` (updated; enriched demographics assertions, Real—Partial banner)
- `CriticalResultsPage` (new; 181 lines — loading, error, data, search, acknowledge/escalate modals)
- `TurnaroundMonitorPage` (new; 167 lines — KPI values, table rows, detail toggle, loading/error/empty)

---

## Shared Systems

### `hms-dashboard` Component Library

Located in `hms-frontend/src/components/hms-dashboard/`. Provides:

| Component | Purpose |
|-----------|---------|
| `HmsDashboardShell` | Consistent layout wrapper with optional toolbar/footer slots |
| `HmsToolbar` | Slim action bar for search, filter, action buttons |
| `HmsAuditFooter` | Data-source attribution bar (used for every page) |
| `HmsLoadingSkeleton` | Animated placeholder rows during data fetch |
| `HmsDataUnavailable` | Dedicated error/unavailable state with API name disclosure |
| `HmsKpiStrip` | Horizontal KPI card bar with trend direction, severity color |
| `HmsDrilldownTable` | Reusable column-configurable data table with header/description |
| `HmsStatusChip` | Color-coded status badge with variant system |
| `HmsStatusVariant` | Type-safe variant union (`info`, `success`, `warning`, `critical`) |

### `hms-page` Component Library

Located in `hms-frontend/src/components/hms-page/`. Provides:

| Component | Purpose |
|-----------|---------|
| `HmsPageHeader` | Consistent page title + description + optional badge |

### Visual Direction

- Consistent typography: `text-[10px] font-black uppercase tracking-wider` for labels, `text-xs font-semibold` for body copy, monospace for data values
- Consistent card language: `rounded-2xl`, `border border-slate-200/80`, `shadow-sm`
- Consistent color semantics: rose/amber for critical/warning, emerald for success, indigo for info, slate for neutral
- Modal pattern: `fixed inset-0 bg-slate-900/60 backdrop-blur-sm`, `rounded-3xl`, `animate-scale-in`
- All legacy `PageHeader` usage replaced with `HmsPageHeader` inside `HmsDashboardShell`

---

## Data Honesty Rule

Every redesigned page follows these rules:

1. **Real data gets real treatment.** If the API returns data, it is displayed accurately.
2. **Errors are not hidden.** API errors render `HmsDataUnavailable` with the expected endpoint name — no fallback to fake data.
3. **Placeholders are labeled.** Any static/default value carries an honesty banner or inline disclosure (e.g., "Real — Partial", "Panel details itemization pending LIS integration").
4. **Scope limits are explicit.** Every "Real — Partial" banner explains exactly what is out of scope (e.g., "External paging/SMS/email alerting…out of scope", "No SLA targets, no predictive analytics, no policy engine").
5. **No fabricated data.** Missing timestamps are represented honestly — the UI shows `—` or `N/A`, never simulated values.
6. **Simulated workflow actions show appropriate messaging.** If a button triggers `alert()` rather than an API call, it is clearly a placeholder for future integration.

---

## Verification

All verification is local-only and focused on the frontend redesign:

| Check | Status |
|-------|--------|
| Frontend typecheck | Passing |
| Frontend lint | Passing (8 pre-existing lint errors in `RadiologyCanvas.tsx` — predate redesign) |
| Build | Succeeds locally |
| Page-level component tests | Added for redesigned pages (see test coverage table below) |
| Staging/CI/production proof | **None available** — local verification only |

### Page-Level Test Coverage

| Test File | Lines | Covers |
|-----------|-------|--------|
| `ReleasedResultsPage.test.tsx` | — | Rendering, states, interactions |
| `ReleasedResultDetailPage.test.tsx` | — | Rendering, states, interactions |
| `ValidatedResultsPage.test.tsx` | — | Rendering, states, interactions |
| `LabOrdersPage.test.tsx` | Updated | Enriched demographics, honesty banner, filters, receive modal |
| `CriticalResultsPage.test.tsx` | 181 | Loading, error, data, search, acknowledge/escalate modals |
| `TurnaroundMonitorPage.test.tsx` | 167 | KPI values, table, detail toggle, loading/error/empty |

---

## Not Yet Done

### Pages Not Yet Fully Standardized with HMS Primitives

The following LIS areas still need follow-up work:
- `LabOrdersPage` remains partially completed even after Phase 7B
- Legacy lab subcomponents still remain in use in parts of the portal, including:
  - `CriticalResultPanel.tsx`
  - `LabOrderHeader.tsx`
  - `LabStatusBadge.tsx`
  - `TurnaroundTimeCard.tsx`
  - `SpecimenWorkQueue.tsx`
- Additional non-lab portals outside the completed redesign set still use older layout patterns
- Admin / configuration / support pages remain outside the completed redesign scope

### Explicit Limitations

- **Phase 7A and 7B are partial LIS completion.** `LabOrdersPage` now enriches age, gender, and DOB, but `physician`, `department`, `billingStatus`, and `testPanels` remain static placeholders.
- **TurnaroundMonitorPage** still has no SLA policy engine, predictive analytics, or analyzer integration.
- **CriticalResultsPage** still has no external paging, SMS, email alerting, or automated threshold policy engine.
- **No backend changes.** This redesign is presentation-layer only; backend controllers, services, and Prisma schema were not changed by these frontend redesign commits.

---

## Recommended Next Phase

**Phase 8 — Remaining LIS Standardization & Legacy Component Retirement**

Focus the next phase on finishing the remaining partial and legacy LIS surface area by:
- completing `LabOrdersPage` beyond its current partial state
- retiring remaining legacy lab presentation components where HMS primitives can replace them
- standardizing any remaining lab registry/detail views that still fall outside the `HmsDashboardShell` / `HmsPageHeader` / `HmsDrilldownTable` pattern
- only after LIS consistency is complete, expanding the redesign into the next non-lab portal group

---

## Local Redesign Commit History

| Hash | Title |
|------|-------|
| `9e5a0e6` | `feat: add HMS clinical dashboard system with Doctor, Nurse, and Lab dashboards` |
| `1f4bda6` | `feat(frontend): refactor Phase 2 dashboards with production-honest unavailable states` |
| `fe208ff` | `feat(frontend): add Phase 3 workflow redesign with shared hms-page primitives` |
| `75b7c67` | `feat(frontend): redesign Phase 4 LIS workflow pages with direct validation and release tests` |
| `edec725` | `feat(frontend): redesign Phase 5 workflow pages with vitals workstation, specimen intake desk, and invoice drilldown` |
| `35b45bc` | `feat(frontend): Phase 6 cashier redesign — Payments, Refund/Void, Daily Reconciliation with HMS dashboard components` |
| `1852d2f` | `feat(frontend): Phase 7A partial lab redesign with HMS primitives and page-level tests` |
| `97569bd` | `feat(frontend): Phase 7B partial LIS redesign with HMS primitives and enriched intake demographics` |

All commits are local-only on `main`. No pushes have been made. No PRs have been opened. The branch is 8 commits ahead of remote.
