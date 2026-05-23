-- Add validation fields to lab_results for Phase 14C (validateLabResult)
ALTER TABLE "lab_results" ADD COLUMN "validated_by_id" UUID;
ALTER TABLE "lab_results" ADD COLUMN "validated_at" TIMESTAMP(3);
