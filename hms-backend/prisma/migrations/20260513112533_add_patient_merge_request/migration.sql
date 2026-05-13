-- CreateTable
CREATE TABLE "patient_merge_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID,
    "requester_id" UUID NOT NULL,
    "approver_id" UUID,
    "source_patient_id" UUID NOT NULL,
    "target_patient_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "remarks" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'HIGH',
    "field_snapshots" JSONB,
    "applied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_merge_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_merge_requests_tenant_id_idx" ON "patient_merge_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "patient_merge_requests_branch_id_idx" ON "patient_merge_requests"("branch_id");

-- CreateIndex
CREATE INDEX "patient_merge_requests_status_idx" ON "patient_merge_requests"("status");

-- AddForeignKey
ALTER TABLE "patient_merge_requests" ADD CONSTRAINT "patient_merge_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_merge_requests" ADD CONSTRAINT "patient_merge_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_merge_requests" ADD CONSTRAINT "patient_merge_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
