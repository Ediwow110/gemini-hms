-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- DropForeignKey
ALTER TABLE "clinical_order_items" DROP CONSTRAINT "clinical_order_items_lab_test_definition_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_specimens" DROP CONSTRAINT "lab_specimens_received_by_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_test_definitions" DROP CONSTRAINT "lab_test_definitions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_test_parameter_definitions" DROP CONSTRAINT "lab_test_parameter_definitions_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_test_parameter_definitions" DROP CONSTRAINT "lab_test_parameter_definitions_test_definition_id_fkey";

-- DropForeignKey
ALTER TABLE "triage_records" DROP CONSTRAINT "triage_records_queue_entry_id_fkey";

-- AlterTable
ALTER TABLE "lab_specimens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lab_test_definitions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lab_test_parameter_definitions" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "service_item_id" UUID NOT NULL,
    "supplier_id" UUID,
    "status" "ListingStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "description" TEXT,
    "price_override" DECIMAL(12,2),
    "rejection_reason" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_listings_tenant_id_idx" ON "marketplace_listings"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_listings_status_idx" ON "marketplace_listings"("status");

-- AddForeignKey
ALTER TABLE "clinical_order_items" ADD CONSTRAINT "clinical_order_items_lab_test_definition_id_fkey" FOREIGN KEY ("lab_test_definition_id") REFERENCES "lab_test_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_dispensed_by_id_fkey" FOREIGN KEY ("dispensed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_test_definitions" ADD CONSTRAINT "lab_test_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_test_parameter_definitions" ADD CONSTRAINT "lab_test_parameter_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_test_parameter_definitions" ADD CONSTRAINT "lab_test_parameter_definitions_test_definition_id_fkey" FOREIGN KEY ("test_definition_id") REFERENCES "lab_test_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_service_item_id_fkey" FOREIGN KEY ("service_item_id") REFERENCES "service_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "lab_test_parameter_definitions_tenant_id_test_definition_id_cod" RENAME TO "lab_test_parameter_definitions_tenant_id_test_definition_id_key";
