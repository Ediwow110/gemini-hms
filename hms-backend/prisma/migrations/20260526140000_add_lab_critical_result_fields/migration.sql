-- Add critical result tracking fields to lab_results table
-- Phase 4E: Lab Critical Results Escalation Foundation

ALTER TABLE "lab_results"
  ADD COLUMN "is_critical" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "critical_status" VARCHAR(20) DEFAULT 'OPEN',
  ADD COLUMN "critical_acknowledged_at" TIMESTAMP(3),
  ADD COLUMN "critical_acknowledged_by_id" UUID,
  ADD COLUMN "critical_escalated_at" TIMESTAMP(3),
  ADD COLUMN "critical_escalated_by_id" UUID,
  ADD COLUMN "critical_escalation_notes" TEXT,
  ADD COLUMN "critical_resolved_at" TIMESTAMP(3),
  ADD COLUMN "critical_resolved_by_id" UUID,
  ADD COLUMN "critical_resolved_notes" TEXT;

-- Add index for critical result queries (tenant + status filtering)
CREATE INDEX IF NOT EXISTS "lab_results_critical_status_idx" ON "lab_results" ("tenant_id", "is_critical", "critical_status");
