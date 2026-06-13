-- Add 13 hot-path composite indexes identified in optimization Phase 2
-- These indexes target the most frequent query patterns across hot tables.
-- All use IF NOT EXISTS for idempotent re-application.

-- Order: tenant/branch listing, patient order queries
CREATE INDEX IF NOT EXISTS "orders_tenant_id_branch_id_created_at_idx" ON "orders"("tenant_id", "branch_id", "created_at");
CREATE INDEX IF NOT EXISTS "orders_tenant_id_branch_id_patient_id_idx" ON "orders"("tenant_id", "branch_id", "patient_id");

-- Invoice: dashboard unpaid bills, listing sort order
CREATE INDEX IF NOT EXISTS "invoices_tenant_id_status_idx" ON "invoices"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "invoices_tenant_id_created_at_idx" ON "invoices"("tenant_id", "created_at");

-- Payment: session payment lookups, analytics date-range
CREATE INDEX IF NOT EXISTS "payments_tenant_id_cashier_session_id_status_idx" ON "payments"("tenant_id", "cashier_session_id", "status");
CREATE INDEX IF NOT EXISTS "payments_tenant_id_created_at_idx" ON "payments"("tenant_id", "created_at");

-- LabResult: status-based listing
CREATE INDEX IF NOT EXISTS "lab_results_tenant_id_status_archived_at_idx" ON "lab_results"("tenant_id", "status", "archived_at");

-- AuditLog: admin event filtering
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_id_event_key_created_at_idx" ON "audit_logs"("tenant_id", "event_key", "created_at");

-- QueueEntry: work queue + dashboard queries
CREATE INDEX IF NOT EXISTS "queue_entries_tenant_id_branch_id_status_created_at_idx" ON "queue_entries"("tenant_id", "branch_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "queue_entries_tenant_id_status_created_at_idx" ON "queue_entries"("tenant_id", "status", "created_at");

-- Notification: dispatcher polling, user-scoped polling
CREATE INDEX IF NOT EXISTS "notifications_tenant_id_status_idx" ON "notifications"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "notifications_user_id_status_idx" ON "notifications"("user_id", "status");

-- CashierSession: active session lookups
CREATE INDEX IF NOT EXISTS "cashier_sessions_tenant_id_user_id_branch_id_status_idx" ON "cashier_sessions"("tenant_id", "user_id", "branch_id", "status");
