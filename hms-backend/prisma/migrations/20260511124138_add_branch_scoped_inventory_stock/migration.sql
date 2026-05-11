/*
  Warnings:

  - Added the required column `branch_id` to the `stock_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stock_logs" ADD COLUMN     "branch_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "branch_stocks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branch_stocks_tenant_id_idx" ON "branch_stocks"("tenant_id");

-- CreateIndex
CREATE INDEX "branch_stocks_branch_id_idx" ON "branch_stocks"("branch_id");

-- CreateIndex
CREATE INDEX "branch_stocks_inventory_item_id_idx" ON "branch_stocks"("inventory_item_id");

-- CreateIndex
CREATE INDEX "branch_stocks_tenant_id_branch_id_idx" ON "branch_stocks"("tenant_id", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_stocks_tenant_id_branch_id_inventory_item_id_key" ON "branch_stocks"("tenant_id", "branch_id", "inventory_item_id");

-- AddForeignKey
ALTER TABLE "branch_stocks" ADD CONSTRAINT "branch_stocks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_stocks" ADD CONSTRAINT "branch_stocks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_stocks" ADD CONSTRAINT "branch_stocks_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_logs" ADD CONSTRAINT "stock_logs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
