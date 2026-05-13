-- AlterTable
ALTER TABLE "report_exports" ADD COLUMN     "allowed_fields" JSONB,
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "decided_at" TIMESTAMP(3),
ADD COLUMN     "decided_by_id" UUID,
ADD COLUMN     "decision_reason" TEXT,
ADD COLUMN     "download_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "failure_reason" TEXT,
ADD COLUMN     "field_policy_snapshot" JSONB,
ADD COLUMN     "filters_snapshot" JSONB,
ADD COLUMN     "format" TEXT,
ADD COLUMN     "generated_at" TIMESTAMP(3),
ADD COLUMN     "last_downloaded_at" TIMESTAMP(3),
ADD COLUMN     "masked_fields" JSONB,
ADD COLUMN     "requested_fields" JSONB,
ADD COLUMN     "risk_level" TEXT NOT NULL DEFAULT 'HIGH',
ADD COLUMN     "storage_key" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL',
ALTER COLUMN "completed_at" DROP NOT NULL,
ALTER COLUMN "completed_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
