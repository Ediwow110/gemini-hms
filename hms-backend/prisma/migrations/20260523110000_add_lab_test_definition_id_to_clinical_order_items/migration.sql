-- Add nullable labTestDefinitionId FK to ClinicalOrderItem for stable catalog linkage
-- Phase 14F-F: replaces fragile free-text itemName matching with optional FK reference

ALTER TABLE "clinical_order_items"
ADD COLUMN "lab_test_definition_id" UUID;

CREATE INDEX "clinical_order_items_lab_test_definition_id_idx" ON "clinical_order_items"("lab_test_definition_id");

ALTER TABLE "clinical_order_items"
ADD CONSTRAINT "clinical_order_items_lab_test_definition_id_fkey"
FOREIGN KEY ("lab_test_definition_id")
REFERENCES "lab_test_definitions"("id")
ON DELETE SET NULL;
