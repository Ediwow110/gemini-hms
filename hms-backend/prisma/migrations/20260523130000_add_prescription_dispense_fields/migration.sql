-- Add dispense fields to prescriptions for Sprint 2A (dispenseMedication)
ALTER TABLE "prescriptions" ADD COLUMN "dispensed_by_id" UUID;
ALTER TABLE "prescriptions" ADD COLUMN "dispensed_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "prescriptions_tenant_id_branch_id_status_idx" ON "prescriptions" ("tenant_id", "branch_id", "status");
