-- Create LabTestDefinition table for lab test/panel catalog
CREATE TABLE "lab_test_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_test_definitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lab_test_definitions_tenant_id_code_key" UNIQUE ("tenant_id", "code")
);

-- Create LabTestParameterDefinition table for structured result parameters
CREATE TABLE "lab_test_parameter_definitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "test_definition_id" UUID NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unit" TEXT,
    "reference_range_text" TEXT,
    "min_normal" DOUBLE PRECISION,
    "max_normal" DOUBLE PRECISION,
    "min_critical" DOUBLE PRECISION,
    "max_critical" DOUBLE PRECISION,
    "value_type" TEXT NOT NULL DEFAULT 'NUMERIC',
    "allowed_values" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_test_parameter_definitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lab_test_parameter_definitions_tenant_id_test_definition_id_code_key" UNIQUE ("tenant_id", "test_definition_id", "code")
);

-- Create indexes
CREATE INDEX "lab_test_definitions_tenant_id_idx" ON "lab_test_definitions"("tenant_id");
CREATE INDEX "lab_test_parameter_definitions_tenant_id_idx" ON "lab_test_parameter_definitions"("tenant_id");
CREATE INDEX "lab_test_parameter_definitions_test_definition_id_idx" ON "lab_test_parameter_definitions"("test_definition_id");

-- Add foreign keys
ALTER TABLE "lab_test_definitions" ADD CONSTRAINT "lab_test_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "lab_test_parameter_definitions" ADD CONSTRAINT "lab_test_parameter_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
ALTER TABLE "lab_test_parameter_definitions" ADD CONSTRAINT "lab_test_parameter_definitions_test_definition_id_fkey" FOREIGN KEY ("test_definition_id") REFERENCES "lab_test_definitions"("id") ON DELETE CASCADE;
