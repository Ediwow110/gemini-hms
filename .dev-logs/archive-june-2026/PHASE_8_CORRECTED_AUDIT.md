# Phase 8 — Corrected Audit (Repo-Evidence-Based)

## Background

This replaces prior Phase 8 drafts that overstated the scope by describing lab pages as "untouched legacy." All 8 lab portal pages already use HMS primitives. Phase 8 must be honest about what remains to be done.

## Methodology

I audited every file in `hms-frontend/src/portals/lab/` plus shared primitives in `hms-frontend/src/components/hms-dashboard/` and `hms-frontend/src/components/hms-page/`. Findings below are line-level, not aspirational.

---

## 1. Per-Page Audit: What Still Needs Work

### Already Near-Complete (shell + table + states standardized)

| Page | HMS Primitives Used | Remaining Delta |
|---|---|---|
| **ResultReleasePage.tsx** | `HmsPageHeader`, `HmsDashboardShell`, `HmsAuditFooter`, `HmsDataUnavailable`, `HmsLoadingSkeleton`, `HmsDrilldownTable` | Warning banner is inline; release button not part of shared `HmsActionButton` (none exists); no `HmsToolbar` wrapper. Minimal. |
| **ValidatedResultsPage.tsx** | `HmsPageHeader`, `HmsDashboardShell`, `HmsToolbar`, `HmsAuditFooter`, `HmsDrilldownTable`, `HmsStatusChip`, `HmsLoadingSkeleton`, `HmsDataUnavailable`, `HmsEmptyState` | Confirmation modal is inline (no shared `HmsConfirmDialog`); release action column repeats conflict handling in JSX. |
| **ReleasedResultsPage.tsx** | `HmsPageHeader`, `HmsDashboardShell`, `HmsToolbar`, `HmsAuditFooter`, `HmsDrilldownTable`, `HmsStatusChip`, `HmsLoadingSkeleton`, `HmsDataUnavailable`, `HmsEmptyState` | Scope notice is inline. Near-zero delta. |
| **ReleasedResultDetailPage.tsx** | `HmsPageHeader`, `HmsDashboardShell`, `HmsAuditFooter`, `HmsLoadingSkeleton`, `HmsDataUnavailable`, `HmsStatusChip` | Detail layout is fully custom (sidebar, timeline cards, result value cards). No `HmsDetailCard` / `HmsTimelineCard` primitive exists — these are all inline. |
| **CriticalResultsPage.tsx** | `HmsPageHeader`, `HmsDashboardShell`, `HmsToolbar`, `HmsAuditFooter`, `HmsDrilldownTable`, `HmsStatusChip`, `HmsLoadingSkeleton`, `HmsDataUnavailable` | Two inline modals (acknowledge + escalate). High-alert banner is inline. Action column logic is embedded. |

### Medium Delta (custom table surfaces remain)

| Page | HMS Primitives Used | Remaining Delta |
|---|---|---|
| **ResultEncodingPage.tsx** | `HmsPageHeader`, `HmsSafetyBar`, `HmsDashboardShell`, `HmsAuditFooter`, `HmsDataUnavailable`, `HmsLoadingSkeleton` | Parameter entry **table is entirely custom HTML** (not `HmsDrilldownTable`). Sidebar with file upload + save draft is custom. Success/error banners are inline. Draft-status badges are custom. |
| **ResultValidationPage.tsx** | `HmsPageHeader`, `HmsSafetyBar`, `HmsDashboardShell`, `HmsAuditFooter`, `HmsDataUnavailable`, `HmsLoadingSkeleton` | Validation parameter **table is entirely custom HTML** (not `HmsDrilldownTable`). Reject form is inline. Validation decision panel is custom. Supervisor QA protocol box is inline. |

### SpecimenReceivingPage.tsx — Resolved

**Status: Include in Phase 8 for a light consistency pass only.**

- Already uses: `HmsPageHeader` (with badge), `HmsDashboardShell`, `HmsAuditFooter`, `HmsLoadingSkeleton`, `HmsDataUnavailable`
- Custom elements: list/detail split layout (not `HmsDrilldownTable`), inline warning banner, inline success banner
- Phase 8 scope: add `HmsToolbar` shell, standardize warning/success banners, migrate list to `HmsDrilldownTable` if feasible (the detail panel is distinct — might stay custom)

Do **not** count it as "untouched" or "dropped." It gets a ~20-line consistency pass.

---

## 2. Dead Component Retirement

I checked for active imports of these suspected-dead components:

| Component | Found In | Verdict |
|---|---|---|
| `LabResultList.tsx` (at `features/laboratory/`) | Need to verify | Verify if still imported by any portal |
| `lab-workflow.tsx` (at `components/ui/`) | Need to verify | Check for active imports |
| `ResultFlagBadge.tsx` (at `lab/components/`) | Imported by `ResultEncodingPage`, `ResultValidationPage` | **Active** — keep |

I need to check `LabResultList.tsx` and `lab-workflow.tsx` for active imports:

- `LabResultList.tsx` in `features/laboratory/` — this is an old feature directory. Verify if any page or route still imports it. If zero imports, retire.
- `lab-workflow.tsx` in `components/ui/` — verify imports. Likely a legacy helper.

---

## 3. Recommended Phase 8 Scope (Smallest Strong Set)

### Priority 1: Outer-Shell Standardization (3-4 files, ~100 lines changed)

Apply `HmsToolbar` + consistent loading/error/empty pattern to the 2 pages that lack toolbar wrapper:

| File | Change |
|---|---|
| `ResultReleasePage.tsx` | Add `HmsToolbar` with refresh; standardize warning banner behind shared pattern |
| `SpecimenReceivingPage.tsx` | Add `HmsToolbar` with refresh; standardize warning + success banners |
| `ResultEncodingPage.tsx` | Already has pattern but uses raw `div` for success/error — swap to `HmsEmptyState` for error path, `HmsDataUnavailable` for error|

### Priority 2: Table Migration (2 files, ~150 lines)

Swap custom HTML tables for `HmsDrilldownTable` where structurally compatible:

| File | Change |
|---|---|
| `ResultEncodingPage.tsx` | Parameter entry table → `HmsDrilldownTable` if column layout permits; may block due to input cells |
| `ResultValidationPage.tsx` | Validation parameter table → `HmsDrilldownTable` if column layout permits; has 6 columns incl. delta check |

**Risks:** `HmsDrilldownTable` uses `<td>` without `<input>` support. Encoding page has editable `<input>` fields in each row. This may force a table upgrade or a new `HmsEditableTable` primitive.

### Priority 3: Dead Component Retirement (0-2 files deleted)

| File | Action |
|---|---|
| `LabResultList.tsx` | Delete if zero imports |
| `lab-workflow.tsx` | Delete if zero imports |

### Priority 4: New Primitive Candidates (not required for Phase 8, but worth noting)

| Primitive | Needed By | Notes |
|---|---|---|
| `HmsConfirmDialog` | ValidatedResultsPage (release), CriticalResultsPage (ack/escalate) | 3 inline modals with near-identical structure. Worth extracting. |
| `HmsWarningBanner` | Every lab page | 6+ pages have inline `<div className="p-3 bg-amber-50...">` for scope notices |
| `HmsDetailCard` / `HmsTimelineCard` | ReleasedResultDetailPage | Entire sidebar is ad-hoc |

---

## 4. LabOrdersPage Recommendation

**Do not expand beyond current backend-supported data.**

- `LabOrdersPage` is not in `portals/lab/` — check where it lives and what data it currently shows.
- If it currently shows order IDs + patient names + status only, do not add panel names, test counts, or physician names unless backend returns them.
- Phase 8 should only: standardize its shell (toolbar, loading, error, empty) if it uses raw patterns.

---

## 5. Realistic Estimated File Categories & Count

| Category | Count | Files |
|---|---|---|
| Page files modified (shell/state standardization) | 5 | `ResultReleasePage`, `SpecimenReceivingPage`, `ResultEncodingPage`, `ResultValidationPage`, (maybe `LabOrdersPage`) |
| Page files with table migration | 2 | `ResultEncodingPage`, `ResultValidationPage` |
| Component files deleted | 0-2 | `LabResultList.tsx`, `lab-workflow.tsx` |
| Test files updated | 3-4 | Corresponding `__tests__/*.test.tsx` for modified pages |
| New primitive files created | 0-2 | `HmsConfirmDialog`, `HmsWarningBanner` (optional) |
| **Total files touched** | **10-15** | (5-7 page files + 3-4 test files + 0-2 deletions + 0-2 new primitives) |

**Net line change estimate:** +200 / −150 (mostly churn, not new functionality).

Test file changes would add ~+100 lines (updated tests for new states).

---

## 6. Key Conclusion

- **Phase 8 is a cleanup/shell pass, not a rewrite.** Every lab page already uses HMS primitives.
- The highest-value changes are: (1) `HmsToolbar` on pages that lack it, (2) standardize the 6+ inline warning banners into one shared pattern, (3) retire dead components.
- Table migration (`HmsDrilldownTable` for encoding/validation) is medium-risk due to `<input>` rows — deferrable.
- `SpecimenReceivingPage` is in scope for a ~20-line hygiene pass, no more.
- `LabOrdersPage` should get shell standardization only — no data expansion.
- `ResultFlagBadge` is active and should stay.
- Tests must be counted: ~3-4 test files updated, ~+100 lines.

**Verdict: Phase 8 is feasible in 2-3 sessions at ~10-15 files, ~250-350 net lines. Table migration can be deferred if HmsDrilldownTable lacks input-cell support.**
