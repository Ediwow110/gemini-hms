-- AlterTable: Add clinical order fields to orders table
ALTER TABLE "orders" ADD COLUMN "encounter_id" UUID;
ALTER TABLE "orders" ADD COLUMN "order_type" TEXT;
ALTER TABLE "orders" ADD COLUMN "priority" TEXT DEFAULT 'ROUTINE';
ALTER TABLE "orders" ADD COLUMN "clinical_indication" TEXT;
ALTER TABLE "orders" ADD COLUMN "requested_by_id" UUID;
ALTER TABLE "orders" ADD COLUMN "requested_at" TIMESTAMP(3);

-- AddForeignKey for encounter_id
ALTER TABLE "orders" ADD CONSTRAINT "orders_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for requested_by_id
ALTER TABLE "orders" ADD CONSTRAINT "orders_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex for encounter_id
CREATE INDEX "orders_encounter_id_idx" ON "orders"("encounter_id");

-- CreateIndex for requested_by_id
CREATE INDEX "orders_requested_by_id_idx" ON "orders"("requested_by_id");

-- CreateTable for ClinicalOrderItem
CREATE TABLE "clinical_order_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "item_name" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for clinical_order_items
CREATE INDEX "clinical_order_items_tenant_id_idx" ON "clinical_order_items"("tenant_id");
CREATE INDEX "clinical_order_items_order_id_idx" ON "clinical_order_items"("order_id");

-- AddForeignKey for clinical_order_items
ALTER TABLE "clinical_order_items" ADD CONSTRAINT "clinical_order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clinical_order_items" ADD CONSTRAINT "clinical_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
