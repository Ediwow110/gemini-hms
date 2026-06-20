-- Add composite indexes on (tenantId, archivedAt, createdAt) for efficient retention sweep queries
-- These support the DataRetentionService.enforceRetention and getRetentionStatus hot paths.

CREATE INDEX IF NOT EXISTS "patients_tenant_id_archived_at_created_at_idx" ON "patients" ("tenant_id", "archived_at", "created_at");
CREATE INDEX IF NOT EXISTS "encounters_tenant_id_archived_at_created_at_idx" ON "encounters" ("tenant_id", "archived_at", "created_at");
CREATE INDEX IF NOT EXISTS "lab_results_tenant_id_archived_at_created_at_idx" ON "lab_results" ("tenant_id", "archived_at", "created_at");
CREATE INDEX IF NOT EXISTS "invoices_tenant_id_archived_at_created_at_idx" ON "invoices" ("tenant_id", "archived_at", "created_at");
CREATE INDEX IF NOT EXISTS "payments_tenant_id_archived_at_created_at_idx" ON "payments" ("tenant_id", "archived_at", "created_at");
