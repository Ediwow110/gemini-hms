-- Add encoding and editing metadata to lab_results
ALTER TABLE "lab_results" ADD COLUMN "encoded_by_id" UUID;
ALTER TABLE "lab_results" ADD COLUMN "encoded_at" TIMESTAMP(3);
ALTER TABLE "lab_results" ADD COLUMN "last_edited_by_id" UUID;
ALTER TABLE "lab_results" ADD COLUMN "last_edited_at" TIMESTAMP(3);
