-- Add performance indexes for audit log queries
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_event_key_idx" ON "audit_logs"("event_key");
CREATE INDEX IF NOT EXISTS "audit_logs_record_type_record_id_idx" ON "audit_logs"("record_type", "record_id");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
