-- Create LabSpecimen model for lab order receiving / specimen collection
CREATE TABLE "lab_specimens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "specimen_type" TEXT NOT NULL,
    "accession_number" TEXT,
    "collection_mode" TEXT NOT NULL DEFAULT 'ROUTINE',
    "collected_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_by_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_specimens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lab_specimens_order_id_key" UNIQUE ("order_id")
);

-- Foreign keys
ALTER TABLE "lab_specimens" ADD CONSTRAINT "lab_specimens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_specimens" ADD CONSTRAINT "lab_specimens_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_specimens" ADD CONSTRAINT "lab_specimens_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_specimens" ADD CONSTRAINT "lab_specimens_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_specimens" ADD CONSTRAINT "lab_specimens_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "lab_specimens_tenant_id_idx" ON "lab_specimens"("tenant_id");
CREATE INDEX "lab_specimens_branch_id_idx" ON "lab_specimens"("branch_id");
CREATE INDEX "lab_specimens_order_id_idx" ON "lab_specimens"("order_id");
CREATE INDEX "lab_specimens_tenant_id_branch_id_idx" ON "lab_specimens"("tenant_id", "branch_id");
