-- CreateTable
CREATE TABLE "radiology_reports" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "interpretation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FINALIZED',
    "finalized_by_id" UUID NOT NULL,
    "finalized_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radiology_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "radiology_reports_order_id_key" ON "radiology_reports"("order_id");

-- CreateIndex
CREATE INDEX "radiology_reports_tenant_id_idx" ON "radiology_reports"("tenant_id");

-- CreateIndex
CREATE INDEX "radiology_reports_tenant_id_finalized_at_idx" ON "radiology_reports"("tenant_id", "finalized_at");

-- AddForeignKey
ALTER TABLE "radiology_reports" ADD CONSTRAINT "radiology_reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiology_reports" ADD CONSTRAINT "radiology_reports_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;