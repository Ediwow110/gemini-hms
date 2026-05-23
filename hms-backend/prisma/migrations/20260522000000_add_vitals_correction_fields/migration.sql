-- AlterTable
ALTER TABLE "vitals" ADD COLUMN     "error_at" TIMESTAMP(3),
ADD COLUMN     "error_by_id" UUID,
ADD COLUMN     "error_reason" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';
