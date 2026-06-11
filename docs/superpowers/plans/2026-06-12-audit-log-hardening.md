# HMS Audit-Log Hardening — Implementation Plan

> **For agentic workers:** Use subagent-driven-development to implement task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the current audit-log system into a hospital-grade audit architecture covering financial integrity, compliance, user-scoped self-history, branch-scoped operations, global governance, tamper detection, and retention management.

**Architecture:** Backend schema + event taxonomy hardening first, then new API endpoints, then frontend pages. All new features reuse the existing `AuditLog` model and `AuditService.log()` — no new audit store. Financial audit events are logged inline in `BillingService` where transactions already happen. New frontend pages use existing `compliance.service.ts` hooks pattern.

**Tech Stack:** NestJS + Prisma (PostgreSQL) backend, React + TypeScript + React Query frontend.

---

## 1. Executive Summary

The HMS already has a production-grade audit foundation: hash-chain integrity, HMAC signatures, PostgreSQL immutability triggers, forensic context capture, and 140+ audit log write calls across 35 services. However, the system has significant hardening gaps:

- **No event taxonomy** — event keys are free-form strings with no registry
- **No financial audit depth** — only 7 billing events, no print/receipt/reprint/OR/gateway tracking
- **No user-scoped audit** — "My Audit Log" does not exist
- **No branch-scoped audit page** — only a mock legacy page
- **Inconsistent frontend** — 5 pages real, 3 hybrid, 5 mock
- **Single coarse permission** — `audit.view` for everything, no fine-grained roles
- **HMAC signature never verified** — written to DB but never checked by `verifyChain`
- **Missing indexes** — `createdAt`, `eventKey`, `recordType` unindexed

This plan covers 15 hardening areas across 5 phases, ordered by dependency: schema/foundation first, then backend API extensions, then financial audit, then frontend pages, then operational hardening.

---

## 2. Current-State Findings

### Already Present (Strong Foundation)

| Asset | Location | Status |
|-------|----------|--------|
| `AuditLog` model (18 fields, hash-chain, HMAC, forensic context) | `schema.prisma:841-866` | ✅ Production |
| PostgreSQL immutability trigger (UPDATE/DELETE blocked) | `migrations/20260517100000` | ✅ Production |
| `AuditService.log()` with transaction support | `audit.service.ts:92-160` | ✅ Production |
| `AuditService.findAll()` with role-based filtering | `audit.service.ts:203-284` | ✅ Production |
| `AuditService.verifyChain()` replay detection | `audit.service.ts:162-201` | ✅ Production |
| Forensic context middleware (`AsyncLocalStorage`) | `audit-context.middleware.ts` | ✅ Production |
| `GET /api/v1/audit/events` with pagination | `audit.controller.ts` | ✅ Production |
| `GET /api/v1/audit/events/:id` with role-based sanitization | `audit.controller.ts` | ✅ Production |
| `GET /api/v1/audit/verify` chain verification | `audit.controller.ts` | ✅ Production |
| 140+ audit log calls across 35 services | 35 service files | ✅ Production |
| 7 payment audit events (PAYMENT_POSTED, REFUND_REQUESTED, VOID_REQUESTED, VOID_APPLIED, REFUND_APPLIED, SESSION_OPENED, SESSION_CLOSED) | `billing.service.ts` | ✅ Production |
| 6 patient-portal export events (LAB_RESULT_PDF_EXPORTED, INVOICE_PDF_EXPORTED, etc.) | `patient-portal.service.ts` | ✅ Production |
| 3 backend e2e audit chain tests | `test/audit-*.e2e-spec.ts` | ✅ Production |
| `audit.view` permission in DB seed | `seed.ts` | ✅ Production |
| Real frontend pages: AuditReviewPage, PHIAccessMonitorPage, ExportLogsPage, AccessReviewsPage | `portals/compliance/` | ✅ Real API |

### Partially Implemented

| Asset | Issue | Status |
|-------|-------|--------|
| ComplianceDashboard | Real audit events + real access review, but charts/insights are mock | ⚠️ Hybrid |
| RetentionManagementPage | Real retention stats, but policy jobs are mock | ⚠️ Hybrid |
| ActivityAuditContextPage | Real table, but KPI cards are mock | ⚠️ Hybrid |

### Missing / Mock-Only

| Asset | Location | Status |
|-------|----------|--------|
| Event key registry / enum | Nowhere | ❌ Missing |
| HMAC signature verification | `verifyChain()` never checks `signature` | ❌ Missing |
| `createdAt` index on `audit_logs` | Missing | ❌ Missing |
| `eventKey` + `recordType` indexes | Missing | ❌ Missing |
| `AuditQueryDto` validation (class-validator) | Plain TS interface | ❌ Missing |
| "My Audit Log" (user-scoped self-history) page | Nowhere | ❌ Missing |
| Branch-scoped audit page (real API) | `AuditLogViewer.tsx` is mock | ❌ Mock |
| Super Admin global audit log page (real API) | `AuditLogsPage.tsx` is mock | ❌ Mock |
| Audit Event Detail page (rich) | Nowhere | ❌ Missing |
| Payment/Receipt Audit Timeline | Nowhere | ❌ Missing |
| Entity Audit Timeline component | Nowhere | ❌ Missing |
| Print/RePrint audit events | Nowhere | ❌ Missing |
| Refund/Void approval audit depth | Basic events exist but no approval-flow audit | ❌ Missing |
| QR Ph / gateway confirmation audit | Nowhere | ❌ Missing |
| Fine-grained audit permissions | Only `audit.view` | ❌ Missing |
| `audit.self`, `audit.branch`, `audit.global` permissions | Nowhere | ❌ Missing |
| `compliance.*` frontend permission constants | Nowhere | ❌ Missing |
| Audit retention / archival strategy | `DataRetentionService` exists, no retention policy for audit_logs | ❌ Missing |
| Audit-failure alerting | Nowhere | ❌ Missing |
| Audit tamper/corruption review dashboard | `AuditChainReviewPage` is mock | ❌ Mock |
| BreachAlertsPage (real) | 3 mock incidents | ❌ Mock |
| ComplianceReportsPage (real) | setTimeout mock | ❌ Mock |

---

## 3. Existing Audit Foundation Already Present

Refer to Section 2 "Already Present" table. The full inventory is documented in the backend inspection report (`AuditLog` model at `schema.prisma:841`, `AuditService` at `audit.service.ts`, controller at `audit.controller.ts`, 35 service files at `src/**/*.service.ts`).

Key architectural patterns to preserve:
- `AuditService.log(data, tx, branchId, context)` — the single write path
- Forensic context from `AsyncLocalStorage` — no changes needed
- Transaction-aware logging — audit is always inside the domain transaction
- Role-based `oldValues`/`newValues` stripping for non-SuperAdmin

---

## 4. Gaps / Missing Hardening Areas

Refer to Section 2 "Missing / Mock-Only" table. The 22 identified gaps are addressed in the phased plan below.

---

## 5. Proposed Target Architecture

```
┌──────────────────────────────────────────────┐
│                  AUDIT LAYER                   │
├──────────────────────────────────────────────┤
│  AuditLog (hash-chain, HMAC, immutable)       │
│  - tenant, branch, user, forensic context     │
│  - eventKey (from registry enum)              │
│  - recordType, recordId (polymorphic)         │
│  - oldValues, newValues (JSON snapshot)       │
│  - hash, previousHash, signature              │
├──────────────────────────────────────────────┤
│  AuditService                                 │
│  - log() - single write path (unchanged)      │
│  - findAll() - paginated + filtered + scoped   │
│  - findOne() - single + sanitized             │
│  - verifyChain() - hash replay + HMAC verify   │
│  - verifySignature() - NEW: HMAC check        │
│  - findMyEvents() - NEW: user-scoped          │
│  - findEntityTimeline() - NEW: by recordRef   │
│  - exportEvents() - NEW: CSV/JSON export      │
├──────────────────────────────────────────────┤
│  AuditController (NEW endpoints)              │
│  GET  /api/v1/audit/events/self               │
│  GET  /api/v1/audit/events/entity/:type/:id   │
│  GET  /api/v1/audit/events/:id                │
│  GET  /api/v1/audit/verify                    │
│  POST /api/v1/audit/verify/signatures         │
│  GET  /api/v1/audit/export                    │
├──────────────────────────────────────────────┤
│  FRONTEND PAGES (unified UX)                  │
│  My Audit Log        /audit/self              │
│  Branch Audit Log    /audit-logs              │
│  Global Audit Log    /admin/audit-logs        │
│  Audit Event Detail  /audit/events/:id        │
│  Entity Audit        /audit/entity/:type/:id  │
│  Payment Timeline    /billing/audit/:paymentId│
│  Chain Verify        /compliance/audit-chain  │
│  Retention           /compliance/retention    │
│  Breach Incidents    /compliance/breach-alerts│
│  Compliance Reports  /compliance/reports      │
├──────────────────────────────────────────────┤
│  PERMISSIONS                                  │
│  audit.view       → base access               │
│  audit.self       → My Audit Log              │
│  audit.branch     → Branch Audit Log          │
│  audit.global     → Global Audit Log          │
│  audit.export     → CSV/JSON export           │
│  audit.admin      → manage retention/verify   │
└──────────────────────────────────────────────┘
```

---

## 6. Backend Schema & API Plan

### 6.1 Schema Changes (`schema.prisma`)

**Field:**

Add indexes to the existing `AuditLog` model:

```prisma
// Add after existing @@index declarations (lines 866+)
@@index([createdAt])
@@index([eventKey])
@@index([recordType, recordId])
@@index([userId, createdAt])
```

No new fields on `AuditLog` — the existing model is sufficient with 18 columns.

### 6.2 New Audit Service Methods

Add to `audit.service.ts`:

| Method | Signature | Purpose |
|--------|-----------|---------|
| `findMyEvents()` | `(tenantId, userId, query) => paginated` | User-scoped self-history, no `userId` param override allowed |
| `findEntityTimeline()` | `(tenantId, branchId, userRoles, recordType, recordId, query) => paginated` | Entity-scoped timeline |
| `verifySignature(entry)` | `(AuditLog) => boolean` | Verifies HMAC-SHA256 signature independently |
| `verifyChainWithSignatures()` | `(tenantId) => { isValid, signatureErrors, ... }` | Enhanced verify that checks both hash chain + HMAC signatures |
| `exportEvents()` | `(tenantId, branchId, userRoles, query, format) => CSV/JSON stream` | Data export with role-based field stripping |

### 6.3 New Audit Controller Endpoints

Add to `audit.controller.ts`:

| HTTP Method | Route | Permission | Purpose |
|-------------|-------|-----------|---------|
| `GET` | `/api/v1/audit/events/self` | `audit.view` + `audit.self` | My Audit Log |
| `GET` | `/api/v1/audit/events/entity/:recordType/:recordId` | `audit.view` | Entity timeline |
| `POST` | `/api/v1/audit/verify/signatures` | `audit.view` + role check | Full chain + HMAC verify |
| `GET` | `/api/v1/audit/export` | `audit.view` + `audit.export` | CSV/JSON export |

### 6.4 DTO Validation

Create `audit/dto/` directory with class-validator DTOs:

- `audit-query.dto.ts` — replaces inline `AuditQueryDto` interface, adds `@IsOptional()`, `@IsUUID()`, `@IsDateString()`, `@Min(1)`, `@Max(100)` validation
- `audit-export.dto.ts` — format (`csv` | `json`), date range, optional filters

### 6.5 `findAll()` Enhancement

Current `findAll()` (lines 203-284) already has role-based filtering. Add:
- `findAll` param: `recordType` + `recordId` — already supported (lines 236-237)
- `findAll` param: `userId` — already supported (line 235)

---

## 7. Event Taxonomy Plan

### 7.1 Event Key Registry

Create `src/audit/audit-event-keys.ts`:

```typescript
export const AUDIT_EVENT_KEYS = {
  // ── Admin & User Management ──
  ADMIN_USER_CREATED: 'ADMIN_USER_CREATED',
  ROLE_CREATED: 'ROLE_CREATED',
  PRIVILEGED_ROLE_CHANGE_GRANTED: 'PRIVILEGED_ROLE_CHANGE_GRANTED',
  PRIVILEGED_ROLE_CHANGE_REVOKED: 'PRIVILEGED_ROLE_CHANGE_REVOKED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_REACTIVATED: 'USER_REACTIVATED',  // NEW
  LOGIN_LOCKOUT: 'LOGIN_LOCKOUT',
  MFA_RECOVERY_CODE_REGENERATED: 'MFA_RECOVERY_CODE_REGENERATED',
  MFA_DISABLED: 'MFA_DISABLED',

  // ── Clinical & Patient ──
  VITALS_SAVED: 'VITALS_SAVED',
  TRIAGE_SAVED: 'TRIAGE_SAVED',
  SOAP_CREATED: 'SOAP_CREATED',
  SOAP_SIGNED: 'SOAP_SIGNED',
  CLINICAL_ORDER_CREATED: 'CLINICAL_ORDER_CREATED',
  CLINICAL_ORDER_CANCELLED: 'CLINICAL_ORDER_CANCELLED',
  LAB_ORDER_RECEIVED: 'LAB_ORDER_RECEIVED',
  LAB_RESULT_SAVED: 'LAB_RESULT_SAVED',
  LAB_RESULT_VALIDATED: 'LAB_RESULT_VALIDATED',
  LAB_RESULT_RELEASED: 'LAB_RESULT_RELEASED',
  CLINICAL_NOTE_CREATED: 'CLINICAL_NOTE_CREATED',
  CLINICAL_DIAGNOSIS_ADDED: 'CLINICAL_DIAGNOSIS_ADDED',
  PATIENT_MERGE_REQUESTED: 'PATIENT_MERGE_REQUESTED',
  PATIENT_MERGE_EXECUTED: 'PATIENT_MERGE_EXECUTED',
  PATIENT_CREATED: 'PATIENT_CREATED',
  PATIENT_UPDATED: 'PATIENT_UPDATED',

  // ── Pharmacy ──
  PRESCRIPTION_CREATED: 'PRESCRIPTION_CREATED',
  MEDICATION_DISPENSED: 'MEDICATION_DISPENSED',
  STOCK_ADJUSTED: 'STOCK_ADJUSTED',

  // ── Billing & Payments ──
  PAYMENT_POSTED: 'PAYMENT_POSTED',
  REFUND_REQUESTED: 'REFUND_REQUESTED',
  REFUND_APPLIED: 'REFUND_APPLIED',
  REFUND_REJECTED: 'REFUND_REJECTED',           // NEW
  PAYMENT_VOID_REQUESTED: 'PAYMENT_VOID_REQUESTED',
  PAYMENT_VOID_APPLIED: 'PAYMENT_VOID_APPLIED',
  PAYMENT_VOID_REJECTED: 'PAYMENT_VOID_REJECTED',  // NEW
  SESSION_OPENED: 'SESSION_OPENED',
  SESSION_CLOSED: 'SESSION_CLOSED',
  RECEIPT_PRINTED: 'RECEIPT_PRINTED',           // NEW
  RECEIPT_REPRINTED: 'RECEIPT_REPRINTED',        // NEW
  RECEIPT_EXPORTED: 'RECEIPT_EXPORTED',          // NEW
  PAYMENT_GATEWAY_CONFIRMED: 'PAYMENT_GATEWAY_CONFIRMED', // NEW
  RECONCILIATION_PERFORMED: 'RECONCILIATION_PERFORMED',   // NEW

  // ── Invoices ──
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_PDF_EXPORTED: 'INVOICE_PDF_EXPORTED',
  INVOICE_CANCELLED: 'INVOICE_CANCELLED',

  // ── Catalog ──
  CATALOG_CATEGORY_CREATED: 'CATALOG_CATEGORY_CREATED',
  CATALOG_ITEM_CREATED: 'CATALOG_ITEM_CREATED',
  SERVICE_PRICE_UPDATED: 'SERVICE_PRICE_UPDATED',

  // ── Access & Security ──
  SENSITIVE_ACCESS_GRANTED: 'SENSITIVE_ACCESS_GRANTED',       // NEW
  SENSITIVE_ACCESS_BLOCKED: 'SENSITIVE_ACCESS_BLOCKED',       // NEW
  READ_ACCESS_AUDITED: 'READ_ACCESS_AUDITED',                // NEW
  BREAK_GLASS_ACTIVATED: 'BREAK_GLASS_ACTIVATED',            // NEW
  BREAK_GLASS_JUSTIFIED: 'BREAK_GLASS_JUSTIFIED',             // NEW
  SECURITY_BREACH_DETECTED: 'SECURITY_BREACH_DETECTED',

  // ── Export / Download ──
  FILE_DOWNLOADED: 'FILE_DOWNLOADED',
  LAB_RESULT_PDF_EXPORTED: 'LAB_RESULT_PDF_EXPORTED',
  REPORT_EXPORTED: 'REPORT_EXPORTED',
  AUDIT_LOG_EXPORTED: 'AUDIT_LOG_EXPORTED',                   // NEW

  // ── Retention / Archival ──
  AUDIT_LOG_RETENTION_ENFORCED: 'AUDIT_LOG_RETENTION_ENFORCED', // NEW
  AUDIT_LOG_ARCHIVED: 'AUDIT_LOG_ARCHIVED',                    // NEW

  // ── Chain / Integrity ──
  CHAIN_VERIFICATION_RUN: 'CHAIN_VERIFICATION_RUN',           // NEW
  CHAIN_CORRUPTION_DETECTED: 'CHAIN_CORRUPTION_DETECTED',     // NEW
} as const;

export type AuditEventKey = typeof AUDIT_EVENT_KEYS[keyof typeof AUDIT_EVENT_KEYS];
```

### 7.2 Failure Policy

| Category | Fail Closed? | Rationale |
|----------|-------------|-----------|
| Payments (POSTED, VOID, REFUND) | **YES** | Financial integrity — audit failure must block the transaction |
| Session open/close | **YES** | Cashier session integrity |
| Break-glass, sensitive access | **YES** | Compliance requirement — must be recorded or access denied |
| Chain verification events | **YES** | Meta-audit must never be silent |
| Clinical mutations (vitals, SOAP, orders, lab) | **YES** | Medical record integrity |
| Export/download events | **NO** (fail open + alert) | Audit logging must not block patient access to their own data |
| Read-access events | **NO** (fail open + alert) | Cannot block clinical workflows for audit |
| Retention/archival operations | **NO** (fail open + alert) | Non-critical operational task |
| Print/reprint events | **NO** (fail open + alert) | Printing must not be blocked by audit failure |

Implementation: Audit failures in the `BillingService` are already inside transactions. The caller must catch audit errors and decide whether to rollback or continue. For fail-open cases, log a warning and continue. For fail-closed cases, the transaction rolls back naturally because the audit call is inside the tx callback.

---

## 8. Payment / Receipt Audit Plan

### 8.1 New Financial Audit Events

Add these `eventKey` values to `BillingService`:

| Event | Where to log | What data (newValues) |
|-------|-------------|----------------------|
| `RECEIPT_PRINTED` | After receipt print function in billing service | `{ receiptNumber, paymentId, invoiceId, printCount, printedBy }` |
| `RECEIPT_REPRINTED` | After reprint action (same as print but different key) | `{ receiptNumber, paymentId, invoiceId, reprintCount, reason, printedBy }` |
| `RECEIPT_EXPORTED` | After PDF/email receipt export | `{ receiptNumber, paymentId, format, exportedBy }` |
| `PAYMENT_GATEWAY_CONFIRMED` | After QR Ph / gateway callback | `{ paymentId, gatewayRef, amount, gatewayResponseStatus }` |
| `RECONCILIATION_PERFORMED` | After daily reconciliation run | `{ sessionId, matched, unmatched, discrepancyAmount }` |
| `REFUND_REJECTED` | When approval is rejected | `{ reversalId, approvalRequestId, reason, rejectedBy }` |
| `PAYMENT_VOID_REJECTED` | When approval is rejected | `{ reversalId, approvalRequestId, reason, rejectedBy }` |

### 8.2 Record Type Conventions

| Entity | `recordType` value |
|--------|-------------------|
| Payment | `Payment` |
| Invoice | `Invoice` |
| PaymentReversal | `PaymentReversal` |
| CashierSession | `CashierSession` |
| Receipt (print) | `Receipt` |
| Gateway confirmation | `PaymentGateway` |

### 8.3 Reference Fields

Each financial audit event should include in `newValues`:
- `invoiceId` — UUID of the invoice
- `invoiceNumber` — human-readable invoice number
- `receiptNumber` — human-readable receipt number (where applicable)
- `amount` — decimal amount as string (to avoid JSON serialization loss)
- `paymentMethod` — for payment events
- `gatewayRef` — for gateway confirmations

### 8.4 Print/RePrint State Tracking

To enable reprint detection, add a `printCount` counter to the `Payment` model or track in Redis/DB. Recommended approach: store `printCount` directly on the `Payment` model, or add a separate `ReceiptPrint` model. For MVP, track via audit events only (no new model) — the audit trail itself serves as the print log.

### 8.5 Audit Trail for Refund/Void Approval Flow

The existing approval flow already generates audit events at each transition. The gap is REJECTED states. Add:
- `REFUND_REJECTED` in `approvals.service.ts` when refund approval is rejected
- `PAYMENT_VOID_REJECTED` in `approvals.service.ts` when void approval is rejected

---

## 9. Frontend UX / Page Plan

### 9.1 Page Inventory & Classification

| Page | Route | Status | Phase |
|------|-------|--------|-------|
| My Audit Log | `/audit/self` | ❌ New | Phase 3 |
| Branch Audit Log | `/audit-logs` (existing) | ❌ Rebuild from mock | Phase 3 |
| Global Audit Log | `/admin/audit-logs` (existing) | ❌ Rebuild from mock | Phase 3 |
| Audit Event Detail | `/audit/events/:id` | ❌ New | Phase 4 |
| Entity Audit Timeline | `/audit/entity/:type/:id` | ❌ New | Phase 4 |
| Payment/Receipt Audit | `/billing/audit/payment/:id` | ❌ New | Phase 4 |
| Chain Verification | `/compliance/audit-chain` | ❌ Rewrite from mock | Phase 5 |
| Audit Retention | `/compliance/retention` | ⚠️ Harden hybrid | Phase 5 |
| Breach Incidents | `/compliance/breach-alerts` | ❌ Rewrite from mock | Phase 5 |
| Compliance Reports | `/compliance/reports` | ❌ Rewrite from mock | Phase 5 |

### 9.2 My Audit Log Page

**Route:** `/audit/self`
**Permission:** `audit.view` + `audit.self`
**Data source:** `GET /api/v1/audit/events/self` (auto-scoped to current user)

**Table columns:**

| Column | Description | Always shown |
|--------|-------------|-------------|
| Timestamp | `createdAt` formatted | Yes |
| Event | `eventKey` human-readable label | Yes |
| Category | Derived from event key prefix | Yes |
| Record | `recordType` + `recordId` (linked) | Yes |
| Branch | `branchId` → branch name | Yes |
| IP Address | `ipAddress` | Yes |
| Details link | → `/audit/events/:id` | Yes |

**Filters:**
- Date range (with presets: Today, Last 7 days, Last 30 days, This month, Custom)
- Event category (derived from event key prefix)
- Branch filter
- Free-text search on `recordType`, `recordId`
- Page size: 20/50/100

**UX:** Table view with row expansion showing event detail. No `oldValues`/`newValues` (user cannot see payload).

### 9.3 Branch Audit Log Page

**Route:** `/audit-logs` (replace existing mock `features/admin/AuditLogViewer.tsx`)
**Permission:** `audit.view` + `audit.branch`
**Data source:** `GET /api/v1/audit/events?branchId=<currentBranch>`

**Table columns:**

| Column | Description |
|--------|-------------|
| Timestamp | `createdAt` formatted |
| Actor | User name (from `userId` resolved via API or join) |
| Event | `eventKey` human-readable |
| Record Type | `recordType` |
| Record ID | `recordId` (truncated UUID with full copy) |
| IP Address | `ipAddress` |
| Role | `activeRole` |
| Details | Link to `/audit/events/:id` |

**Filters:** Same as My Audit Log + actor/user filter.

### 9.4 Global Audit Log Page (Super Admin)

**Route:** `/admin/audit-logs` (replace mock `portals/admin/AuditLogsPage.tsx`)
**Permission:** `audit.view` + `audit.global`
**Data source:** `GET /api/v1/audit/events` (no branch scope — Super Admin sees all)

**Table columns:** Same as Branch Audit Log + `oldValues`/`newValues` toggle (shown only to Super Admin).

**Extra features:**
- Export button → `GET /api/v1/audit/export` (CSV/JSON)
- Chain hash display column
- Event payload diff viewer (old vs new values)

### 9.5 Audit Event Detail Page

**Route:** `/audit/events/:id`
**Permission:** `audit.view`
**Data source:** `GET /api/v1/audit/events/:id`

**Sections:**
- Header: Event key, timestamp, status badge
- Actor: Name, role, IP, user agent, session ID
- Record: Type, ID, link to entity page
- Payload diff: Side-by-side oldValues vs newValues JSON (Super Admin only)
- Chain info: Hash, previous hash, signature (with HMAC verify button)
- Cross-links: "View entity timeline" → `/audit/entity/:type/:id`

### 9.6 Entity Audit Timeline Page

**Route:** `/audit/entity/:recordType/:recordId`
**Permission:** `audit.view`
**Data source:** `GET /api/v1/audit/events/entity/:recordType/:recordId`

Displays all audit events for a specific entity (patient, payment, invoice, order, etc.) as a chronological timeline. Each event shows: timestamp, actor, action, old/new values.

### 9.7 Payment/Receipt Audit Timeline

**Route:** Embedded in billing pages (e.g., as a tab in Payment Detail or Invoice Detail) — OR standalone at `/billing/audit/payment/:paymentId`
**Data source:** `GET /api/v1/audit/events/entity/Payment/:paymentId`

Shows the full lifecycle of a payment: creation → print → reprint → void/refund → gateway confirmation → export.

### 9.8 Unified Audit Event Table Component

Create reusable `AuditEventTable.tsx` at `hms-frontend/src/features/audit/components/`:

**Props:**
```typescript
interface AuditEventTableProps {
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  showActor?: boolean;       // Branch/Global views show actor
  showValues?: boolean;      // Super Admin only
  showChainInfo?: boolean;   // Super Admin/Compliance
  showExport?: boolean;      // With audit.export permission
  onExport?: (format: 'csv' | 'json') => void;
  filters?: FilterConfig[];  // Dynamic filter configuration
  onRowClick?: (event: AuditEvent) => void;
}
```

### 9.9 Filter Presets

| Preset | Range |
|--------|-------|
| Today | `startDate = now()` at 00:00 |
| Last 7 days | `startDate = now() - 7d` |
| Last 30 days | `startDate = now() - 30d` |
| This month | `startDate = first of month` |
| Custom | Allow date picker |
| All time | No date filter |

### 9.10 Frontend Hooks & Service

**New service methods** in `compliance.service.ts`:
```typescript
getMyAuditEvents(params): Promise<PaginatedAuditEvents>
getEntityAuditEvents(recordType, recordId, params): Promise<PaginatedAuditEvents>
exportAuditEvents(params, format): Promise<Blob>
verifyChainSignatures(): Promise<ChainVerificationResult>
```

**New hook** in `hooks/use-compliance.ts`:
```typescript
useMyAuditEvents(params)          // Calls getMyAuditEvents
useEntityAuditTimeline(type, id)  // Calls getEntityAuditEvents
useChainVerification()            // Calls verifyChain
useAuditExport(params, format)    // Calls exportAuditEvents
```

---

## 10. Permissions / Visibility Plan

### 10.1 New Permission Strings

Add to Prisma seed (`seed.ts`) and frontend `permissions.ts`:

| Permission | Scope | Risk | Who gets it (DB seed) |
|-----------|-------|------|----------------------|
| `audit.view` | Existing | HIGH | Super Admin, Branch Admin, Compliance Officer, IT Support |
| `audit.self` | NEW | LOW | All authenticated users |
| `audit.branch` | NEW | HIGH | Branch Admin |
| `audit.global` | NEW | HIGH | Super Admin only |
| `audit.export` | NEW | HIGH | Super Admin, Compliance Officer |
| `audit.admin` | NEW | HIGH | Super Admin only |

### 10.2 Visibility Rules

| View | Permission | Can see oldValues/newValues? | Scope |
|------|-----------|------------------------------|-------|
| My Audit Log | `audit.view` + `audit.self` | No | Own events only, forced `userId` filter |
| Branch Audit Log | `audit.view` + `audit.branch` | No | All events in branch |
| Global Audit Log | `audit.view` + `audit.global` | Yes (Super Admin only) | All events in tenant |
| Event Detail | `audit.view` | Yes (Super Admin only) | Tenant-scoped |
| Entity Timeline | `audit.view` | Yes (Super Admin only) | Entity-scoped |
| Export | `audit.view` + `audit.export` | Stripped for non-SA | Per scope |
| Chain Verify | `audit.view` | N/A | Tenant-scoped |

### 10.3 Tenant & Branch Isolation

Already enforced by `AuditService.findAll()` (lines 220-230):
- Non-SuperAdmin: only events matching their `branchId` (or `branchId = null`)
- Super Admin: all branches in tenant
- All: `tenantId` is always enforced

No changes needed to the core isolation logic. New endpoints (`findMyEvents`, `findEntityTimeline`) must replicate the same pattern.

### 10.4 Frontend Route Guard Updates

Add to `portalRoutes.ts`:

```typescript
{ path: 'audit/self', requiredPermission: PERMISSIONS.AUDIT_VIEW, ... }, // plus audit.self check at component level
{ path: 'audit/events/:id', requiredPermission: PERMISSIONS.AUDIT_VIEW, zone: 'staff' },
{ path: 'audit/entity/:recordType/:recordId', requiredPermission: PERMISSIONS.AUDIT_VIEW, zone: 'staff' },
```

Update existing:
- `/audit-logs` → add `audit.branch` requirement
- `/admin/audit-logs` → add `audit.global` requirement

### 10.5 Frontend Permission Constants

Add to `permissions.ts`:
```typescript
AUDIT_SELF: 'audit.self',
AUDIT_BRANCH: 'audit.branch',
AUDIT_GLOBAL: 'audit.global',
AUDIT_EXPORT: 'audit.export',
AUDIT_ADMIN: 'audit.admin',
```

Update `ROLE_DEFAULT_PERMISSIONS` to include these for relevant roles.

---

## 11. Retention / Integrity / Alerting Plan

### 11.1 Retention Classes

| Class | Duration | Event types | Action |
|-------|----------|-------------|--------|
| FINANCIAL | 10 years | PAYMENT_*, REFUND_*, VOID_*, RECEIPT_*, SESSION_*, INVOICE_* | Full retention |
| CLINICAL | 10 years (PHI) / 5 years (non-PHI) | VITALS_*, SOAP_*, LAB_*, TRIAGE_*, ORDER_*, PRESCRIPTION_*, DIAGNOSIS_* | Full retention |
| ADMINISTRATIVE | 3 years | ADMIN_*, ROLE_*, USER_*, CATALOG_*, MERGE_* | Archive after 3y |
| SECURITY | 5 years | BREAK_GLASS_*, SENSITIVE_*, SECURITY_*, LOGIN_*, MFA_* | Full retention |
| EXPORT | 1 year | EXPORTED, DOWNLOADED, REPORT_EXPORTED | Auto-purge after 1y |
| TRANSIENT | 90 days | READ_ACCESS_* | Auto-purge after 90d |

### 11.2 Archival Strategy

- **Cold storage:** Archived logs (past retention period for ADMINISTRATIVE class) moved to a separate `audit_logs_archive` table with same schema but no hash-chain requirement
- **Pruning:** TRANSIENT and EXPORT classes auto-deleted by a scheduled job (run via `DataRetentionService` or cron)
- **Verification before archive:** Run `verifyChain` on the portion to be archived, store the verification result alongside the archive
- **Backend endpoint:** `POST /api/v1/audit/retention/enforce` — already exists at `compliance.controller.ts:44-47`, calls `retentionService.enforceRetention()`. Update `DataRetentionService` to handle audit log retention rules.

### 11.3 Chain Verification & Alerting

- **Scheduled chain verification:** Daily job that calls `verifyChain()` for each tenant. If `isValid === false`, create an alert and log `CHAIN_CORRUPTION_DETECTED`.
- **Signature verification:** Same job should call the new `verifyChainWithSignatures()` to detect HMAC signature tampering.
- **Alerting channel:** Log to existing `NotificationService` and create an `Alert` record visible on the Compliance dashboard.
- **Tamper review UX:** Add a "Review Corruption" button on Chain Verification page that shows the corrupted log IDs, their adjacent entries, and allows marking as reviewed.

### 11.4 Alerting Rules

| Condition | Severity | Action |
|-----------|----------|--------|
| Chain corruption detected | CRITICAL | Notify Super Admin + Compliance Officer immediately |
| Audit service unavailable | CRITICAL | Fail-closed for financial/clinical events |
| Signature mismatch | HIGH | Notify Compliance Officer |
| Retention enforcement failure | LOW | Log and continue |

---

## 12. Phase-by-Phase Implementation Plan

### Phase 1: Schema & Foundation Hardening

**Estimated effort:** 3-4 tasks
**Dependencies:** None
**Risk:** Low — additive changes only

- [ ] Task 1.1: Add indexes to `AuditLog` model (`createdAt`, `eventKey`, `recordType+recordId`, `userId+createdAt`) — new Prisma migration
- [ ] Task 1.2: Create `audit-event-keys.ts` registry enum with all event keys — no runtime change, purely documentation/type safety
- [ ] Task 1.3: Create DTO directory with class-validator DTOs for `AuditQueryDto`, `AuditExportDto`
- [ ] Task 1.4: Update `AuditController` to use new validated DTOs

### Phase 2: Backend API Extensions

**Estimated effort:** 5-6 tasks
**Dependencies:** Phase 1
**Risk:** Low-Medium — new endpoints, existing patterns

- [ ] Task 2.1: Add `findMyEvents()` method to `AuditService` — wraps `findAll` with forced `userId` filter, no `oldValues`/`newValues`
- [ ] Task 2.2: Add `findEntityTimeline()` method to `AuditService` — wraps `findAll` with forced `recordType` + `recordId` filter
- [ ] Task 2.3: Add `verifySignature()` and `verifyChainWithSignatures()` methods — HMAC verification logic
- [ ] Task 2.4: Add `exportEvents()` method — streams filtered audit events as CSV or JSON
- [ ] Task 2.5: Add new controller endpoints (`/self`, `/entity/:type/:id`, `/verify/signatures`, `/export`)
- [ ] Task 2.6: Add `audit.self`, `audit.branch`, `audit.global`, `audit.export`, `audit.admin` permissions to DB seed + migration
- [ ] Task 2.7: Add backend e2e tests for all new endpoints (4 new test files)

### Phase 3: Payment / Receipt Audit Trail

**Estimated effort:** 4-5 tasks
**Dependencies:** Phase 1
**Risk:** Medium — modifies `BillingService` inside transaction logic

- [ ] Task 3.1: Add `RECEIPT_PRINTED`, `RECEIPT_REPRINTED` audit logging in billing service after receipt print/reprint
- [ ] Task 3.2: Add `RECEIPT_EXPORTED` audit logging in billing service after PDF/email export
- [ ] Task 3.3: Add `PAYMENT_GATEWAY_CONFIRMED` audit logging in payment gateway callback handler
- [ ] Task 3.4: Add `RECONCILIATION_PERFORMED` audit logging in reconciliation service
- [ ] Task 3.5: Add `REFUND_REJECTED`, `PAYMENT_VOID_REJECTED` audit logging in approvals service

### Phase 4: Frontend Audit Pages

**Estimated effort:** 8-10 tasks
**Dependencies:** Phase 2
**Risk:** Medium — multiple new pages, UX consistency

- [ ] Task 4.1: Create reusable `AuditEventTable` component at `features/audit/components/`
- [ ] Task 4.2: Add `getMyAuditEvents`, `getEntityAuditEvents`, `exportAuditEvents`, `verifyChainSignatures` to `compliance.service.ts`
- [ ] Task 4.3: Add `useMyAuditEvents`, `useEntityAuditTimeline`, `useChainVerification`, `useAuditExport` hooks
- [ ] Task 4.4: Build **My Audit Log** page at `/audit/self` — user-scoped self-history table
- [ ] Task 4.5: Rebuild **Branch Audit Log** page at `/audit-logs` — replace mock `AuditLogViewer.tsx` with real API
- [ ] Task 4.6: Rebuild **Global Audit Log** page at `/admin/audit-logs` — replace mock with real API, add Super Admin extras
- [ ] Task 4.7: Build **Audit Event Detail** page at `/audit/events/:id` — rich detail view with payload diff
- [ ] Task 4.8: Build **Entity Audit Timeline** page at `/audit/entity/:type/:id` — chronological event view
- [ ] Task 4.9: Build **Payment/Receipt Audit Timeline** embedded in billing payment detail
- [ ] Task 4.10: Update `portalRoutes.ts` with new route guard entries
- [ ] Task 4.11: Update `roleNavigation.ts` with new sidebar entries (My Audit Log under user menu, Entity Timeline accessible from relevant pages)
- [ ] Task 4.12: Add frontend tests for all new pages (minimum 2 per page)

### Phase 5: Operational Hardening

**Estimated effort:** 5-6 tasks
**Dependencies:** Phase 2, Phase 4
**Risk:** Low-Medium — primarily new components

- [ ] Task 5.1: Rewrite **Audit Chain Verification** page (`/compliance/audit-chain`) — real API, signature verification toggle
- [ ] Task 5.2: Add **Tamper Review** sub-page — shows corrupted log IDs, adjacent entries, review workflow
- [ ] Task 5.3: Hard-wire **Breach Incidents** page (`/compliance/breach-alerts`) — connect to real `GET /compliance/hipaa/breach-report/:incidentId`
- [ ] Task 5.4: Hard-wire **Compliance Reports** page (`/compliance/reports`) — connect to real report generation
- [ ] Task 5.5: Update `DataRetentionService` to handle audit log retention policies (archive/prune by retention class)
- [ ] Task 5.6: Add scheduled chain verification job + alerting integration

---

## 13. Dependencies and Risks

### Dependencies

| Task | Depends On | Risk if delayed |
|------|-----------|----------------|
| Phase 2 (API extensions) | Phase 1 (indexes, DTOs) | Cannot build frontend pages |
| Phase 3 (financial audit) | Phase 1 (event keys) | Low — can proceed with existing event key pattern |
| Phase 4 (frontend pages) | Phase 2 (new API endpoints) | Pages work only with real API |
| Phase 5 (operational) | Phase 2 + Phase 4 | Chain verification page works with existing API |

### Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| `BillingService` transaction complexity for print/reprint audit | Medium | Medium | Keep new audit calls outside the payment transaction (fail-open); use separate non-transactional call |
| Permission migration may affect existing role bindings | Low | High | Add new permissions as additive only; existing `audit.view` still grants all current access |
| Frontend mock pages have no tests; rewrites may break nav | Medium | Medium | Preserve route paths; existing nav entries stay valid |
| Chain verification over large tenants may time out | Medium | High | Keep 10k safety cap; add batched verification as optional enhancement |
| HMAC key rotation (JWT_SECRET) invalidates existing signatures | Low | Medium | Use a dedicated `AUDIT_SIGNING_KEY` env var separate from JWT_SECRET |

---

## 14. Final Readiness Verdict

**The HMS audit-log system is roughly 60% hardened. The foundation is solid (hash-chain, immutability trigger, forensic context, role-based filtering, 140+ calls) but notable gaps remain:**

- **Financial audit is the most urgent gap.** Payments, receipts, prints, reprints, and gateway confirmations need audit coverage. This is a financial integrity requirement.
- **User-scoped and branch-scoped self-service audit pages are the second priority.** These are expected in any hospital-grade system.
- **Permissions need moderate expansion.** A single `audit.view` permission is insufficient for role-based audit visibility.
- **Frontend consistency needs significant work.** 5 of 13 audit/compliance pages are mock-only; 3 are hybrid.
- **Operational hardening (retention, alerting, tamper review) is lower priority but important for compliance audit readiness.**

**Plan is implementable as described.** Each phase produces independently verifiable and deployable increments. No phase requires a full-system rewrite. The total implementation effort is estimated at 25-30 tasks across 5 phases.
