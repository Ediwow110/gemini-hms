-- AlterTable
ALTER TABLE "approval_requests" ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "branch_id" UUID;

-- CreateTable
CREATE TABLE "payment_reversals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "approval_request_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "requested_by" UUID NOT NULL,
    "approved_by" UUID,
    "applied_by" UUID,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "applied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_reversals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_exports" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID,
    "report_type" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "row_count" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "requested_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_reversals_approval_request_id_key" ON "payment_reversals"("approval_request_id");

-- CreateIndex
CREATE INDEX "payment_reversals_tenant_id_idx" ON "payment_reversals"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_reversals_branch_id_idx" ON "payment_reversals"("branch_id");

-- CreateIndex
CREATE INDEX "payment_reversals_payment_id_idx" ON "payment_reversals"("payment_id");

-- CreateIndex
CREATE INDEX "payment_reversals_invoice_id_idx" ON "payment_reversals"("invoice_id");

-- CreateIndex
CREATE INDEX "payment_reversals_status_idx" ON "payment_reversals"("status");

-- CreateIndex
CREATE INDEX "payment_reversals_type_idx" ON "payment_reversals"("type");

-- CreateIndex
CREATE INDEX "report_exports_tenant_id_idx" ON "report_exports"("tenant_id");

-- CreateIndex
CREATE INDEX "report_exports_branch_id_idx" ON "report_exports"("branch_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_branch_id_idx" ON "audit_logs"("branch_id");

-- AddForeignKey
ALTER TABLE "payment_reversals" ADD CONSTRAINT "payment_reversals_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reversals" ADD CONSTRAINT "payment_reversals_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reversals" ADD CONSTRAINT "payment_reversals_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
