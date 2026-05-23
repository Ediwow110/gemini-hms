-- CreateTable
CREATE TABLE "triage_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "encounter_id" UUID,
    "queue_entry_id" UUID,
    "acuity_level" TEXT,
    "chief_complaint_summary" TEXT,
    "arrival_mode" TEXT,
    "pain_score" INTEGER,
    "infectious_risk_flag" BOOLEAN NOT NULL DEFAULT false,
    "fall_risk_flag" BOOLEAN NOT NULL DEFAULT false,
    "pregnancy_flag" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "recorded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "triage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "triage_records_tenant_id_patient_id_idx" ON "triage_records"("tenant_id", "patient_id");

-- CreateIndex
CREATE INDEX "triage_records_tenant_id_encounter_id_idx" ON "triage_records"("tenant_id", "encounter_id");

-- AddForeignKey
ALTER TABLE "triage_records" ADD CONSTRAINT "triage_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_records" ADD CONSTRAINT "triage_records_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_records" ADD CONSTRAINT "triage_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_records" ADD CONSTRAINT "triage_records_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_records" ADD CONSTRAINT "triage_records_queue_entry_id_fkey" FOREIGN KEY ("queue_entry_id") REFERENCES "queue_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
