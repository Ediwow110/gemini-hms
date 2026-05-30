# Dashboard Requirements Map

**Date:** 2026-05-31
**Phase:** D1 (Requirements Map)
**Verdict:** STAGING-ONLY / Dashboard Planning

## 1. Dashboard Goals

The primary goal of the Gemini-HMS Dashboard system is to reduce the "time-to-decision" for healthcare operators. Instead of navigating through multiple modules to find status, the dashboards provide a high-level operational "cockpit" that highlights anomalies, risks, and immediate actions.

**Core Objectives:**
- **Identify Criticality**: Surface abnormal labs, low stock, or urgent patient alerts immediately.
- **Operational Visibility**: Monitor patient flow, branch workload, and revenue leakage in real-time.
- **Role-Based Focus**: Ensure users see only the data necessary for their specific operational decisions.
- **Actionability**: Every KPI or chart should lead to a specific drill-down action.

---

## 2. Target Roles & Decision Matrices

### 2.1 Super Admin / Owner
**Primary Decisions**: System health, multi-branch profitability, overall growth, and security compliance.
- **Top 5 KPIs**:
    1. Total Revenue (Multi-branch, Month-to-Date)
    2. Active Patient Growth Rate
    3. System-wide Resource Utilization (Staff vs. Patient Load)
    4. Critical Security/Audit Alerts (Unauthorized access attempts)
    5. Total Outstanding Receivables
- **Critical Alerts**: System outages, high-risk audit failures, severe revenue drops.
- **Useful Charts**: Revenue trend by branch (Bar), Patient acquisition source (Pie), Monthly growth (Line).
- **Useful Tables**: Branch performance ranking, Top 10 highest-value unpaid invoices.
- **Filters**: Date range, Branch, Tenant.
- **Forbidden Data**: Individual patient PHI in summary views.
- **Drill-down**: Branch-specific dashboards, Audit log details.

### 2.2 Admin (Branch/Facility)
**Primary Decisions**: Daily branch operations, staffing levels, and local revenue.
- **Top 5 KPIs**:
    1. Today's Appointment Volume
    2. Average Patient Wait Time
    3. Daily Revenue vs. Target
    4. Pending Approvals (Refunds, Role changes)
    5. Departmental Workload Distribution
- **Critical Alerts**: Staff shortages, appointment bottlenecks, pending urgent approvals.
- **Useful Charts**: Hourly patient arrival (Area), Revenue by department (Donut), Wait time trends (Line).
- **Useful Tables**: Pending approvals queue, Staff attendance status.
- **Filters**: Date, Department, Staff member.
- **Forbidden Data**: Global tenant-level financial data.
- **Drill-down**: Staff schedules, Departmental reports.

### 2.3 Doctor
**Primary Decisions**: Patient prioritization, treatment efficacy, and schedule management.
- **Top 5 KPIs**:
    1. Patients in Queue (Urgent vs. Routine)
    2. Pending Lab Results to Review
    3. Today's Scheduled Appointments
    4. Patient Recovery/Outcome Rate (if tracked)
    5. Pending Referrals
- **Critical Alerts**: Critical lab results (Panic values), urgent patient requests.
- **Useful Charts**: Patient volume by diagnosis (Bar), Treatment success rate (Pie).
- **Useful Tables**: Today's patient list (Status: Waiting/In-Room), Urgent lab results.
- **Filters**: Patient status, Diagnosis category, Priority.
- **Forbidden Data**: Other doctors' private patient notes (unless shared).
- **Drill-down**: Patient EMR, Lab result details.

### 2.4 Nurse
**Primary Decisions**: Triage prioritization, vitals monitoring, and task execution.
- **Top 5 KPIs**:
    1. Patients awaiting triage
    2. Pending vitals entry
    3. Active nurse tasks (Pending/Overdue)
    4. Room utilization/availability
    5. Critical vitals alerts
  - **Critical Alerts**: Abnormal vitals detected, overdue medication administration.
- **Useful Charts**: Triage acuity distribution (Donut), Task completion rate (Gauge).
- **Useful Tables**: Triage queue, Task list by priority.
- **Filters**: Room, Patient acuity, Task type.
- **Forbidden Data**: Financial/Billing data.
- **Drill-down**: Patient vitals, Triage record.

### 2.5 Pharmacist
**Primary Decisions**: Inventory replenishment, dispensing accuracy, and expiry management.
- **Top 5 KPIs**:
    1. Low Stock Alerts (Count of items below reorder level)
    2. Near-Expiry Medications (Next 30 days)
    3. Pending Prescriptions to Dispense
    4. Dispensing Turnaround Time (Avg)
    5. Inventory Value (Total)
- **Critical Alerts**: Out-of-stock critical drugs, expired medication found.
- **Useful Charts**: Drug usage trend (Line), Inventory distribution by category (Pie).
- **Useful Tables**: Low stock list, Pending prescription queue.
- **Filters**: Drug category, Supplier, Expiry date range.
- **Forbidden Data**: Clinical notes not relevant to dispensing.
- **Drill-down**: Inventory item details, Prescription records.

### 2.6 Lab Technician
**Primary Decisions**: Sample processing priority and result validation.
- **Top 5 KPIs**:
    1. Pending Samples to Process
    2. Validated Results awaiting release
    3. Average Turnaround Time (TAT)
    4. Critical/Abnormal result count
    5. Equipment status (Calibration/Online)
- **Critical Alerts**: Overdue samples, critical value detection.
- **Useful Charts**: TAT trend per test type (Line), Sample volume by department (Bar).
- **Useful Tables**: Pending lab queue, Validated results queue.
- **Filters**: Test category, Priority, Sample status.
- **Forbidden Data**: Billing/Insurance details.
- **Drill-down**: Lab result entry, Specimen details.

### 2.7 Billing / Cashier
**Primary Decisions**: Payment collection, claim submission, and refund processing.
- **Top 5 KPIs**:
    1. Today's Total Collections
    2. Pending Invoices (Unpaid)
    3. Claims Pending Submission
    4. Refund Requests awaiting approval
    5. Average Payment Cycle (Days)
- **Critical Alerts**: High-value unpaid bills, rejected insurance claims.
- **Useful Charts**: Revenue by payment method (Donut), Daily collection trend (Line).
- **Useful Tables**: Outstanding invoices (Top-N), Rejected claims list.
- **Filters**: Payment status, Insurance provider, Date range.
- **Forbidden Data**: Clinical diagnosis details (except as needed for billing).
- **Drill-down**: Invoice details, Payment history.

### 2.8 Receptionist
**Primary Decisions**: Patient check-in flow and appointment scheduling.
- **Top 5 KPIs**:
    1. Appointments Today
    2. Patients Checked-in vs. Expected
    3. New Patient Registrations
    4. Cancellation Rate
    5. Average Check-in Time
- **Critical Alerts**: Double-booked slots, patient arrival without appointment.
- **Useful Charts**: Appointment distribution by doctor (Bar), Check-in volume by hour (Area).
- **Useful Tables**: Today's schedule, Patient check-in queue.
- **Filters**: Doctor, Date, Appointment status.
- **Forbidden Data**: Clinical notes, detailed billing.
- **Drill-down**: Appointment booking, Patient profile.

### 2.9 IT / Admin Support
**Primary Decisions**: System stability, user access, and audit compliance.
- **Top 5 KPIs**:
    1. System Uptime / Health
    2. Active User Sessions
    3. Pending User Access Requests
    4. High-Risk Audit Events (Unauthorized access)
    5. API Error Rate
- **Critical Alerts**: Database latency, authentication failures, system crashes.
- **Useful Charts**: Session concurrency (Line), Error distribution by endpoint (Pie).
- **Useful Tables**: Recent security alerts, User session list.
- **Filters**: User role, IP address, Event type.
- **Forbidden Data**: Clinical PHI (unless auditing a specific breach).
- **Drill-down**: Audit logs, System logs.

---

## 3. Global Filters

All dashboards shall support a standardized filter bar:
- **Date Range**: Preset (Today, Yesterday, Last 7 Days, Last 30 Days, Custom).
- **Branch**: Multi-select (for Super Admin) or Single-select (for Branch Admin).
- **Department**: Multi-select (Clinical, Pharmacy, Lab, Billing, etc.).
- **Status**: Contextual (e.g., Pending, Completed, Cancelled).
- **Role-Specific Filters**: (e.g., Doctor filter for Nurses, Drug Category for Pharmacists).

---

## 4. Proposed Dashboard Pages

| Page Name | Target Roles | Primary Focus |
|---|---|---|
| **Executive Dashboard** | Super Admin, Admin | Financials, Growth, Multi-branch performance, System health. |
| **Clinical Ops Dashboard** | Admin, Doctor, Nurse | Patient flow, Wait times, Triage, Room utilization. |
| **Pharmacy Dashboard** | Pharmacist, Admin | Stock risk, Expiry, Dispensing queue, Inventory value. |
| **Lab Dashboard** | Lab Tech, Doctor, Admin | TAT, Pending samples, Critical results, Workload. |
| **Billing Dashboard** | Cashier, Admin | Revenue, Unpaid bills, Insurance claims, Collection trends. |
| **Patient Flow Dashboard** | Receptionist, Nurse, Admin | Appointments, Check-ins, Queue management, Wait times. |
| **Audit & Security Dashboard**| IT Support, Super Admin | Access logs, Security anomalies, User activity, System uptime. |

---

## 5. Prioritization

1. **Tier 1 (Immediate)**: Executive/Admin Dashboard (High visibility, high impact).
2. **Tier 2 (Operational)**: Clinical Ops and Patient Flow (Core business value).
3. **Tier 3 (Specialized)**: Pharmacy, Lab, and Billing (Module-specific efficiency).
4. **Tier 4 (Governance)**: Audit & Security (Compliance and stability).

---

## 6. Explicit Non-Goals

- **No PHI in summaries**: Dashboards will use counts and trends. PHI is only visible upon drill-down to a specific patient record.
- **No Production Claims**: This documentation is for planning in a `STAGING-ONLY` environment.
- **No Compliance Certification**: This is a design document, not a certification audit.
- **No Deployment Work**: This phase is strictly for requirements mapping.
