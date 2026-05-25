/*
  Warnings:

  - Added the required column `tenant_id` to the `installation_jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `installation_jobs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryJobStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'SHIPPED';
ALTER TYPE "OrderStatus" ADD VALUE 'DELIVERED';

-- AlterTable
ALTER TABLE "installation_jobs" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "tenant_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "tracking_number" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "carrier" TEXT,
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "assigned_user_id" UUID NOT NULL,
    "status" "DeliveryJobStatus" NOT NULL DEFAULT 'ASSIGNED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "delivery_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipments_tracking_number_key" ON "shipments"("tracking_number");

-- CreateIndex
CREATE INDEX "shipments_tenant_id_idx" ON "shipments"("tenant_id");

-- CreateIndex
CREATE INDEX "shipments_sales_order_id_idx" ON "shipments"("sales_order_id");

-- CreateIndex
CREATE INDEX "delivery_jobs_tenant_id_idx" ON "delivery_jobs"("tenant_id");

-- CreateIndex
CREATE INDEX "delivery_jobs_shipment_id_idx" ON "delivery_jobs"("shipment_id");

-- CreateIndex
CREATE INDEX "delivery_jobs_assigned_user_id_idx" ON "delivery_jobs"("assigned_user_id");

-- CreateIndex
CREATE INDEX "installation_jobs_tenant_id_idx" ON "installation_jobs"("tenant_id");

-- CreateIndex
CREATE INDEX "installation_jobs_assigned_user_id_idx" ON "installation_jobs"("assigned_user_id");

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_jobs" ADD CONSTRAINT "delivery_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_jobs" ADD CONSTRAINT "delivery_jobs_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_jobs" ADD CONSTRAINT "delivery_jobs_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_jobs" ADD CONSTRAINT "installation_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_jobs" ADD CONSTRAINT "installation_jobs_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
