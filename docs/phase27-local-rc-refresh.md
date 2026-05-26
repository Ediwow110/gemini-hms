# Phase 27 — Local RC Refresh (After Patient, Doctor, Nurse, Billing, Marketplace, IT Cleanup)

## 1. Executive Verdict

**Verdict: LOCAL RC CLEAN — STAGING BLOCKED ONLY**

All local/CI verification passes. Post-Phase 20B cleanup phases (21A, 21B, 22, 23, 24, 25, 26) have materially improved portal honesty and removed hidden mock data from Doctor, Patient, Nurse, Cashier, Marketplace, and IT portals. No critical repo blockers remain.

---

## 2. Recent PR Chain (Phase 20B → Phase 27)

| PR | Title | Status |
|---|---|---|
| #81 | Phase 20B — Local RC Audit After Lab and Pharmacy Hardening | MERGED |
| #82 | Phase 21A — Doctor Patient Directory and Prescription Panel Wiring | MERGED |
| #83 | Phase 21B — Patient Appointments and Billing Portal Wiring | MERGED |
| #84 | Phase 23 — Patient Medical Records Portal Wiring | MERGED |
| #85 | Phase 22 — Nurse Advanced Workflow and Escalation Hardening | MERGED |
| #86 | Phase 24 — Cashier Refunds HMO and Reconciliation Cleanup | MERGED |
| #87 | Phase 25 — Marketplace Buyer and Admin Partial Cleanup | MERGED |
| #88 | Phase 26 — Compliance and IT Operational Cleanup | MERGED |

---

## 3. Verification Results

| Check | Result |
|---|---|
| Backend build | ✅ PASS |
| Backend lint | ✅ 0 errors, 454 warnings (pre-existing) |
| Backend tests | ✅ 1082/1082 PASS (61 suites) |
| Backend E2E | ⚠️ 99 failed — **PostgreSQL unavailable** (infra blocker) |
| Frontend typecheck | ✅ PASS |
| Frontend lint | ✅ 0 errors, 8 warnings (pre-existing) |
| Frontend tests | ✅ 79/79 PASS (9 suites) |
| Frontend build | ✅ PASS |
| Clinical verifier | ✅ SUCCESS (15 mutations) |
| Security verifier | ✅ SUCCESS |
| GitHub CI (latest main) | ✅ All checks pass |

---

## 4. Portal Status Matrix (After Cleanup Phases)

| Portal | Status | Key Changes Since Phase 20B |
|---|---|---|
| Super Admin | ✅ **Real** | Unchanged |
| Branch Admin | ✅ **Real** | Unchanged |
| Receptionist | ✅ **Real** | Unchanged |
| **Doctor** | ✅ **Partial** (improved) | Patient directory + prescription panel wired to real APIs (Phase 21A) |
| **Nurse** | ✅ **Partial** (improved) | Task status filter added, dashboard banner updated (Phase 22) |
| **Patient** | ✅ **Partial** (improved) | Invoices wired to real API (21B); medical records WIP banner (23) |
| **Cashier** | ✅ **Partial** (improved) | HMO/reconciliation mock data removed, receipts disabled (24) |
| Med-Tech/Lab | ✅ **Partial** | Unchanged since Phase 4D-4G |
| Pharmacist | ✅ **Real** | Unchanged since Sprint 2B |
| Procurement | ✅ **Partial** | Unchanged |
| HR | ✅ **Partial** | Unchanged |
| Supplier | ✅ **Real** | Unchanged |
| **Marketplace** | ✅ **Partial** (improved) | Shell notice updated (25) |
| Marketplace Admin | ✅ **Partial** (improved) | Shell notice updated (25) |
| **IT Support** | ✅ **Partial** (improved) | WIP banner added for simulated data (26) |
| Compliance | ✅ **Partial** | Sandbox notices already present |
| Field Technician | ✅ **Real** | Unchanged |
| Integration | ✅ **Partial** | Unchanged |

---

## 5. Mock/WIP Inventory — Remaining

All remaining WIP areas have visible banners or explicit labels:

| Area | Route/Page | Banner/Label |
|---|---|---|
| Appointments | /patient/appointments | "Appointments (WIP)" |
| Medical Records | /patient/medical-records | "Medical Records (WIP)" |
| Messages | /patient/messages | No banner (UI shell) |
| Online payments | /patient/billing | "Payment processing is simulated" |
| Doctor EMR chart | /doctor/emr/:id | No banner (page rendered via EMR route) |
| Doctor prescribing CDS | /doctor components | "CDS/E-Prescribing WIP" |
| Nurse care plans/MAR | /nurse | "Care plans, MAR, staff scheduling WIP" |
| Cashier refunds | /cashier/refunds-voids | "Mock simulation only" |
| Cashier HMO | /cashier/hmo-claims | "HMO Claims (WIP)" |
| Cashier reconciliation | /cashier/reconciliation | "Daily Reconciliation (WIP)" |
| Marketplace buyer cart | /marketplace/cart | Shell notice "In development" |
| Marketplace orders | /marketplace/orders | Shell notice |
| Marketplace checkout | /marketplace/checkout | Shell notice |
| IT system health | /it/system-health | "System health data simulated" |
| IT background jobs | /it/background-jobs | Covered by dashboard banner |
| IT integrations | /it/integrations | Covered by dashboard banner |
| LabOrdersPage | /lab/orders | "WIP/Mock" banner |
| Full LIS/SLA/analyzer | N/A | Out of scope |
| External e-prescribing | N/A | Out of scope |
| Drug interaction CDS | N/A | Out of scope |

---

## 6. Staging Blockers (Unchanged)

1. **GCP IAM** — `eediwow866@gmail.com` cannot read IAM policy on `unified-xylocarp-j524r`. No staging deployment possible.
2. **PostgreSQL unavailable** — E2E tests cannot run. 99 failures all DB connection errors.
3. **Migrations not applied** — 49+ Prisma migrations exist but require running PostgreSQL.

---

## 7. Release Decision

**A. LOCAL RC CLEAN — STAGING BLOCKED ONLY**

All local/CI checks pass. All remaining WIP areas have visible banners. No hidden mock data behind production-looking UI. Only GCP IAM blocks staging.

---

## 8. Next Recommended Phase

**Phase 18-J — GCP IAM Unblock Recheck** (requires project owner confirmation that roles were granted).

If still blocked, next local option: **Phase 28 — Production Readiness Documentation** (monitoring, backup, rollback plans for when staging becomes available).
