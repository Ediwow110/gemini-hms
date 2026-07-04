/*
  Warnings:

  - The `status` column on the `medical_record_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `refill_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `amount` to the `quotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplier_id` to the `receiving_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyer_id` to the `rfqs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `item_id` to the `rfqs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RefillRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "MedicalRecordRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'FULFILLED');

-- AlterEnum
ALTER TYPE "RFQStatus" ADD VALUE 'NEGOTIATION';

-- DropForeignKey
ALTER TABLE "cashier_ledger_entries" DROP CONSTRAINT "cashier_ledger_entries_cashier_session_id_fkey";

-- DropForeignKey
ALTER TABLE "payment_voids" DROP CONSTRAINT "payment_voids_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_payment_id_fkey";

-- AlterTable
ALTER TABLE "marketplace_listings" ADD COLUMN     "base_price" DECIMAL(12,2),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "stock_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "medical_record_requests" ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "MedicalRecordRequestStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "reviewed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "expected_delivery_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "delivery_days" INTEGER,
ADD COLUMN     "warranty_months" INTEGER;

-- AlterTable
ALTER TABLE "receiving_records" ADD COLUMN     "defective_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qualityScore" DECIMAL(3,2),
ADD COLUMN     "supplier_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "refill_requests" ALTER COLUMN "id" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "RefillRequestStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "reviewed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "rfqs" ADD COLUMN     "buyer_id" UUID NOT NULL,
ADD COLUMN     "item_id" UUID NOT NULL,
ADD COLUMN     "leasingOption" TEXT,
ADD COLUMN     "site_readiness_details" TEXT,
ADD COLUMN     "warrantyTier" TEXT;

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "last_sync" TIMESTAMP(3),
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "endpoint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "size" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" TEXT,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "rpo_met" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "backup_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_status" TEXT NOT NULL DEFAULT 'UNPAID',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "marketplace_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "encounters_tenant_id_branch_id_status_encountered_at_idx" ON "encounters"("tenant_id", "branch_id", "status", "encountered_at");

-- CreateIndex
CREATE INDEX "encounters_tenant_id_patient_id_status_idx" ON "encounters"("tenant_id", "patient_id", "status");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_status_created_at_idx" ON "invoices"("tenant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "medical_record_requests_tenant_id_status_idx" ON "medical_record_requests"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "orders_tenant_id_branch_id_status_requested_at_idx" ON "orders"("tenant_id", "branch_id", "status", "requested_at");

-- CreateIndex
CREATE INDEX "orders_tenant_id_order_type_status_idx" ON "orders"("tenant_id", "order_type", "status");

-- CreateIndex
CREATE INDEX "patients_tenant_id_status_created_at_idx" ON "patients"("tenant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "patients_tenant_id_patient_number_idx" ON "patients"("tenant_id", "patient_number");

-- CreateIndex
CREATE INDEX "refill_requests_tenant_id_status_idx" ON "refill_requests"("tenant_id", "status");

-- RenameForeignKey
ALTER TABLE "notification_outbox" RENAME CONSTRAINT "notification_outbox_recipient_id_fkey" TO "notification_outbox_tenant_id_recipient_id_fkey";

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_voids" ADD CONSTRAINT "payment_voids_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashier_ledger_entries" ADD CONSTRAINT "cashier_ledger_entries_cashier_session_id_fkey" FOREIGN KEY ("cashier_session_id") REFERENCES "cashier_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receiving_records" ADD CONSTRAINT "receiving_records_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_records" ADD CONSTRAINT "backup_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
