-- Add composite index on tenantId + createdAt for efficient tenant-scoped queries
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_id_created_at_idx" ON "audit_logs" ("tenant_id", "created_at");
