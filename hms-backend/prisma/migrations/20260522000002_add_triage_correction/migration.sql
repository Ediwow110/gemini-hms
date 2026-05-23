-- AlterTable
ALTER TABLE "triage_records" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "triage_records" ADD COLUMN "error_reason" TEXT;
ALTER TABLE "triage_records" ADD COLUMN "error_by_id" UUID;
ALTER TABLE "triage_records" ADD COLUMN "error_at" TIMESTAMP(3);
