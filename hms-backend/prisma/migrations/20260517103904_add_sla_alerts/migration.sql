-- CreateTable
CREATE TABLE "sla_alerts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "metric_name" TEXT NOT NULL,
    "threshold_value" DOUBLE PRECISION NOT NULL,
    "actual_value" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIGGERED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sla_alerts_tenant_id_idx" ON "sla_alerts"("tenant_id");

-- AddForeignKey
ALTER TABLE "sla_alerts" ADD CONSTRAINT "sla_alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
