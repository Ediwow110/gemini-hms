-- AlterTable
ALTER TABLE "encounters" ADD COLUMN     "archive_reason" TEXT,
ADD COLUMN     "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "archive_reason" TEXT,
ADD COLUMN     "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "lab_results" ADD COLUMN     "archive_reason" TEXT,
ADD COLUMN     "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "archive_reason" TEXT,
ADD COLUMN     "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "archive_reason" TEXT,
ADD COLUMN     "archived_at" TIMESTAMP(3);
