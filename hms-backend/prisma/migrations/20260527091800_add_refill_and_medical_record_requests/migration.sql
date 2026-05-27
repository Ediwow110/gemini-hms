-- CreateTable: refill_requests
CREATE TABLE "refill_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" VARCHAR(500),
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "review_notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "refill_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: medical_record_requests
CREATE TABLE "medical_record_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "request_type" VARCHAR(50) NOT NULL DEFAULT 'FULL_RECORD',
    "reason" VARCHAR(500),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "review_notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "medical_record_requests_pkey" PRIMARY KEY ("id")
);

-- CreateEnum: RefillRequestStatus (enforced at app level via Prisma)
-- CreateEnum: MedicalRecordRequestStatus (enforced at app level via Prisma)

-- CreateIndex
CREATE INDEX "refill_requests_tenant_id_patient_id_idx" ON "refill_requests"("tenant_id", "patient_id");
CREATE INDEX "refill_requests_tenant_id_status_idx" ON "refill_requests"("tenant_id", "status");
CREATE INDEX "medical_record_requests_tenant_id_patient_id_idx" ON "medical_record_requests"("tenant_id", "patient_id");
CREATE INDEX "medical_record_requests_tenant_id_status_idx" ON "medical_record_requests"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "refill_requests" ADD CONSTRAINT "refill_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refill_requests" ADD CONSTRAINT "refill_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refill_requests" ADD CONSTRAINT "refill_requests_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refill_requests" ADD CONSTRAINT "refill_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "medical_record_requests" ADD CONSTRAINT "medical_record_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medical_record_requests" ADD CONSTRAINT "medical_record_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medical_record_requests" ADD CONSTRAINT "medical_record_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
