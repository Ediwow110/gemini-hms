-- AlterTable: Add clinical order cancellation fields to orders table
ALTER TABLE "orders" ADD COLUMN "cancelled_reason" TEXT;
ALTER TABLE "orders" ADD COLUMN "cancelled_by_id" UUID;
ALTER TABLE "orders" ADD COLUMN "cancelled_at" TIMESTAMP(3);

-- AddForeignKey for cancelled_by_id
ALTER TABLE "orders" ADD CONSTRAINT "orders_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex for cancelled_by_id
CREATE INDEX "orders_cancelled_by_id_idx" ON "orders"("cancelled_by_id");
