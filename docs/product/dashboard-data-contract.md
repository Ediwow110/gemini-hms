# Dashboard Data and KPI Contract

**Date:** 2026-05-31
**Phase:** D2 (Data & KPI Contract)
**Verdict:** STAGING-ONLY / Dashboard Data Planning

## 1. Purpose

This document defines the exact data structures, formulas, and API contracts required to power the Gemini-HMS dashboards. It serves as the technical blueprint for backend developers (to implement endpoints) and frontend developers (to build charts and KPI cards).

**Constraints:**
- All endpoints are **PROPOSED** unless explicitly marked as existing.
- Real PHI must **NEVER** be used in examples. Only synthetic/demo data is permitted.
- Verdict remains **STAGING-ONLY**.

---

## 2. Global Query & Filter Model

To ensure consistency across all dashboards, all dashboard APIs shall follow a standardized query and response wrapper.

### 2.1 Common Request Filters
`GET` requests shall accept the following query parameters:
- `dateFrom` (ISO8601): Start of the observation window.
- `dateTo` (ISO8601): End of the observation window.
- `branchId` (UUID): Filter by specific branch (optional for Super Admin).
- `departmentId` (UUID): Filter by specific department.
- `status` (String): Filter by operational status (e.g., `PENDING`, `ACTIVE`).
- `comparisonPeriod` (Enum): `NONE`, `PREVIOUS_DAY`, `PREVIOUS_WEEK`, `PREVIOUS_MONTH`.
- `timezone` (String): IANA timezone string for date normalization.
- `limit` (Integer): Used for Top-N tables (default: 10).

### 2.2 Common Response Metadata
Every dashboard response shall wrap the data in a metadata object:
```json
{
  "metadata": {
    "generatedAt": "2026-05-31T10:00:00Z",
    "dataAsOf": "2026-05-31T09:55:00Z",
    "filtersApplied": {
      "branchId": "...",
      "dateRange": "last_7_days"
    },
    "source": "live_db",
    "isMock": false,
    "warnings": []
  },
  "data": { ... }
}
```

---

## 3. KPI Contracts

### 3.1 Executive & Admin KPIs
| KPI Name | Page | Role | Definition | Formula | Window | Source Model | Proposed Field | Example Value |
|---|---|---|---|---|---|---|---|---|
| `activePatients` | Executive | SA, Admin | Patients with an encounter in the last 30 days | `COUNT(Patient) where lastEncounter < 30d` | 30d | `Patient` | `activePatientsCount` | `12,450` |
| `todaysAppointments` | Executive | SA, Admin | Scheduled appointments for today | `COUNT(Appointment) where date = TODAY` | 24h | `Appointment` | `todaysAppointmentCount` | `142` |
| `admissions` | Executive | SA, Admin | Total admissions in window | `COUNT(Encounter) where type=INPATIENT` | Variable | `Encounter` | `totalAdmissions` | `24` |
| `discharges` | Executive | SA, Admin | Total discharges in window | `COUNT(Encounter) where status=FINISHED` | Variable | `Encounter` | `totalDischarges` | `18` |
| `unpaidBills` | Executive | SA, Admin, Billing | Total value of unpaid invoices | `SUM(Invoice.totalAmount) where status=UNPAID` | All-time | `Invoice` | `totalUnpaidAmount` | `$45,200.00` |
| `overdueBills` | Executive | SA, Admin, Billing | Invoices past due date | `COUNT(Invoice) where dueDate < NOW and status=UNPAID` | All-time | `Invoice` | `overdueInvoiceCount` | `84` |
| `revenueToday` | Executive | SA, Admin, Billing | Total collections today | `SUM(Payment.amount) where createdAt = TODAY` | 24h | `Payment` | `dailyRevenue` | `$12,400.00` |
| `revenueMonth` | Executive | SA, Admin, Billing | Total collections this month | `SUM(Payment.amount) where month = CURRENT` | 30d | `Payment` | `monthlyRevenue` | `$340,000.00` |
| `pendingClaims` | Executive | SA, Admin, Billing | Insurance claims not yet settled | `COUNT(Claim) where status=PENDING` | All-time | `Claim` | `pendingClaimsCount` | `112` |
| `auditAlerts` | Executive | SA, IT | High-risk security events | `COUNT(AuditLog) where risk=HIGH` | 24h | `AuditLog` | `securityAlertCount` | `3` |
| `branchWorkload` | Executive | SA, Admin | Patient count per branch | `COUNT(Encounter) GROUP BY branchId` | 24h | `Encounter` | `branchLoadMap` | `{"B1": 45, "B2": 30}` |
| `deptWorkload` | Executive | SA, Admin | Patient count per dept | `COUNT(Encounter) GROUP BY deptId` | 24h | `Encounter` | `deptLoadMap` | `{"Pediatrics": 12, ...}` |

### 3.2 Clinical & Operational KPIs
| KPI Name | Page | Role | Definition | Formula | Window | Source Model | Proposed Field | Example Value |
|---|---|---|---|---|---|---|---|---|
| `pendingLabs` | Clinical | Doctor, Nurse, Lab | Samples collected but not validated | `COUNT(LabResult) where status=PENDING` | Real-time | `LabResult` | `pendingLabCount` | `28` |
| `abnormalLabs` | Clinical | Doctor, Nurse, Lab | Results with critical/abnormal flags | `COUNT(LabResult) where isCritical=true` | 24h | `LabResult` | `criticalLabCount` | `5` |
| `labTurnaroundTime`| Clinical | Doctor, Lab | Avg time from collection to release | `AVG(releasedAt - collectedAt)` | 30d | `LabResult` | `avgTurnaroundHours` | `4.2 hrs` |
| `patientWaitTime` | Clinical | Admin, Nurse | Avg time from check-in to doctor | `AVG(encounterStartedAt - checkedInAt)` | 24h | `Encounter` | `avgWaitTimeMinutes` | `22 min` | **GAP** |
| `bedOccupancy` | Clinical | Admin, Nurse | % of beds currently occupied | `(OccupiedBeds / TotalBeds) * 100` | Real-time | `Bed` | `occupancyRate` | `82%` | **GAP** |

### 3.3 Pharmacy & Inventory KPIs
| KPI Name | Page | Role | Definition | Formula | Window | Source Model | Proposed Field | Example Value |
|---|---|---|---|---|---|---|---|---|
| `lowStockMedicines` | Pharmacy | Pharmacist, Admin | Items below reorder level | `COUNT(BranchStock) where qty < reorderLevel` | Real-time | `BranchStock` | `lowStockCount` | `14` |
| `nearExpiryMeds` | Pharmacy | Pharmacist, Admin | Items expiring in next 30 days | `COUNT(InventoryItem) where expiry < 30d` | 30d | `InventoryItem` | `nearExpiryCount` | `8` |
| `pharmacyStockVal` | Pharmacy | Pharmacist, Admin | Total value of on-hand stock | `SUM(qty * unitPrice)` | Real-time | `BranchStock` | `totalStockValue` | `$120,400.00` |

---

## 4. Chart Data Contracts

### 4.1 Time Series (Line/Area Charts)
Used for revenue trends, patient volume, or TAT.
```json
{
  "labels": ["2026-05-01", "2026-05-02", "..."],
  "datasets": [
    {
      "label": "Current Period",
      "data": [120, 150, 130, ...],
      "borderColor": "#4f46e5"
    },
    {
      "label": "Comparison Period",
      "data": [110, 140, 120, ...],
      "borderColor": "#9ca3af"
    }
  ]
}
```

### 4.2 Categorical Distribution (Donut/Pie Charts)
Used for patient status, department workload, or payment methods.
```json
{
  "labels": ["Pediatrics", "Cardiology", "Orthopedics"],
  "datasets": [
    {
      "data": [45, 25, 30],
      "backgroundColor": ["#ef4444", "#3b82f6", "#10b981"]
    }
  ]
}
```

### 4.3 Top-N Table (Ranking)
Used for busiest departments, high-value unpaid bills, etc.
```json
[
  {
    "rank": 1,
    "label": "Department A",
    "value": 450,
    "trend": "+5%",
    "drillDownUrl": "/admin/departments/dept-a"
  },
  ...
]
```

### 4.4 Alert List
Used for critical labs, low stock, or security alerts.
```json
[
  {
    "id": "alert-123",
    "severity": "CRITICAL",
    "title": "Abnormal Lab Result",
    "message": "Patient P-101: Potassium 6.2 mEq/L",
    "timestamp": "2026-05-31T09:15:00Z",
    "actionUrl": "/clinical/lab-results/res-123"
  },
  ...
]
```

---

## 5. Proposed API Endpoints

All endpoints are **PROPOSED**.

### 5.1 Admin / Executive
- `GET /dashboard/admin/summary`
    - **Purpose**: Fetch all top-level KPI cards and alerts.
    - **Auth**: Admin / Super Admin.
    - **Response**: `{ activePatients, todaysAppointments, totalRevenue, ... }`
- `GET /dashboard/admin/trends`
    - **Purpose**: Fetch time-series data for revenue and patient volume.
    - **Auth**: Admin / Super Admin.
    - **Response**: `{ revenueTrend: TimeSeries, patientTrend: TimeSeries }`
- `GET /dashboard/admin/top-lists`
    - **Purpose**: Fetch Top-N tables (unpaid bills, busiest depts).
    - **Auth**: Admin / Super Admin.
    - **Response**: `{ topUnpaidBills: TopN[], busiestDepts: TopN[] }`

### 5.2 Clinical Operations
- `GET /dashboard/clinical/summary`
    - **Purpose**: Queue status, pending labs, and urgent vitals.
    - **Auth**: Doctor, Nurse, Admin.
    - **Response**: `{ waitingPatients, pendingLabs, criticalVitalsCount, ... }`

### 5.3 Pharmacy
- `GET /dashboard/pharmacy/summary`
    - **Purpose**: Stock risks, expiry alerts, and dispensing queue.
    - **Auth**: Pharmacist, Admin.
    - **Response**: `{ lowStockCount, nearExpiryCount, pendingPrescriptions, stockValue, ... }`

### 5.4 Lab
- `GET /dashboard/lab/summary`
    - **Purpose**: Sample processing status and TAT.
    - **Auth**: Lab Tech, Doctor, Admin.
    - **Response**: `{ pendingSamples, validatedCount, avgTAT, criticalResults, ... }`

### 5.5 Billing
- `GET /dashboard/billing/summary`
    - **Purpose**: Revenue, collections, and claim status.
    - **Auth**: Cashier, Admin.
    - **Response**: `{ dailyRevenue, totalUnpaid, pendingClaims, collectionTrend, ... }`

---

## 6. Role Access Matrix

| Role | Executive | Clinical Ops | Pharmacy | Lab | Billing | Audit/Security |
|---|---|---|---|---|---|---|
| **Super Admin** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Admin** | ✅ Full | ✅ Full | ✅ Limited | ✅ Limited | ✅ Full | ✅ Limited |
| **Doctor** | ❌ | ✅ Full | ❌ | ✅ Limited | ❌ | ❌ |
| **Nurse** | ❌ | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Pharmacist** | ❌ | ❌ | ✅ Full | ❌ | ❌ | ❌ |
| **Lab Tech** | ❌ | ❌ | ❌ | ✅ Full | ❌ | ❌ |
| **Cashier** | ❌ | ❌ | ❌ | ❌ | ✅ Full | ❌ |
| **Receptionist** | ❌ | ✅ Limited | ❌ | ❌ | ❌ | ❌ |
| **IT Support** | ✅ Limited | ❌ | ❌ | ❌ | ❌ | ✅ Full |

---

## 7. Privacy and Safety Rules

- **No Cross-Tenant Leakage**: Every query must include `tenantId` in the `WHERE` clause.
- **Branch Isolation**: Branch Admins only see data for their assigned branch.
- **Aggregate PHI**: Dashboard summaries must use counts/sums. PHI (Name, DOB) is forbidden in summary API responses.
- **Drill-down RBAC**: Clicking a "Critical Lab" card must trigger a full RBAC check before opening the patient's record.
- **Synthetic Examples**: All API documentation examples use synthetic data.

---

## 8. Loading, Error, and Empty States

- **Loading**: Skeletons for KPI cards; spinner for large charts.
- **Empty State**: "No data available for the selected period" with a suggestion to change filters.
- **Partial Data**: Warning banner: "Some data is currently unavailable due to system latency."
- **Permission Denied**: "You do not have permission to view this metric" with a lock icon.
- **Stale Data**: Timestamp "Last updated: 5 mins ago" with a manual refresh button.

---

## 9. Performance and Caching

- **Freshness**:
    - Executive KPIs: Cache 15 mins.
    - Clinical/Lab/Pharmacy: Cache 1 min (Near real-time).
- **Aggregation**: Heavy aggregates (e.g., Year-to-Date Revenue) should be pre-computed via Materialized Views or a caching layer.
- **Payload Size**: Top-N tables limited to 50 records max to prevent frontend lag.

---

## 10. Data Gaps and Implementation Questions

| Metric | Gap | Impact | Resolution | Blocks D3/D4? | Blocks D5/D6? |
|---|---|---|---|---|---|
| `patientWaitTime` | No check-in $\rightarrow$ encounter start timestamp | Cannot calculate wait time | Add `checkedInAt` to `Encounter` or use `QueueEntry` | Yes | Yes |
| `bedOccupancy` | No `Bed` model in schema | Cannot track occupancy | Implement `Bed` model and `BedAssignment` | Yes | Yes |
| `revenueMonth` | No pre-calculated monthly totals | Slow queries on large data | Implement summary tables | No | Yes |
| `recoveryRate` | No "Recovery" status defined | Cannot calculate success rate | Define `ClinicalOutcome` enum | No | Yes |
