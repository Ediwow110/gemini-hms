-- Add release fields to lab_results for Phase 14D (releaseLabResult)
ALTER TABLE "lab_results" ADD COLUMN "released_by_id" UUID;
ALTER TABLE "lab_results" ADD COLUMN "released_at" TIMESTAMP(3);
